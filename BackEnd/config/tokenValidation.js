

const jwt = require('jsonwebtoken');
const secretKey = process.env.jwtsecretKey;
const { logWrite } = require('./logfile');
const { getPool } = require('./db');
const { payloadencrypt } = require('./payloadCrypto');

const verifyToken = async (req, res, next) => {

    const authHeader = req.headers['authorization'];
    if (!authHeader) {
        return res.status(401).json({ data: payloadencrypt(JSON.stringify({ msg: 'Access denied. No token provided.' }))});
    }

    const token = authHeader.replace('Bearer ', '');

    try {
        const decoded = jwt.verify(token, secretKey);

        const pool = await getPool();
        const connection = await pool.getConnection();

        const query = `SELECT token 
                       FROM USER_SESSIONS 
                       WHERE user_id = :user_id AND status = 'Y'`;

        const result = await connection.execute(query, [decoded.cnt_no]);

        await connection.close();

        if (!result.rows || result.rows.length === 0) {
            logWrite('No active session found for user: ' + decoded.cnt_no);
            return res.status(401).json({ data: payloadencrypt(JSON.stringify({ msg: 'Session expired or logged in elsewhere.' }))});
        }

        const dbToken = result.rows[0][0];
        let dbTokenStr = '';
        if (dbToken && dbToken.getData) {
            dbTokenStr = await dbToken.getData();
        } else {
            dbTokenStr = dbToken;
        }
        if (dbTokenStr !== token) {
            logWrite('Session token mismatch. DB token: ' + dbTokenStr);
            logWrite('Session token mismatch. req token: ' + token);
            return res.status(401).json({ data: payloadencrypt(JSON.stringify({ msg: 'Session expired or logged in elsewhere.' }))});
        }

        req.user = decoded;
        next();
    } catch (err) {
        logWrite('verifyToken error: ' + err);
        return res.status(403).json({ data: payloadencrypt(JSON.stringify({ msg: 'Invalid or expired token.' }))});
    }
};

module.exports = { verifyToken, secretKey };

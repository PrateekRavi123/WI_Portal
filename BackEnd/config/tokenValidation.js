
const jwt = require('jsonwebtoken');
const secretKey = process.env.jwtsecretKey;
const {logWrite} = require('./logfile')
const { sql, getPool } = require('../config/db');

const verifyToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
        return res.status(401).json({ msg: 'Access denied. No token provided.' });
    }

    const token = authHeader.replace('Bearer ', '');

    try {
        const decoded = jwt.verify(token, secretKey);
    
        const pool = await getPool();
        const session = await pool.request()
            .input('user_id', sql.VarChar, decoded.cnt_no)
            .query('SELECT token FROM USER_SESSIONS WHERE user_id = @user_id AND status = \'Y\'');
    
        if (!session.recordset.length) {
            logWrite('No active session found for user:'+ decoded.cnt_no);
            return res.status(401).json({ msg: 'Session expired or logged in elsewhere.' });
        }
    
        const dbToken = session.recordset[0].token;
        if (dbToken !== token) {
            logWrite('Session token mismatch. DB token:'+ dbToken);
            return res.status(401).json({ msg: 'Session expired or logged in elsewhere.' });
        }
    
        req.user = decoded; 
        next();
    } catch (err) {
        logWrite('verifyToken error:' + err);
        return res.status(403).json({ msg: 'Invalid or expired token.' });
    }
    
};


module.exports = { verifyToken, secretKey };
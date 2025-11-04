const express = require('express');
const oracledb = require('oracledb');
const router = express.Router();
const { getPool } = require('../config/db');
const { verifyToken } = require('../config/tokenValidation');
const { logWrite } = require('../config/logfile');
const { payloadencrypt } = require('../config/payloadCrypto');
const { checkAccess } = require('../config/accessValidation');

// Get All Office Types
router.get('/getallofficetype', verifyToken, checkAccess(['R1']), async (req, res) => {
    let connection;
    try {
        // Establish connection to Oracle DB
        const pool = await getPool();
        connection = await pool.getConnection();
        // Oracle SQL query
        const query = `SELECT ID, NAME FROM OFFICE_TYPE_MST WHERE STATUS = 'Y'`;

        // Execute the query
        const result = await connection.execute(query, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });

        // Send the encrypted response back
        res.json({ data: payloadencrypt(JSON.stringify(result.rows)) });
    } catch (err) {
        logWrite(`Failed to fetch all office types. Error: ${err.message}`);
        res.status(500).json({ data: payloadencrypt(JSON.stringify({ msg: "Failed to fetch all office types." })) });
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                logWrite(`Failed to close Oracle DB connection: ${err.message}`);
            }
        }
    }
});


module.exports = router;
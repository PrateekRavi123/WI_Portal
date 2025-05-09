const express = require('express');
const router = express.Router();
const { sql, getPool } = require('../config/db');
const { smsRegex, emailRegex } = require('../config/inputValidation');
const { verifyToken } = require('../config/tokenValidation');
const { logWrite } = require('../config/logfile')
const { payloadencrypt } = require('../config/payloadCrypto');

router.get('/getallofficetype', verifyToken, async (req, res) => {
    let poolInstance;
    try {
        poolInstance = await getPool();
        const result = await poolInstance.request().query("SELECT ID, NAME FROM OFFICE_TYPE_MST WHERE STATUS = 'Y'"); 
        res.json({ data: payloadencrypt(JSON.stringify(result.recordset)) });
    } catch (err) {
        logWrite(`Failed to fetch all office type. Error: ${err.message}`);
        res.status(500).json({ data: payloadencrypt(JSON.stringify({ message:  "Failed to fetch all office type."})) });
    }
});

module.exports = router;
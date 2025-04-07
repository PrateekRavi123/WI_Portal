const express = require('express');
const router = express.Router();
const { sql, getPool } = require('../config/db');
const { smsRegex, emailRegex } = require('../config/inputValidation');
const { verifyToken } = require('../config/tokenValidation');
const { logWrite } = require('../config/logfile')

router.get('/getallrole', verifyToken, async (req, res) => {
    let poolInstance;
    try {
        poolInstance = await getPool();
        const result = await poolInstance.request().query('SELECT id,ROLE_ID,ROLE_NAME FROM ROLE_MST');
        res.json(result.recordset);
    } catch (err) {
        logWrite(`Failed to fetch all role. Error: ${err.message}`);
        res.status(500).json({ message:  "Failed to fetch all role."});
    }
});

module.exports = router;
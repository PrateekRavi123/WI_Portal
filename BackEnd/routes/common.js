
const express = require('express');
const oracledb = require('oracledb');
const router = express.Router();
const { getPool } = require('../config/db');
const { smsRegex } = require('../config/inputValidation');
const { verifyToken } = require('../config/tokenValidation');
const { logWrite } = require('../config/logfile');
const { payloadencrypt } = require('../config/payloadCrypto');

router.get('/getcircle', verifyToken, async (req, res) => {
    let connection;
    try {
        const pool = await getPool();
        connection = await pool.getConnection();

        const query = 'SELECT ID, NAME FROM DIV_MST WHERE CIRCLE IS NULL';
        const result = await connection.execute(query, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });

        res.json({ data: payloadencrypt(JSON.stringify(result.rows)) });
    } catch (err) {
        logWrite(`Failed to fetch circles. Error: ${err.message}`);
        res.status(500).json({ data: payloadencrypt(JSON.stringify({ message: 'Failed to fetch circles.' })) });
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


router.post('/getdivision', verifyToken, async (req, res) => {
    let connection;
    try {
        const { circle } = req.body;
        if (!circle || circle.trim() === "" || !smsRegex.test(circle)) {
            return res.json({ data: payloadencrypt(JSON.stringify({ message: 'Invalid data.' })) });
        }

        const pool = await getPool();
        connection = await pool.getConnection();

        const query = 'SELECT ID, NAME FROM DIV_MST WHERE TRIM(UPPER(CIRCLE)) = :CIRCLE';
        const result = await connection.execute(query, { CIRCLE: circle.toUpperCase() }, { outFormat: oracledb.OUT_FORMAT_OBJECT });
        res.json({ data: payloadencrypt(JSON.stringify(result.rows)) });
    } catch (err) {
        logWrite(`Failed to fetch divisions. Error: ${err.message}`);
        res.status(500).json({ data: payloadencrypt(JSON.stringify({ message: 'Failed to fetch divisions.' })) });
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

router.post('/getcount', verifyToken, async (req, res) => {
    let connection;
    try {
        const { month } = req.body;
        if (!month || month.trim() === "" || !smsRegex.test(month)) {
            return res.json({ data: payloadencrypt(JSON.stringify({ message: 'Invalid data.' })) });
        }

        const pool = await getPool();
        connection = await pool.getConnection();

        const query = `
            SELECT 
                (SELECT COUNT(*) FROM LOCATION_MST WHERE status = 'Y' ) AS location_Count,
                (SELECT COUNT(*) FROM CHECKLIST_MST WHERE TO_CHAR(CREATED_ON, 'YYYY-MM') = :Month) AS checklist_Count,
                (SELECT COUNT(DISTINCT CHECKLIST_ID) 
                 FROM CHECKLIST_MST_DTLS cm 
                 WHERE cm.status IN ('OK', 'NOT APPLICABLE') 
                 AND NOT EXISTS (SELECT 1 FROM CHECKLIST_MST_DTLS sub 
                                 WHERE sub.CHECKLIST_ID = cm.CHECKLIST_ID 
                                 AND sub.status = 'NOT OK') 
                 AND TO_CHAR(ENTRY_DATE, 'YYYY-MM') = :Month) AS completed_Count,
                (SELECT COUNT(*) 
                 FROM CHECKLIST_MST_DTLS 
                 WHERE status = 'NOT OK' 
                 AND TO_CHAR(ENTRY_DATE, 'YYYY-MM') = :Month) AS pending_Count
            FROM DUAL
        `;
        const result = await connection.execute(query, { Month: month.toUpperCase() }, { outFormat: oracledb.OUT_FORMAT_OBJECT });

        res.json({ data: payloadencrypt(JSON.stringify(result.rows)) });
    } catch (err) {
        logWrite(`Failed to fetch count. Error: ${err.message}`);
        res.status(500).json({ data: payloadencrypt(JSON.stringify({ message: 'Failed to fetch count.' })) });
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

router.post('/getchecklistdivcount', verifyToken, async (req, res) => {
    let connection;
    try {
        const { month } = req.body;
        if (!month || month.trim() === "" || !smsRegex.test(month)) {
            return res.json({ data: payloadencrypt(JSON.stringify({ message: 'Invalid data.' })) });
        }

        const pool = await getPool();
        connection = await pool.getConnection();

        const query = `
            SELECT 
                LTRIM(RTRIM(d.id)) AS div, 
                LTRIM(RTRIM(d.name)) AS divname, 
                COALESCE((
                    SELECT COUNT(*) 
                    FROM CHECKLIST_MST c 
                    WHERE c.div_code = d.id  
                    AND TO_CHAR(c.CREATED_ON, 'YYYY-MM') = :Month
                ), 0) AS checklist_count, 
                (SELECT COUNT(*) FROM LOCATION_MST l WHERE l.DIV_CODE = d.id) AS location_count,
                (SELECT COUNT(*) FROM LOCATION_MST l WHERE l.DIV_CODE = d.id AND l.status = 'Y') AS mandatory_location_count
            FROM DIV_MST d
            WHERE d.CIRCLE IS NOT NULL
            GROUP BY d.id, d.name
        `;
        const result = await connection.execute(query, { Month: month.toUpperCase() }, { outFormat: oracledb.OUT_FORMAT_OBJECT });

        res.json({ data: payloadencrypt(JSON.stringify(result.rows)) });
    } catch (err) {
        logWrite(`Failed to fetch checklist by divisions. Error: ${err.message}`);
        res.status(500).json({ data: payloadencrypt(JSON.stringify({ message: 'Failed to fetch checklist by divisions.' })) });
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

router.post('/getchecklistcirclecount', verifyToken, async (req, res) => {
    let connection;
    try {
        const { month } = req.body;
        if (!month || month.trim() === "" || !smsRegex.test(month)) {
            return res.json({ data: payloadencrypt(JSON.stringify({ message: 'Invalid data.' })) });
        }

        const pool = await getPool();
        connection = await pool.getConnection();

        const query = `
            SELECT 
                LTRIM(RTRIM(d.circle)) AS circle, 
                COUNT(CASE WHEN TO_CHAR(c.CREATED_ON, 'YYYY-MM') = :Month THEN c.DIV_CODE END) AS checklist_count
            FROM DIV_MST d
            LEFT JOIN CHECKLIST_MST c ON d.id = c.DIV_CODE
            WHERE d.CIRCLE IS NOT NULL
            GROUP BY d.circle
        `;
        const result = await connection.execute(query, { Month: month.toUpperCase() }, { outFormat: oracledb.OUT_FORMAT_OBJECT });

        res.json({ data: payloadencrypt(JSON.stringify(result.rows)) });
    } catch (err) {
        logWrite(`Failed to fetch checklist by circle. Error: ${err.message}`);
        res.status(500).json({ data: payloadencrypt(JSON.stringify({ message: 'Failed to fetch checklist by circle.' })) });
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
const express = require('express');
const router = express.Router();
const { sql, getPool } = require('../config/db');
const { smsRegex, emailRegex } = require('../config/inputValidation');
const { verifyToken } = require('../config/tokenValidation');
const { logWrite } = require('../config/logfile')
const { payloadencrypt } = require('../config/payloadCrypto');


router.get('/getcircle', verifyToken, async (req, res) => {
    let poolInstance;
    try {
        poolInstance = await getPool();
        const result = await poolInstance.request().query('SELECT ID, NAME FROM DIV_MST WHERE CIRCLE IS NULL');
        res.json({ data: payloadencrypt(JSON.stringify(result.recordset)) });
    } catch (err) {
        logWrite(`Failed to fetch circles. Error: ${err.message}`);
        res.status(500).json({ data: payloadencrypt(JSON.stringify({ message: 'Failed to fetch circles.' }))});
    }
});

router.post('/getdivision', verifyToken, async (req, res) => {
    let poolInstance;
    try {
        const { circle } = req.body;
        if (!circle || circle.trim() === "" || !smsRegex.test(circle)) {
            return res.json({ data: payloadencrypt(JSON.stringify({ message: 'Invalid data.' }))});
        }
        poolInstance = await getPool();
        const query = 'SELECT ID, NAME FROM DIV_MST WHERE CIRCLE = @CIRCLE';
        const request = await poolInstance.request();
        request.input('CIRCLE', sql.VarChar, circle.toUpperCase());
        const response = await request.query(query);
        res.json({ data: payloadencrypt(JSON.stringify(response.recordset))});
    } catch (err) {
        logWrite(`Failed to fetch divisions. Error: ${err.message}`);
        res.status(500).json({ data: payloadencrypt(JSON.stringify({ message: 'Failed to fetch divisions.' }))});
    }
});

router.post('/getcount', verifyToken, async (req, res) => {
    let poolInstance;
    try {
        const { month } = req.body;
        if (!month || month.trim() === "" || !smsRegex.test(month)) {
            return res.json({ data: payloadencrypt(JSON.stringify({ message: 'Invalid data.' }))});
        }
        poolInstance = await getPool();
        const query = `SELECT 
    (SELECT COUNT(*) FROM CHECKLIST_MST WHERE FORMAT(CREATED_ON, 'yyyy-MM')= @Month) AS checklist_Count,
    (SELECT COUNT(DISTINCT CHECKLIST_ID) FROM CHECKLIST_MST_DTLS cm WHERE status IN ('OK', 'Not Applicable') AND NOT EXISTS ( SELECT 1 FROM CHECKLIST_MST_DTLS sub WHERE sub.CHECKLIST_ID = cm.CHECKLIST_ID AND sub.status = 'Not OK') AND FORMAT(ENTRY_DATE, 'yyyy-MM')= @Month ) AS completed_Count,
    (SELECT COUNT(*) FROM CHECKLIST_MST_DTLS where status = 'NOT OK' AND FORMAT(ENTRY_DATE, 'yyyy-MM')= @Month) AS pending_Count`;
        const request = await poolInstance.request();
        request.input('Month', sql.VarChar, month.toUpperCase());
        const response = await request.query(query);
        res.json({ data: payloadencrypt(JSON.stringify(response.recordset))});
    } catch (err) {
        logWrite(`Failed to fetch count. Error: ${err.message}`);
        res.status(500).json({ data: payloadencrypt(JSON.stringify({ message: 'Failed to fetch count.' }))});
    }
});





router.post('/getchecklistdivcount', verifyToken, async (req, res) => {
    let poolInstance;
    try {
        const { month } = req.body;
        if (!month || month.trim() === "" || !smsRegex.test(month)) {
            return res.json({ data: payloadencrypt(JSON.stringify({ message: 'Invalid data.' }))});
        }
        poolInstance = await getPool();
        const query = `SELECT 
    LTRIM(RTRIM(d.id)) AS div, 
    LTRIM(RTRIM(d.name)) AS divname, 
    COALESCE((
        SELECT COUNT(*) 
        FROM CHECKLIST_MST c 
        WHERE c.div_code = d.id  
        AND FORMAT(c.CREATED_ON, 'yyyy-MM') = @Month
    ), 0) AS checklist_count, 
    (SELECT COUNT(*) FROM LOCATION_MST l WHERE l.DIV_CODE = d.id) AS location_count
FROM DIV_MST d
WHERE d.CIRCLE IS NOT NULL
GROUP BY d.id, d.name;
`;
        const request = await poolInstance.request();
        request.input('Month', sql.VarChar, month.toUpperCase());
        const response = await request.query(query);
        res.json({ data: payloadencrypt(JSON.stringify(response.recordset))});
    } catch (err) {
        logWrite(`Failed to fetch checklist by divisions. Error: ${err.message}`);
        res.status(500).json({ data: payloadencrypt(JSON.stringify({ message: 'Failed to fetch checklist by divisions.' }))});
    }
});


router.post('/getchecklistcirclecount', verifyToken, async (req, res) => {
    let poolInstance;
    try {
        const { month } = req.body;
        if (!month || month.trim() === "" || !smsRegex.test(month)) {
            return res.json({ data: payloadencrypt(JSON.stringify({ message: 'Invalid data.' }))});
        }
        poolInstance = await getPool();
        const query = `SELECT 
    LTRIM(RTRIM(d.circle)) AS circle, 
    COUNT(CASE WHEN FORMAT(c.CREATED_ON, 'yyyy-MM') = @Month THEN c.DIV_CODE END) AS checklist_count
FROM DIV_MST d
LEFT JOIN CHECKLIST_MST c ON d.id = c.DIV_CODE
WHERE d.CIRCLE IS NOT NULL
GROUP BY d.circle;`;
        const request = await poolInstance.request();
        request.input('Month', sql.VarChar, month.toUpperCase());
        const response = await request.query(query);
        res.json({ data: payloadencrypt(JSON.stringify(response.recordset))});
    } catch (err) {
        logWrite(`Failed to fetch checklist by circle. Error: ${err.message}`);
        res.status(500).json({ data: payloadencrypt(JSON.stringify({ message: 'Failed to fetch checklist by circle.' }))});
    }
});




module.exports = router;
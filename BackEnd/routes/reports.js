
const express = require('express');
const oracledb = require('oracledb');
const router = express.Router();
const { getPool } = require('../config/db');
const { smsRegex } = require('../config/inputValidation');
const { verifyToken } = require('../config/tokenValidation');
const { logWrite } = require('../config/logfile');
const { payloadencrypt } = require('../config/payloadCrypto');

router.post('/getnotsubmittedchecklist', verifyToken, async (req, res) => {
    let connection;
    try {
          const { month } = req.body;
        if (!month || month.trim() === "" || !smsRegex.test(month)) {
            return res.json({ data: payloadencrypt(JSON.stringify({ message: 'Invalid data.' })) });
        }
        const pool = await getPool();
        connection = await pool.getConnection();

        const query = `   SELECT 
    lm.LOC_ID,
    lm.LOC_NAME,
    dm.name AS circle,
    dm2.name AS division,
    im.EMP_CODE,
    im.emp_name,
    im.email_id,
    im.mobile_no
FROM INCHARGES_MST im
JOIN WPINSP_USERLOCATIONS ul
    ON ul.EMP_CODE = im.ID
JOIN LOCATION_MST lm
    ON TRIM(UPPER(ul.LOC_ID)) = TRIM(UPPER(lm.LOC_ID))
LEFT JOIN DIV_MST dm
    ON TRIM(UPPER(lm.circle)) = TRIM(UPPER(dm.id))
LEFT JOIN DIV_MST dm2
    ON TRIM(UPPER(lm.div_code)) = TRIM(UPPER(dm2.id))
WHERE im.ROLE_ID = 'R2'
  AND lm.status = 'Y'
  AND NOT EXISTS (
        SELECT 1 
        FROM CHECKLIST_MST cm
        WHERE TRIM(UPPER(cm.LOC_CODE)) = TRIM(UPPER(lm.LOC_ID))
          AND TO_CHAR(cm.CREATED_ON, 'YYYY-MM') = :Month
    )
`;
        const result = await connection.execute(query, { Month: month.toUpperCase() }, { outFormat: oracledb.OUT_FORMAT_OBJECT });
        res.json({ data: payloadencrypt(JSON.stringify(result.rows)) });
    } catch (err) {
        logWrite(`Failed to fetch getnotsubmittedchecklist. Error: ${err.message}`);
        res.status(500).json({ data: payloadencrypt(JSON.stringify({ message: 'Failed to fetch get notsubmitted checklist report.' })) });
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


router.post('/observationsummary', verifyToken, async (req, res) => {
    let connection;
    try {
        const { month } = req.body;
        if (!month || month.trim() === "" || !smsRegex.test(month)) {
            return res.json({ data: payloadencrypt(JSON.stringify({ message: 'Invalid data.' })) });
        }

        const pool = await getPool();
        connection = await pool.getConnection();

        const query = `SELECT 
    cp.id AS checkpoint_id,
    ctm.type_name AS checkpoint_type_name,
    cp.name AS checkpoint_name,
    CASE 
        WHEN cm.loc_code IS NOT NULL THEN 
            TRIM(UPPER(lm.loc_id)) || '(' || TRIM(UPPER(lm.loc_name)) || ')'
        ELSE 
            NULL
    END AS location_ids_not_ok,
    COUNT(cl.checklist_id) AS not_ok_count,
    LISTAGG(cl.checklist_id, ', ') WITHIN GROUP (ORDER BY cl.checklist_id) AS checklist_ids_not_ok,
    LISTAGG(cl.remarks, ' | ') WITHIN GROUP (ORDER BY cl.checklist_id) AS inspection_remark
FROM 
    INSPECTION_CHECKPOINT_MST cp
LEFT JOIN 
    CHECKPOINT_TYPE_MST ctm ON cp.TYPE_ID = ctm.TYPE_ID
LEFT JOIN 
    CHECKLIST_MST_DTLS cl 
    ON cp.id = cl.checkpoint_id
    AND cl.status = 'NOT OK'
    AND TO_CHAR(cl.ENTRY_DATE, 'YYYY-MM') = :month
LEFT JOIN 
    CHECKLIST_MST cm ON cl.checklist_id = cm.checklist_id
LEFT JOIN 
    LOCATION_MST lm ON TRIM(cm.loc_code) = TRIM(lm.loc_id)
GROUP BY 
    cp.id, ctm.type_name, cp.name, lm.loc_id, lm.loc_name, cm.loc_code
ORDER BY 
    cp.id, lm.loc_id
`;
        const result = await connection.execute(query, { Month: month.toUpperCase() }, { outFormat: oracledb.OUT_FORMAT_OBJECT });
        res.json({ data: payloadencrypt(JSON.stringify(result.rows)) });
    } catch (err) {
        logWrite(`Failed to fetch observationsummary. Error: ${err.message}`);
        res.status(500).json({ data: payloadencrypt(JSON.stringify({ message: 'Failed to fetch observation summary report.' })) });
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

router.post('/getcompiledchecksheet', verifyToken, async (req, res) => {
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
    cl.checklist_id,
    dm2.name as circle,
    dm.name as division,
    lm.loc_name AS location,
    otm.name as office_type,
    im.email_id,
    cp.id AS checkpoint_id,
    cp.label AS checkpoint_name,
    cld.status
FROM 
    CHECKLIST_MST cl
left JOIN 
    LOCATION_MST lm ON trim(upper(cl.loc_code)) = trim(upper(lm.loc_id))
left JOIN 
    CHECKLIST_MST_DTLS cld ON trim(upper(cl.checklist_id)) = trim(upper(cld.checklist_id))
left JOIN 
    INSPECTION_CHECKPOINT_MST cp ON trim(upper(cld.checkpoint_id)) = trim(upper(cp.id))
left JOIN 
    DIV_MST dm ON trim(upper(cl.div_code)) = trim(upper(dm.id))
left JOIN 
    DIV_MST dm2 ON trim(upper(lm.circle)) = trim(upper(dm2.id))
left JOIN 
    OFFICE_TYPE_MST otm ON trim(upper(lm.office_type)) = trim(upper(otm.id))
left JOIN 
    incharges_MST im ON trim(upper(cl.EMP_CODE)) = trim(upper(im.EMP_CODE))
WHERE 
    TO_CHAR(cl.created_on, 'YYYY-MM') = :Month
ORDER BY 
    cl.checklist_id, cp.id
        `;
        const result = await connection.execute(query, { Month: month.toUpperCase() }, { outFormat: oracledb.OUT_FORMAT_OBJECT });

         // Pivot data in JS
        const grouped = {};
        for (const row of result.rows) {
            if (!grouped[row.CHECKLIST_ID]) {
                grouped[row.CHECKLIST_ID] = {
                    CHECKLIST_ID: row.CHECKLIST_ID,
                    CIRCLE: row.CIRCLE,
                    DIVISION: row.DIVISION,
                    LOCATION: row.LOCATION,
                    OFFICE_TYPE: row.OFFICE_TYPE,
                    EMAIL_ID: row.EMAIL_ID
                };
            }
            grouped[row.CHECKLIST_ID][row.CHECKPOINT_NAME] = row.STATUS;
        }

        const finalRows = Object.values(grouped);

        res.json({data: payloadencrypt(JSON.stringify(finalRows))});
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



module.exports = router;
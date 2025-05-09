const express = require('express');
const router = express.Router();
const { sql, getPool } = require('../config/db');
const { smsRegex, emailRegex, mobileValidation } = require('../config/inputValidation');
const { verifyToken } = require('../config/tokenValidation');
const { logWrite } = require('../config/logfile')
const { payloadencrypt } = require('../config/payloadCrypto');

router.post('/getchecklist', verifyToken, async (req, res) => {
    let poolInstance;
    try {
        const { checklist_id } = req.body;
        if (!checklist_id || checklist_id.trim() === "" || !smsRegex.test(checklist_id)) {
            return res.status(400).json({ data: payloadencrypt(JSON.stringify({ message:  'Invalid data.'}))});
        }
        poolInstance = await getPool();
        const query = `select cm.CHECKLIST_ID,
cm.EMP_CODE,
	CM.DIV_CODE,
    LTRIM(RTRIM(dm.NAME)) AS DIV,   
	LM.LOC_NAME,
    LTRIM(RTRIM(lm.LOC_NAME)) AS LOC,
	CM.CREATED_ON
from CHECKLIST_MST cm
LEFT JOIN DIV_MST dm ON cm.DIV_CODE = dm.id
LEFT JOIN LOCATION_MST lm ON cm.LOC_CODE = lm.loc_id WHERE CM.CHECKLIST_ID = @CHECKLIST_ID`;
        const request = await poolInstance.request();
        request.input('CHECKLIST_ID', sql.VarChar, checklist_id);
        const result = await request.query(query);
        res.json({ data: payloadencrypt(JSON.stringify(result.recordset))});
    } catch (err) {
        logWrite(`Failed to fetch checklist. Error: ${err.message}`);
        res.status(500).json({ data: payloadencrypt(JSON.stringify({ message:  'Failed to fetch checklist.'}))});
    }
});

router.post('/getchecklistcheckpoint', verifyToken, async (req, res) => {
    let poolInstance;
    try {
        const { checklist_id } = req.body;
        if (!checklist_id || checklist_id.trim() === "" || !smsRegex.test(checklist_id)) {
            return res.status(400).json({ data: payloadencrypt(JSON.stringify({ message:  'Invalid data.'}))});
        }
        poolInstance = await getPool();
        const query = `SELECT 
    icm.id, 
    icm.type_id, 
    t.type_name, 
    icm.NAME, 
    icm.ROLE_ID,
	r.role_name,
	CMD.status,
	CMD.remarks,
	CMD.FILENAME,
	CMD.FILEDATA
FROM CHECKLIST_MST_DTLS CMD
LEFT JOIN INSPECTION_CHECKPOINT_MST icm ON CMD.CHECKPOINT_ID = ICM.ID
LEFT JOIN CHECKPOINT_TYPE_MST t ON icm.type_id = t.TYPE_ID
left join ROLE_MST r on r.ROLE_ID = icm.ROLE_ID
WHERE CMD.CHECKLIST_ID = @CHECKLIST_ID`;
        const request = await poolInstance.request();
        request.input('CHECKLIST_ID', sql.VarChar, checklist_id);
        const result = await request.query(query);
        res.json({ data: payloadencrypt(JSON.stringify(result.recordset))});
    } catch (err) {
        logWrite(`Failed to fetch checklist checkpoint. Error: ${err.message}`);
        res.status(500).json({ data: payloadencrypt(JSON.stringify({ message:  'Failed to fetch checklist checkpoint.'}))});
    }
});

router.post('/getsinglechecklistcheckpoint', verifyToken, async (req, res) => {
    let poolInstance;
    try {
        const { id } = req.body;
        if (!id  || !smsRegex.test(id)) {
            return res.status(400).json({ data: payloadencrypt(JSON.stringify({ message:  'Invalid data.'}))});
        }
        poolInstance = await getPool();
        const query = `SELECT 
    id, 
	remarks,
	FILENAME,
	FILEDATA
FROM CHECKLIST_MST_DTLS 
WHERE id = @id`;
        const request = await poolInstance.request();
        request.input('id', sql.VarChar, id);
        const result = await request.query(query);
        res.json({ data: payloadencrypt(JSON.stringify(result.recordset))});
    } catch (err) {
        logWrite(`Failed to fetch single checklist checkpoint. Error: ${err.message}`);
        res.status(500).json({ data: payloadencrypt(JSON.stringify({ message:  'Failed to fetch checklist checkpoint details.'}))});
    }
});

router.get('/getallchecklists', verifyToken, async (req, res) => {
    let poolInstance;
    try {
        poolInstance = await getPool();
        const result = await poolInstance.request().query(`SELECT 
    cm.id,
    cm.CHECKLIST_ID,
    cm.EMP_CODE,
    LTRIM(RTRIM(dm.NAME)) AS DIV,   
    LTRIM(RTRIM(lm.LOC_NAME)) AS LOC,
    COUNT(CASE WHEN cmd.STATUS = 'OK' THEN 1 END) AS ok,
    COUNT(CASE WHEN cmd.STATUS = 'NOT OK' THEN 1 END) AS notok,
	COUNT(CASE WHEN cmd.STATUS = 'NOT APPLICABLE' THEN 1 END) AS na,
    cm.CREATED_ON
FROM CHECKLIST_MST cm
LEFT JOIN DIV_MST dm ON cm.DIV_CODE = dm.id
LEFT JOIN LOCATION_MST lm ON cm.LOC_CODE = lm.loc_id
LEFT JOIN CHECKLIST_MST_DTLS cmd ON cm.CHECKLIST_ID = cmd.CHECKLIST_ID
GROUP BY cm.id, cm.CHECKLIST_ID, cm.EMP_CODE, dm.NAME, lm.LOC_NAME, cm.CREATED_ON;`);
        res.json({ data: payloadencrypt(JSON.stringify(result.recordset))});
    } catch (err) {
        logWrite(`Failed to fetch all checklists. Error: ${err.message}`);
        res.status(500).json({ data: payloadencrypt(JSON.stringify({ message:  'Failed to fetch all checklists.'}))});
    }
});

router.post('/getmyAllChecklist', verifyToken, async (req, res) => {
    let poolInstance;
    try {
        const { emp_code } = req.body;
        if (!emp_code || emp_code.trim() === "" || !smsRegex.test(emp_code)) {
            return res.status(400).json({ data: payloadencrypt(JSON.stringify({ message:  'Invalid data.'}))});
        }
        poolInstance = await getPool();
        const query = `SELECT 
    cm.id,
    cm.CHECKLIST_ID,
    cm.EMP_CODE,
    LTRIM(RTRIM(dm.NAME)) AS DIV,   
    LTRIM(RTRIM(lm.LOC_NAME)) AS LOC,
    COUNT(CASE WHEN cmd.STATUS = 'OK' THEN 1 END) AS ok,
    COUNT(CASE WHEN cmd.STATUS = 'NOT OK' THEN 1 END) AS notok,
	COUNT(CASE WHEN cmd.STATUS = 'NOT APPLICABLE' THEN 1 END) AS na,
    cm.CREATED_ON
FROM CHECKLIST_MST cm
LEFT JOIN DIV_MST dm ON cm.DIV_CODE = dm.id
LEFT JOIN LOCATION_MST lm ON cm.LOC_CODE = lm.loc_id
LEFT JOIN CHECKLIST_MST_DTLS cmd ON cm.CHECKLIST_ID = cmd.CHECKLIST_ID
WHERE cm.EMP_CODE = @EMP_CODE
GROUP BY cm.id, cm.CHECKLIST_ID, cm.EMP_CODE, dm.NAME, lm.LOC_NAME, cm.CREATED_ON;`;
const request = await poolInstance.request();
        request.input('EMP_CODE', sql.VarChar, emp_code);
        const result = await request.query(query);
        res.json({ data: payloadencrypt(JSON.stringify(result.recordset))});
    } catch (err) {
        logWrite(`Failed to fetch all checklists. Error: ${err.message}`);
        res.status(500).json({ data: payloadencrypt(JSON.stringify({ message:  'Failed to fetch all checklists.'}))});
    }
});

router.get('/getpendingchecklistcheckpoint', verifyToken, async (req, res) => {
    let poolInstance;
    try {
        //const { checklist_id } = req.body;
        // if (!checklist_id || checklist_id.trim() === "" || !smsRegex.test(checklist_id)) {
        //     return res.status(400).json({ message:  'Invalid data.'});
        // }
        poolInstance = await getPool();
        const query = `		SELECT 
	cmd.ID,
	cmd.CHECKLIST_ID,
    t.type_name, 
    icm.NAME, 
    icm.ROLE_ID,
	r.role_name,
	CMD.status,
	LTRIM(RTRIM(dm.NAME)) AS DIV,   
    LTRIM(RTRIM(lm.LOC_NAME)) AS LOC
FROM CHECKLIST_MST_DTLS CMD
LEFT JOIN CHECKLIST_MST CM ON CM.CHECKLIST_ID = CMD.CHECKLIST_ID
LEFT JOIN DIV_MST dm ON CM.DIV_CODE = dm.id
LEFT JOIN LOCATION_MST lm ON CM.LOC_CODE = lm.loc_id
LEFT JOIN INSPECTION_CHECKPOINT_MST icm ON CMD.CHECKPOINT_ID = ICM.ID
LEFT JOIN CHECKPOINT_TYPE_MST t ON icm.type_id = t.TYPE_ID
left join ROLE_MST r on r.ROLE_ID = icm.ROLE_ID
where cmd.STATUS = 'NOT OK'
`;
        const request = await poolInstance.request();
        //request.input('CHECKLIST_ID', sql.VarChar, checklist_id);
        const result = await request.query(query);
        res.json({ data: payloadencrypt(JSON.stringify(result.recordset))});
    } catch (err) {
        logWrite(`Failed to fetch pending checklist checkpoint. Error: ${err.message}`);
        res.status(500).json({ data: payloadencrypt(JSON.stringify({ message:  'Failed to fetch pending checklist checkpoint.'}))});
    }
});

router.post('/getmypendingchecklistcheckpoint', verifyToken, async (req, res) => {
    let poolInstance;
    try {
        const { emp_code } = req.body;
        if (!emp_code || emp_code.trim() === "" || !smsRegex.test(emp_code)) {
            return res.status(400).json({ data: payloadencrypt(JSON.stringify({ message:  'Invalid data.'}))});
        }
        poolInstance = await getPool();
        const query = `		SELECT 
	cmd.ID,
	cmd.CHECKLIST_ID,
    t.type_name, 
    icm.NAME, 
    icm.ROLE_ID,
	r.role_name,
	CMD.status,
	LTRIM(RTRIM(dm.NAME)) AS DIV,   
    LTRIM(RTRIM(lm.LOC_NAME)) AS LOC
FROM CHECKLIST_MST_DTLS CMD
LEFT JOIN CHECKLIST_MST CM ON CM.CHECKLIST_ID = CMD.CHECKLIST_ID
LEFT JOIN DIV_MST dm ON CM.DIV_CODE = dm.id
LEFT JOIN LOCATION_MST lm ON CM.LOC_CODE = lm.loc_id
LEFT JOIN INSPECTION_CHECKPOINT_MST icm ON CMD.CHECKPOINT_ID = ICM.ID
LEFT JOIN CHECKPOINT_TYPE_MST t ON icm.type_id = t.TYPE_ID
left join ROLE_MST r on r.ROLE_ID = icm.ROLE_ID
where cmd.STATUS = 'NOT OK' AND r.ROLE_ID = 'R2'
AND cm.EMP_CODE = @EMP_CODE
`;
        const request = await poolInstance.request();
        request.input('EMP_CODE', sql.VarChar, emp_code);
        const result = await request.query(query);
        res.json({ data: payloadencrypt(JSON.stringify(result.recordset))});
    } catch (err) {
        logWrite(`Failed to fetch my pending checklist checkpoint. Error: ${err.message}`);
        res.status(500).json({ data: payloadencrypt(JSON.stringify({ message:  'Failed to fetch my pending checklist checkpoint.'}))});
    }
});
router.post('/getrolependingchecklistcheckpoint', verifyToken, async (req, res) => {
    let poolInstance;
    try {
        const { roleId } = req.body;
        if (!roleId || roleId.trim() === "" || !smsRegex.test(roleId)) {
            return res.status(400).json({ data: payloadencrypt(JSON.stringify({ message:  'Invalid data.'}))});
        }
        poolInstance = await getPool();
        const query = `		SELECT 
	cmd.ID,
	cmd.CHECKLIST_ID,
    t.type_name, 
    icm.NAME, 
    icm.ROLE_ID,
	r.role_name,
	CMD.status,
	LTRIM(RTRIM(dm.NAME)) AS DIV,   
    LTRIM(RTRIM(lm.LOC_NAME)) AS LOC
FROM CHECKLIST_MST_DTLS CMD
LEFT JOIN CHECKLIST_MST CM ON CM.CHECKLIST_ID = CMD.CHECKLIST_ID
LEFT JOIN DIV_MST dm ON CM.DIV_CODE = dm.id
LEFT JOIN LOCATION_MST lm ON CM.LOC_CODE = lm.loc_id
LEFT JOIN INSPECTION_CHECKPOINT_MST icm ON CMD.CHECKPOINT_ID = ICM.ID
LEFT JOIN CHECKPOINT_TYPE_MST t ON icm.type_id = t.TYPE_ID
left join ROLE_MST r on r.ROLE_ID = icm.ROLE_ID
where cmd.STATUS = 'NOT OK' AND r.ROLE_ID = @ROLE_ID
`;
        const request = await poolInstance.request();
        request.input('ROLE_ID', sql.VarChar, roleId);
        const result = await request.query(query);
        res.json({ data: payloadencrypt(JSON.stringify(result.recordset))});
    } catch (err) {
        logWrite(`Failed to fetch role pending checklist checkpoint. Error: ${err.message}`);
        res.status(500).json({ data: payloadencrypt(JSON.stringify({ message:  'Failed to fetch role pending checklist checkpoint.'}))});
    }
});

const multer = require('multer');

const fs = require('fs');


// Configure multer for file uploads
const storage = multer.memoryStorage(); // Stores files in memory as Buffer
const upload = multer({ storage: storage });
const allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/jpg',
    'application/pdf',
    'application/msword', // .doc
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    'application/vnd.ms-excel', // .xls
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' // .xlsx
];

router.post('/addchecklist', verifyToken, upload.array('files'), async (req, res) => {
    try {
        const { checklist_id, emp_code, div, loc, checkpoint } = req.body;
        let parsedCheckpoint;
        
        try {
            parsedCheckpoint = JSON.parse(checkpoint); // Parse checkpoint JSON
        } catch (error) {
            logWrite(`Failed to add checklist. Error: Parse checkpoint JSON`);
            return res.status(400).json({ data: payloadencrypt(JSON.stringify({ message: 'Invalid checkpoint format.' }))});
        }

        if (!emp_code || !div || !loc || !Array.isArray(parsedCheckpoint) || parsedCheckpoint.length === 0) {
            logWrite(`Failed to add checklist. Error: empty field`);
            return res.status(400).json({ data: payloadencrypt(JSON.stringify({ message: 'Invalid data.' }))});
        }

        for (const item of parsedCheckpoint) {
            if (!item.checkpoint_id || !item.status) {
                logWrite(`Failed to add checklist. Error: Checkpoint validation`);
                return res.status(400).json({ data: payloadencrypt(JSON.stringify({ message: 'Invalid checkpoint data.' }))});
            }
        }

        // File validation
        for (const file of req.files) {
            const { fileTypeFromBuffer } = await import('file-type');
            const fileType = await fileTypeFromBuffer(file.buffer);
            if (!allowedMimeTypes.includes(fileType.mime) || file.size > 10 * 1024 * 1024) {
                logWrite(`Failed to add checklist. Error: File validation ${fileType.mime},${file.size}`);
                return res.status(400).json({ data: payloadencrypt(JSON.stringify({ message: 'Invalid checkpoint data.' })) });
            }
        }

        const pool = await getPool();
        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            // Insert into CHECKLIST_MST
            const request1 = new sql.Request(transaction);
            await request1
                .input('CHECKLIST_ID', sql.VarChar, checklist_id.toUpperCase())
                .input('EMP_CODE', sql.VarChar, emp_code.toUpperCase())
                .input('DIVISION', sql.VarChar, div.toUpperCase())
                .input('LOCATION', sql.VarChar, loc.toUpperCase())
                .query(`
                    INSERT INTO CHECKLIST_MST (CHECKLIST_ID, EMP_CODE, DIV_CODE, LOC_CODE)
                    VALUES (@CHECKLIST_ID, @EMP_CODE, @DIVISION, @LOCATION)
                `);

            // Map uploaded files by filename
            const fileMap = {};
            req.files.forEach(file => {
                fileMap[file.originalname] = file.buffer; // Store as buffer
            });

            // Insert into CHECKLIST_MST_DTLS for each checkpoint
            for (const item of parsedCheckpoint) {
                const request2 = new sql.Request(transaction);
                await request2
                    .input('CHECKLIST_ID', sql.VarChar, checklist_id.toUpperCase())
                    .input('CHECKPOINT_ID', sql.VarChar, item.checkpoint_id.toUpperCase())
                    .input('EMP_CODE', sql.VarChar, emp_code.toUpperCase())
                    .input('STATUS', sql.VarChar, item.status.toUpperCase())
                    .input('REMARKS', sql.VarChar, item.remarks || null)
                    .input('FILENAME', sql.VarChar, item.filename || null)
                    .input('FILEDATA', sql.VarBinary, item.filename && fileMap[item.filename] ? fileMap[item.filename] : null)
                    .query(`
                        INSERT INTO CHECKLIST_MST_DTLS (CHECKLIST_ID, CHECKPOINT_ID, EMP_CODE, STATUS, REMARKS, FILENAME, FILEDATA)
                        VALUES (@CHECKLIST_ID, @CHECKPOINT_ID, @EMP_CODE, @STATUS, @REMARKS, @FILENAME, @FILEDATA)
                    `);
            }

            await transaction.commit();
            return res.status(200).json({ data: payloadencrypt(JSON.stringify({ message: 'Checklist and checkpoints added successfully.' }))});

        } catch (error) {
            await transaction.rollback();
            logWrite(`Failed to add checklist. Error: ${error.message}`);
            return res.status(500).json({ data: payloadencrypt(JSON.stringify({ message: 'Failed to add checklist and checkpoints.'}))});
        }

    } catch (error) {
        logWrite(`Failed to add checklist. Error: ${error.message}`);
        return res.status(500).json({ data: payloadencrypt(JSON.stringify({ message: 'Failed to add checklist and checkpoints.' }))});
    }
});




router.patch('/updateincharge', verifyToken, async (req, res) => {
    const { emp_code, emp_name, email_id, mob, circle, div, loc, role, status, updated_by } = req.body;

    if (!emp_code || !emp_name || !email_id || !mob || !circle || !div || !loc || !role || !status ||
        !updated_by || emp_code.trim() === "" || emp_name.trim() === "" || email_id.trim() === "" ||
        mob.trim() === "" || circle.trim() === "" || div.trim() === "" || loc.trim() === "" ||
        role.trim() === "" || status.trim() === "" || updated_by.trim() === "" || !smsRegex.test(emp_code) ||
        !smsRegex.test(emp_name) || !emailRegex.test(email_id) || !mobileValidation.test(mob) ||
        !smsRegex.test(circle) || !smsRegex.test(div) || !smsRegex.test(loc) || !smsRegex.test(role) || !smsRegex.test(status) ||
        !smsRegex.test(updated_by)) {
        return res.status(400).json({ data: payloadencrypt(JSON.stringify({ message:  'Invalid data.'}))});
    }
    try {
        const pool = await getPool();

        const query = `UPDATE INCHARGES_MST SET EMP_NAME = @EMP_NAME, EMAIL_ID = @EMAIL_ID, MOBILE_NO = @MOBILE_NO, CIRCLE = @CIRCLE, DIVISION = @DIVISION, LOCATION = @LOCATION, ROLE = @ROLE,STATUS = @STATUS, UPDATED_BY = @UPDATED_BY, UPDATED_ON = GETDATE() WHERE EMP_CODE = @EMP_CODE`;
        const request = await pool.request();
        request.input('EMP_NAME', sql.VarChar, emp_name.toUpperCase());
        request.input('EMAIL_ID', sql.VarChar, email_id.toUpperCase());
        request.input('MOBILE_NO', sql.VarChar, mob.toUpperCase());
        request.input('CIRCLE', sql.VarChar, circle.toUpperCase());
        request.input('DIVISION', sql.VarChar, div.toUpperCase());
        request.input('LOCATION', sql.VarChar, loc.toUpperCase());
        request.input('ROLE', sql.VarChar, role.toUpperCase());
        request.input('STATUS', sql.VarChar, status.toUpperCase());
        request.input('UPDATED_BY', sql.VarChar, updated_by.toUpperCase());
        request.input('EMP_CODE', sql.VarChar, emp_code.toUpperCase());
        const response = await request.query(query);
        if (response.rowsAffected && response.rowsAffected[0] === 1) {
            return res.status(200).json({ data: payloadencrypt(JSON.stringify({ message:  'Incharge updated successfully'}))});
        } else {
            logWrite(`Failed to update incharge. Response: ${JSON.stringify(response)}`);
            return res.status(500).json({ data: payloadencrypt(JSON.stringify({  message: 'Failed to update incharge.'}))});
        }
    }
    catch (e) {
        logWrite(`Failed to update incharge. Error: ${e.message}`);
        res.status(500).json({ data: payloadencrypt(JSON.stringify({  message: 'Failed to update incharge.'}))});
    }
});

router.delete('/deletechecklist', verifyToken, async (req, res) => {
    try {
        const { checklist_id } = req.body;
        if (!checklist_id || checklist_id.trim() === "" || !smsRegex.test(checklist_id)) {
            return res.status(400).json({ data: payloadencrypt(JSON.stringify({ message:  'Invalid data.'}))});
        }


        const pool = await getPool();
        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            // delete into CHECKLIST_MST
            const request1 = new sql.Request(transaction);
            await request1
                .input('CHECKLIST_ID', sql.VarChar, checklist_id.toUpperCase())
                .query(`
                    DELETE  FROM CHECKLIST_MST_DTLS WHERE CHECKLIST_ID = @CHECKLIST_ID
                `);

            // DELETE into CHECKLIST_MST 
                const request2 = new sql.Request(transaction);
                await request2
                    .input('CHECKLIST_ID', sql.VarChar, checklist_id.toUpperCase())
                    .query(`
                        DELETE  FROM CHECKLIST_MST WHERE CHECKLIST_ID = @CHECKLIST_ID
                    `);

            await transaction.commit();
            return res.status(200).json({ data: payloadencrypt(JSON.stringify({ message: 'Checklist and checkpoints deleted successfully.' }))});

        } catch (error) {
            await transaction.rollback();
            logWrite(`Failed to delete checklist. Error: ${error.message}`);
            return res.status(500).json({ data: payloadencrypt(JSON.stringify({ message: 'Failed to delete checklist and checkpoints.'}))});
        }

    } catch (error) {
        logWrite(`Failed to delete checklist. Error: ${error.message}`);
        return res.status(500).json({ data: payloadencrypt(JSON.stringify({ message: 'Failed to delete checklist and checkpoints.' }))});
    }
});

module.exports = router;
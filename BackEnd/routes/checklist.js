
const express = require('express');
const OracleDB = require('oracledb');
const router = express.Router();
const { getPool } = require('../config/db');
const { smsRegex } = require('../config/inputValidation');
const { verifyToken } = require('../config/tokenValidation');
const { logWrite } = require('../config/logfile');
const { payloadencrypt } = require('../config/payloadCrypto');

router.post('/getchecklist', verifyToken, async (req, res) => {
    let connection;
    try {
        const { checklist_id } = req.body;
        
        // Validate checklist_id
        if (!checklist_id || checklist_id.trim() === "" || !smsRegex.test(checklist_id)) {
            return res.status(400).json({ data: payloadencrypt(JSON.stringify({ message: 'Invalid data.' })) });
        }

        const pool = await getPool(); // Get Oracle connection pool
        const query = `
            SELECT cm.CHECKLIST_ID,
                   cm.EMP_CODE,
                   cm.DIV_CODE,
                   TRIM(dm.NAME) AS DIV,
                   lm.LOC_NAME,
                   TRIM(lm.LOC_NAME) AS LOC,
                   cm.CREATED_ON
            FROM CHECKLIST_MST cm
            LEFT JOIN DIV_MST dm ON cm.DIV_CODE = dm.id
            LEFT JOIN LOCATION_MST lm ON TRIM(UPPER(cm.LOC_CODE)) = TRIM(UPPER(lm.loc_id))
            WHERE CM.CHECKLIST_ID = :CHECKLIST_ID
        `;
        
         connection = await pool.getConnection(); // Get a connection from the pool
        
        // Execute the query with parameter binding
        const result = await connection.execute(query, [checklist_id], { outFormat: OracleDB.OUT_FORMAT_OBJECT });

        
        if (result.rows && result.rows.length > 0) {
            // Convert the result rows to the desired format
            const responseData = result.rows.map(row => ({
                CHECKLIST_ID: row.CHECKLIST_ID,
                EMP_CODE: row.EMP_CODE,
                DIV_CODE: row.DIV_CODE,
                DIV: row.DIV,
                LOC: row.LOC,
                CREATED_ON: row.CREATED_ON
            }));
     
            res.json({ data: payloadencrypt(JSON.stringify(responseData)) });
        } else {
            res.status(404).json({ data: payloadencrypt(JSON.stringify({ message: 'Checklist not found.' })) });
        }

    } catch (err) {
        logWrite(`Failed to fetch checklist. Error: ${err.message}`);
        res.status(500).json({ data: payloadencrypt(JSON.stringify({ message: 'Failed to fetch checklist.' })) });
    }finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                logWrite(`Failed to close Oracle DB connection: ${err.message}`);
            }
        }
    }
});

const convertLobToBase64 = (lob) => {
    return new Promise((resolve, reject) => {
        const chunks = [];
        lob.on('data', chunk => chunks.push(chunk));
        lob.on('end', () => resolve(Buffer.concat(chunks).toString('base64')));
        lob.on('error', err => reject(err));
    });
};

router.post('/getchecklistcheckpoint', verifyToken, async (req, res) => {
    let connection;
    try {
        const { checklist_id } = req.body;

        if (!checklist_id || checklist_id.trim() === "" || !smsRegex.test(checklist_id)) {
            return res.status(400).json({ data: payloadencrypt(JSON.stringify({ message: 'Invalid data.' })) });
        }

        const poolInstance = await getPool();
        connection = await poolInstance.getConnection();

        const query = `
            SELECT 
                icm.id, 
                icm.type_id, 
                t.type_name, 
                icm.NAME, 
                icm.ROLE_ID,
                r.role_name,
                CMD.status,
                CMD.remarks,
                CMD.FILENAME,
                CMD.FILEDATA,
                CMD.FILENAME2,
                CMD.FILEDATA2,
                CMD.FILENAME3,
                CMD.FILEDATA3
            FROM CHECKLIST_MST_DTLS CMD
            LEFT JOIN INSPECTION_CHECKPOINT_MST icm ON CMD.CHECKPOINT_ID = icm.ID
            LEFT JOIN CHECKPOINT_TYPE_MST t ON icm.type_id = t.TYPE_ID
            LEFT JOIN ROLE_MST r ON r.ROLE_ID = icm.ROLE_ID
            WHERE CMD.CHECKLIST_ID = :CHECKLIST_ID
        `;

        const result = await connection.execute(query, [checklist_id], {
            outFormat: OracleDB.OUT_FORMAT_OBJECT
        });

        const rows = await Promise.all(result.rows.map(async row => {
            if (row.FILEDATA?.constructor?.name === 'Lob') row.FILEDATA = await convertLobToBase64(row.FILEDATA);
            if (row.FILEDATA2?.constructor?.name === 'Lob') row.FILEDATA2 = await convertLobToBase64(row.FILEDATA2);
            if (row.FILEDATA3?.constructor?.name === 'Lob') row.FILEDATA3 = await convertLobToBase64(row.FILEDATA3);
            return row;
        }));

        res.json({ data: payloadencrypt(JSON.stringify(rows)) });

    } catch (err) {
        logWrite(`Failed to fetch checklist checkpoint. Error: ${err.message}`);
        res.status(500).json({ data: payloadencrypt(JSON.stringify({ message: 'Failed to fetch checklist checkpoint.' })) });
    } finally {
        if (connection) {
            try { await connection.close(); } 
            catch (err) { logWrite(`Failed to close Oracle DB connection: ${err.message}`); }
        }
    }
});

const getLOBBase64 = lob =>
  new Promise((resolve, reject) => {
    if (!lob) return resolve(null);
    const chunks = [];
    lob.on('data', chunk => chunks.push(chunk));
    lob.on('end', () => resolve(Buffer.concat(chunks).toString('base64')));
    lob.on('error', err => reject(err));
  });

router.post('/getsinglechecklistcheckpoint', verifyToken, async (req, res) => {
  let connection;
  try {
    const { id } = req.body;

    if (!id || !smsRegex.test(id)) {
      return res.status(400).json({ data: payloadencrypt(JSON.stringify({ message: 'Invalid data.' })) });
    }

    const pool = await getPool();
    connection = await pool.getConnection();

    const query = `
      SELECT 
        id, 
        remarks,
        FILENAME, FILEDATA,
        FILENAME2, FILEDATA2,
        FILENAME3, FILEDATA3
      FROM CHECKLIST_MST_DTLS 
      WHERE id = :id
    `;

    const result = await connection.execute(query, [id], { outFormat: OracleDB.OUT_FORMAT_OBJECT });

    const rows = await Promise.all(result.rows.map(async row => {
      row.FILEDATA = await getLOBBase64(row.FILEDATA);
      row.FILEDATA2 = await getLOBBase64(row.FILEDATA2);
      row.FILEDATA3 = await getLOBBase64(row.FILEDATA3);
      return row;
    }));

    res.json({ data: payloadencrypt(JSON.stringify(rows)) });

  } catch (err) {
    logWrite(`Failed to fetch single checklist checkpoint. Error: ${err.message}`);
    res.status(500).json({ data: payloadencrypt(JSON.stringify({ message: 'Failed to fetch checklist checkpoint details.' })) });
  } finally {
    if (connection) {
      try { await connection.close(); } 
      catch (err) { logWrite(`Failed to close Oracle DB connection: ${err.message}`); }
    }
  }
});

router.get('/getallchecklists', verifyToken, async (req, res) => {
    let connection;
    try {
       const  poolInstance = await getPool();
        const query = `
            SELECT 
                cm.id,
                cm.CHECKLIST_ID,
                cm.EMP_CODE,
                TRIM(dm.NAME) AS DIV,   
                TRIM(lm.LOC_NAME) AS LOC,
                COUNT(CASE WHEN cmd.STATUS = 'OK' THEN 1 END) AS ok,
                COUNT(CASE WHEN cmd.STATUS = 'NOT OK' THEN 1 END) AS notok,
                COUNT(CASE WHEN cmd.STATUS = 'NOT APPLICABLE' THEN 1 END) AS na,
                cm.CREATED_ON
            FROM CHECKLIST_MST cm
            LEFT JOIN DIV_MST dm ON cm.DIV_CODE = dm.id
            LEFT JOIN LOCATION_MST lm ON TRIM(cm.LOC_CODE) = TRIM(lm.loc_id)
            LEFT JOIN CHECKLIST_MST_DTLS cmd ON cm.CHECKLIST_ID = cmd.CHECKLIST_ID
            GROUP BY cm.id, cm.CHECKLIST_ID, cm.EMP_CODE, dm.NAME, lm.LOC_NAME, cm.CREATED_ON
        `;

         connection = await poolInstance.getConnection();
        const result = await connection.execute(query, [], {
            outFormat: OracleDB.OUT_FORMAT_OBJECT
        });
      
     res.json({ data: payloadencrypt(JSON.stringify(result.rows)) });
    } catch (err) {
        logWrite(`Failed to fetch all checklists. Error: ${err.message}`);
        res.status(500).json({ data: payloadencrypt(JSON.stringify({ message: 'Failed to fetch all checklists.' })) });
    }finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                logWrite(`Failed to close Oracle DB connection: ${err.message}`);
            }
        }
    }
});

router.post('/getmyAllChecklist', verifyToken, async (req, res) => {
    let connection;
    try {
        const { emp_code } = req.body;
        if (!emp_code || emp_code.trim() === "" || !smsRegex.test(emp_code)) {
            return res.status(400).json({ data: payloadencrypt(JSON.stringify({ message: 'Invalid data.' })) });
        }

        const poolInstance = await getPool();
        connection = await poolInstance.getConnection();

        // const query = `
        //     SELECT 
        //         cm.id,
        //         cm.CHECKLIST_ID,
        //         cm.EMP_CODE,
        //         TRIM(dm.NAME) AS DIV,   
        //         TRIM(lm.LOC_NAME) AS LOC,
        //         COUNT(CASE WHEN cmd.STATUS = 'OK' THEN 1 END) AS ok,
        //         COUNT(CASE WHEN cmd.STATUS = 'NOT OK' THEN 1 END) AS notok,
        //         COUNT(CASE WHEN cmd.STATUS = 'NOT APPLICABLE' THEN 1 END) AS na,
        //         cm.CREATED_ON
        //     FROM CHECKLIST_MST cm
        //     LEFT JOIN DIV_MST dm ON cm.DIV_CODE = dm.id
        //     LEFT JOIN LOCATION_MST lm ON TRIM(cm.LOC_CODE) = TRIM(lm.loc_id)
        //     LEFT JOIN CHECKLIST_MST_DTLS cmd ON cm.CHECKLIST_ID = cmd.CHECKLIST_ID
        //     INNER JOIN WPINSP_UserLocations ul ON ul.LOC_ID = cm.LOC_CODE
        //     INNER JOIN INCHARGES_MST im ON im.ID = ul.EMP_ID
        //     WHERE im.ID = :EMP_CODE
        //     GROUP BY cm.id, cm.CHECKLIST_ID, cm.EMP_CODE, dm.NAME, lm.LOC_NAME, cm.CREATED_ON
        //     ORDER BY cm.CREATED_ON DESC
        // `;

        const query = `
            SELECT 
                cm.id,
                cm.CHECKLIST_ID,
                cm.EMP_CODE,
                TRIM(dm.NAME) AS DIV,   
                TRIM(lm.LOC_NAME) AS LOC,
                COUNT(CASE WHEN cmd.STATUS = 'OK' THEN 1 END) AS ok,
                COUNT(CASE WHEN cmd.STATUS = 'NOT OK' THEN 1 END) AS notok,
                COUNT(CASE WHEN cmd.STATUS = 'NOT APPLICABLE' THEN 1 END) AS na,
                cm.CREATED_ON
            FROM CHECKLIST_MST cm
            LEFT JOIN DIV_MST dm ON cm.DIV_CODE = dm.id
            LEFT JOIN LOCATION_MST lm ON TRIM(cm.LOC_CODE) = TRIM(lm.loc_id)
            LEFT JOIN CHECKLIST_MST_DTLS cmd ON cm.CHECKLIST_ID = cmd.CHECKLIST_ID
            WHERE CM.EMP_CODE = :EMP_CODE
            GROUP BY cm.id, cm.CHECKLIST_ID, cm.EMP_CODE, dm.NAME, lm.LOC_NAME, cm.CREATED_ON
        `;

        const result = await connection.execute(
            query,
            { EMP_CODE: emp_code.toUpperCase() },
            { outFormat: OracleDB.OUT_FORMAT_OBJECT }
        );

        res.json({ data: payloadencrypt(JSON.stringify(result.rows)) });
    } catch (err) {
        logWrite(`Failed to fetch all checklists. Error: ${err.message}`);
        res.status(500).json({ data: payloadencrypt(JSON.stringify({ message: 'Failed to fetch all checklists.' })) });
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

router.get('/getpendingchecklistcheckpoint', verifyToken, async (req, res) => {
    let connection;
    try {
        const poolInstance = await getPool();
        const query = `
            SELECT 
                cmd.ID,
                cmd.CHECKLIST_ID,
                t.type_name, 
                icm.NAME, 
                icm.ROLE_ID,
                r.role_name,
                cmd.STATUS,
                TRIM(dm.NAME) AS DIV,   
                TRIM(lm.LOC_NAME) AS LOC,
                cmd.ENTRY_DATE AS CREATED_ON
            FROM CHECKLIST_MST_DTLS cmd
            LEFT JOIN CHECKLIST_MST cm ON cm.CHECKLIST_ID = cmd.CHECKLIST_ID
            LEFT JOIN DIV_MST dm ON cm.DIV_CODE = dm.id
            LEFT JOIN LOCATION_MST lm ON TRIM(cm.LOC_CODE) = TRIM(lm.loc_id)
            LEFT JOIN INSPECTION_CHECKPOINT_MST icm ON cmd.CHECKPOINT_ID = icm.ID
            LEFT JOIN CHECKPOINT_TYPE_MST t ON icm.type_id = t.TYPE_ID
            LEFT JOIN ROLE_MST r ON r.ROLE_ID = icm.ROLE_ID
            WHERE cmd.STATUS = 'NOT OK'
        `;

         connection = await poolInstance.getConnection();
        const result = await connection.execute(query, [], {
            outFormat: OracleDB.OUT_FORMAT_OBJECT
        });


      res.json({ data: payloadencrypt(JSON.stringify(result.rows)) });
    } catch (err) {
        logWrite(`Failed to fetch pending checklist checkpoint. Error: ${err.message}`);
        res.status(500).json({ data: payloadencrypt(JSON.stringify({ message: 'Failed to fetch pending checklist checkpoint.' })) });
    }finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                logWrite(`Failed to close Oracle DB connection: ${err.message}`);
            }
        }
    }
});

router.post('/getmypendingchecklistcheckpoint', verifyToken, async (req, res) => {
    let connection;
    try {
        const { emp_code } = req.body;
        if (!emp_code || emp_code.trim() === "" || !smsRegex.test(emp_code)) {
            return res.status(400).json({ data: payloadencrypt(JSON.stringify({ message: 'Invalid data.' })) });
        }

        const poolInstance = await getPool();
        const query = `
            SELECT 
                cmd.ID,
                cmd.CHECKLIST_ID,
                t.type_name, 
                icm.NAME, 
                icm.ROLE_ID,
                r.role_name,
                cmd.STATUS,
                TRIM(dm.NAME) AS DIV,   
                TRIM(lm.LOC_NAME) AS LOC,
                cmd.ENTRY_DATE AS CREATED_ON
            FROM CHECKLIST_MST_DTLS cmd
            LEFT JOIN CHECKLIST_MST cm ON cm.CHECKLIST_ID = cmd.CHECKLIST_ID
            LEFT JOIN DIV_MST dm ON cm.DIV_CODE = dm.id
            LEFT JOIN LOCATION_MST lm ON TRIM(cm.LOC_CODE) = TRIM(lm.loc_id)
            LEFT JOIN INSPECTION_CHECKPOINT_MST icm ON cmd.CHECKPOINT_ID = icm.ID
            LEFT JOIN CHECKPOINT_TYPE_MST t ON icm.type_id = t.TYPE_ID
            LEFT JOIN ROLE_MST r ON r.ROLE_ID = icm.ROLE_ID
            WHERE cmd.STATUS = 'NOT OK'
              AND r.ROLE_ID = 'R2'
              AND cm.EMP_CODE = :EMP_CODE
        `;

         connection = await poolInstance.getConnection();
        const result = await connection.execute(query, [emp_code], {
            outFormat: OracleDB.OUT_FORMAT_OBJECT
        });

        res.json({ data: payloadencrypt(JSON.stringify(result.rows)) });
    } catch (err) {
        logWrite(`Failed to fetch my pending checklist checkpoint. Error: ${err.message}`);
        res.status(500).json({ data: payloadencrypt(JSON.stringify({ message: 'Failed to fetch my pending checklist checkpoint.' })) });
    }finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                logWrite(`Failed to close Oracle DB connection: ${err.message}`);
            }
        }
    }
});

router.post('/getrolependingchecklistcheckpoint', verifyToken, async (req, res) => {
    let connection;
    try {
        const { roleId } = req.body;
        if (!roleId || roleId.trim() === "" || !smsRegex.test(roleId)) {
            return res.status(400).json({ data: payloadencrypt(JSON.stringify({ message: 'Invalid data.' })) });
        }

        const poolInstance = await getPool();
        const query = `
            SELECT 
                cmd.ID,
                cmd.CHECKLIST_ID,
                t.type_name, 
                icm.NAME, 
                icm.ROLE_ID,
                r.role_name,
                cmd.STATUS,
                TRIM(dm.NAME) AS DIV,   
                TRIM(lm.LOC_NAME) AS LOC,
                cmd.ENTRY_DATE AS CREATED_ON
            FROM CHECKLIST_MST_DTLS cmd
            LEFT JOIN CHECKLIST_MST cm ON cm.CHECKLIST_ID = cmd.CHECKLIST_ID
            LEFT JOIN DIV_MST dm ON cm.DIV_CODE = dm.id
            LEFT JOIN LOCATION_MST lm ON TRIM(cm.LOC_CODE) = TRIM(lm.loc_id)
            LEFT JOIN INSPECTION_CHECKPOINT_MST icm ON cmd.CHECKPOINT_ID = icm.ID
            LEFT JOIN CHECKPOINT_TYPE_MST t ON icm.type_id = t.TYPE_ID
            LEFT JOIN ROLE_MST r ON r.ROLE_ID = icm.ROLE_ID
            WHERE cmd.STATUS = 'NOT OK'
              AND r.ROLE_ID = :ROLE_ID
        `;

         connection = await poolInstance.getConnection();
        const result = await connection.execute(query, [roleId], {
            outFormat: OracleDB.OUT_FORMAT_OBJECT
        });

       res.json({ data: payloadencrypt(JSON.stringify(result.rows)) });
    } catch (err) {
        logWrite(`Failed to fetch role pending checklist checkpoint. Error: ${err.message}`);
        res.status(500).json({ data: payloadencrypt(JSON.stringify({ message: 'Failed to fetch role pending checklist checkpoint.' })) });
    }finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                logWrite(`Failed to close Oracle DB connection: ${err.message}`);
            }
        }
    }
});

const multer = require('multer');
const fs = require('fs');

// Configure multer
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });


const allowedMimeTypes = [
      'image/jpeg', 'image/png', 'image/jpg',
      'application/pdf', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

router.post('/addchecklist', verifyToken, upload.any(), async (req, res) => {
    let connection;
    try {
        const { checklist_id, emp_code, div, loc, checkpoint } = req.body;
        let parsedCheckpoint;

        try {
            parsedCheckpoint = JSON.parse(checkpoint);
        } catch (error) {
            logWrite(`Failed to add checklist. Error: Parse checkpoint JSON`);
            return res.status(400).json({ data: payloadencrypt(JSON.stringify({ message: 'Invalid checkpoint format.' })) });
        }

        if (!emp_code || !div || !loc || !Array.isArray(parsedCheckpoint) || parsedCheckpoint.length === 0) {
            logWrite(`Failed to add checklist. Error: empty field`);
            return res.status(400).json({ data: payloadencrypt(JSON.stringify({ message: 'Invalid data.' })) });
        }

        // Validate checkpoint fields
        for (const item of parsedCheckpoint) {
            if (!item.checkpoint_id || !item.status) {
                logWrite(`Failed to add checklist. Error: Checkpoint validation`);
                return res.status(400).json({ data: payloadencrypt(JSON.stringify({ message: 'Invalid checkpoint data.' })) });
            }
        }
        // Validate uploaded files
        for (const file of req.files) {
            const { fileTypeFromBuffer } = await import('file-type');
            const fileType = await fileTypeFromBuffer(file.buffer);
            if (!fileType || !allowedMimeTypes.includes(fileType.mime) || file.size > 10 * 1024 * 1024) {
                logWrite(`Failed to add checklist. Error: File validation ${fileType ? fileType.mime : 'unknown'},${file.size}`);
                return res.status(400).json({ data: payloadencrypt(JSON.stringify({ message: 'Invalid file data.' })) });
            }
        }

        // Map files dynamically by fieldname (matches frontend naming: file_0_1, file_0_2, ...)
        const fileMap = {};
        req.files.forEach(file => {
            fileMap[file.fieldname] = file.buffer;
        });

        const pool = await getPool();
        connection = await pool.getConnection();

        // Insert into CHECKLIST_MST
        await connection.execute(`
            INSERT INTO CHECKLIST_MST (CHECKLIST_ID, EMP_CODE, DIV_CODE, LOC_CODE)
            VALUES (:CHECKLIST_ID, :EMP_CODE, :DIV, :LOC)
        `, {
            CHECKLIST_ID: checklist_id.toUpperCase(),
            EMP_CODE: emp_code.toUpperCase(),
            DIV: div.toUpperCase(),
            LOC: loc.toUpperCase()
        });

        // Insert into CHECKLIST_MST_DTLS with up to 3 files
        for (let i = 0; i < parsedCheckpoint.length; i++) {
            const item = parsedCheckpoint[i];
            await connection.execute(`
                INSERT INTO CHECKLIST_MST_DTLS (
                    CHECKLIST_ID, CHECKPOINT_ID, EMP_CODE, STATUS, REMARKS,
                    FILENAME, FILEDATA, FILENAME2, FILEDATA2, FILENAME3, FILEDATA3
                ) VALUES (
                    :CHECKLIST_ID, :CHECKPOINT_ID, :EMP_CODE, :STATUS, :REMARKS,
                    :FILENAME, :FILEDATA, :FILENAME2, :FILEDATA2, :FILENAME3, :FILEDATA3
                )
            `, {
                CHECKLIST_ID: checklist_id.toUpperCase(),
                CHECKPOINT_ID: item.checkpoint_id,
                EMP_CODE: emp_code,
                STATUS: item.status,
                REMARKS: item.remarks || null,
                FILENAME: item.filename || null,
                FILEDATA: fileMap[`file_${i}_1`] || null,
                FILENAME2: item.filename2 || null,
                FILEDATA2: fileMap[`file_${i}_2`] || null,
                FILENAME3: item.filename3 || null,
                FILEDATA3: fileMap[`file_${i}_3`] || null
            }, { autoCommit: false });
        }

        await connection.commit();
        return res.status(200).json({ data: payloadencrypt(JSON.stringify({ message: 'Checklist and checkpoints added successfully.' })) });

    } catch (error) {
        if (connection) await connection.rollback();
        logWrite(`Failed to add checklist. Error: ${error.message}`);
        return res.status(500).json({ data: payloadencrypt(JSON.stringify({ message: 'Failed to add checklist and checkpoints.' })) });
    } finally {
        if (connection) {
            try { await connection.close(); } 
            catch (err) { logWrite(`Failed to close Oracle DB connection: ${err.message}`); }
        }
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
        return res.status(400).json({ data: payloadencrypt(JSON.stringify({ message: 'Invalid data.' })) });
    }

    let connection;
    try {
        const pool = await getPool(); // getPool should return oracledb connection pool
        connection = await pool.getConnection();

        const query = `
            UPDATE INCHARGES_MST 
            SET 
                EMP_NAME = :EMP_NAME, 
                EMAIL_ID = :EMAIL_ID, 
                MOBILE_NO = :MOBILE_NO, 
                CIRCLE = :CIRCLE, 
                DIVISION = :DIVISION, 
                LOCATION = :LOCATION, 
                ROLE = :ROLE, 
                STATUS = :STATUS, 
                UPDATED_BY = :UPDATED_BY, 
                UPDATED_ON = SYSDATE 
            WHERE EMP_CODE = :EMP_CODE
        `;

        const result = await connection.execute(query, {
            EMP_NAME: emp_name.toUpperCase(),
            EMAIL_ID: email_id.toUpperCase(),
            MOBILE_NO: mob.toUpperCase(),
            CIRCLE: circle.toUpperCase(),
            DIVISION: div.toUpperCase(),
            LOCATION: loc.toUpperCase(),
            ROLE: role.toUpperCase(),
            STATUS: status.toUpperCase(),
            UPDATED_BY: updated_by.toUpperCase(),
            EMP_CODE: emp_code.toUpperCase()
        }, { autoCommit: true });

        if (result.rowsAffected === 1) {
            return res.status(200).json({ data: payloadencrypt(JSON.stringify({ message: 'Incharge updated successfully' })) });
        } else {
            logWrite(`Failed to update incharge. Response: ${JSON.stringify(result)}`);
            return res.status(500).json({ data: payloadencrypt(JSON.stringify({ message: 'Failed to update incharge.' })) });
        }

    } catch (e) {
        logWrite(`Failed to update incharge. Error: ${e.message}`);
        return res.status(500).json({ data: payloadencrypt(JSON.stringify({ message: 'Failed to update incharge.' })) });
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

router.delete('/deletechecklist', verifyToken, async (req, res) => {
    let connection;
    try {
        const { checklist_id } = req.body;

        if (!checklist_id || checklist_id.trim() === "" || !smsRegex.test(checklist_id)) {
            return res.status(400).json({ data: payloadencrypt(JSON.stringify({ message: 'Invalid data.' })) });
        }

        const pool = await getPool(); // Should return Oracle connection pool
        connection = await pool.getConnection();

        await connection.execute(`BEGIN NULL; END;`); // dummy to ensure session readiness
        await connection.execute(`SAVEPOINT pre_delete_checklist`);

        try {
            // Delete from CHECKLIST_MST_DTLS
            await connection.execute(`
                DELETE FROM CHECKLIST_MST_DTLS WHERE CHECKLIST_ID = :CHECKLIST_ID
            `, {
                CHECKLIST_ID: checklist_id.toUpperCase()
            });

            // Delete from CHECKLIST_MST
            await connection.execute(`
                DELETE FROM CHECKLIST_MST WHERE CHECKLIST_ID = :CHECKLIST_ID
            `, {
                CHECKLIST_ID: checklist_id.toUpperCase()
            });

            await connection.commit();

            return res.status(200).json({
                data: payloadencrypt(JSON.stringify({ message: 'Checklist and checkpoints deleted successfully.' }))
            });

        } catch (error) {
            await connection.rollback();
            logWrite(`Failed to delete checklist. Error: ${error.message}`);
            return res.status(500).json({
                data: payloadencrypt(JSON.stringify({ message: 'Failed to delete checklist and checkpoints.' }))
            });
        }

    } catch (error) {
        logWrite(`Failed to delete checklist. Error: ${error.message}`);
        return res.status(500).json({
            data: payloadencrypt(JSON.stringify({ message: 'Failed to delete checklist and checkpoints.' }))
        });
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
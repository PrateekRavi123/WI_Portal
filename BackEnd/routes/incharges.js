const express = require('express');
const oracledb = require('oracledb');
const router = express.Router();
const { getPool } = require('../config/db');
const { smsRegex, emailRegex, mobileValidation } = require('../config/inputValidation');
const { verifyToken } = require('../config/tokenValidation');
const { logWrite } = require('../config/logfile');
const { payloadencrypt } = require('../config/payloadCrypto');


router.post('/getincharge', verifyToken, async (req, res) => {
    let connection;

    try {
        const { id, cnt_no } = req.body;
        if (!id || !cnt_no || !smsRegex.test(id) || !smsRegex.test(cnt_no)) {
            return res.status(400).json({ data: payloadencrypt(JSON.stringify({ message: 'Invalid data.' })) });
        }

        const pool = await getPool();
        connection = await pool.getConnection();

        const query = `
      SELECT IM.ID,
             IM.EMP_CODE,
             IM.EMP_NAME,
             IM.EMAIL_ID,
             IM.MOBILE_NO,
             TRIM(IM.CIRCLE)   AS CIRCLE_CODE,
             TRIM(IM.DIVISION) AS DIV_CODE,
             TRIM(IM.ROLE_ID)  AS ROLE_ID,
             DM_CIRCLE.NAME    AS CIRCLE,
             DM_DIVISION.NAME  AS DIVISION,
             RM.ROLE_NAME      AS ROLE,
             IM.STATUS,
             LM.LOC_ID,
             LM.LOC_NAME
      FROM INCHARGES_MST IM
      LEFT JOIN DIV_MST DM_CIRCLE
        ON TRIM(IM.CIRCLE) = TRIM(DM_CIRCLE.ID)
      LEFT JOIN DIV_MST DM_DIVISION
        ON IM.DIVISION = DM_DIVISION.ID
      LEFT JOIN ROLE_MST RM
        ON IM.ROLE_ID = RM.ROLE_ID
      LEFT JOIN WPINSP_UserLocations UL
        ON IM.ID = UL.EMP_CODE
      LEFT JOIN LOCATION_MST LM
        ON UL.LOC_ID = LM.LOC_ID
      WHERE IM.ID = :ID
        AND IM.MOBILE_NO = :MOBILE_NO
    `;

        const result = await connection.execute(query, [id, cnt_no], { outFormat: oracledb.OUT_FORMAT_OBJECT });

        // Case 1: No incharge found
        if (result.rows.length === 0) {
            return res.status(404).json({ data: payloadencrypt(JSON.stringify({ message: 'Incharge not found.' })) });
        }

        // Case 2: Incharge exists (with or without locations)
        const base = {
            id: result.rows[0].ID,
            emp_code: result.rows[0].EMP_CODE,
            emp_name: result.rows[0].EMP_NAME,
            email_id: result.rows[0].EMAIL_ID,
            mobile_no: result.rows[0].MOBILE_NO,
            circle_code: result.rows[0].CIRCLE_CODE,
            division_code: result.rows[0].DIV_CODE,
            role_id: result.rows[0].ROLE_ID,
            circle: result.rows[0].CIRCLE,
            division: result.rows[0].DIVISION,
            role: result.rows[0].ROLE,
            status: result.rows[0].STATUS,
            locations: []
        };

        for (const row of result.rows) {
            if (row.LOC_ID) {
                base.locations.push({
                    loc_id: row.LOC_ID,
                    loc_name: row.LOC_NAME
                });
            }
        }

        res.json({ data: payloadencrypt(JSON.stringify(base)) });

    } catch (err) {
        logWrite(`Failed to fetch incharge. Error: ${err.message}`);
        res.status(500).json({ data: payloadencrypt(JSON.stringify({ message: 'Failed to fetch incharge.' })) });
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



router.get('/getallincharges', verifyToken, async (req, res) => {
    let connection;
    try {
        const pool = await getPool();
        connection = await pool.getConnection();

        const query = `
            SELECT IM.ID,
                IM.EMP_CODE,
                IM.EMP_NAME,
                IM.MOBILE_NO,
                DM_CIRCLE.NAME  AS CIRCLE,
                DM_DIVISION.NAME AS DIVISION,
                RM.ROLE_NAME    AS ROLE,
                IM.STATUS,
                LM.LOC_ID,
                LM.LOC_NAME 
            FROM INCHARGES_MST IM
            LEFT JOIN DIV_MST DM_CIRCLE
                ON TRIM(IM.CIRCLE) = TRIM(DM_CIRCLE.ID)
            LEFT JOIN DIV_MST DM_DIVISION
                ON IM.DIVISION = DM_DIVISION.ID
            LEFT JOIN ROLE_MST RM
                ON IM.ROLE_ID = RM.ROLE_ID
            LEFT JOIN WPINSP_UserLocations UL
                ON IM.ID = UL.EMP_CODE
            LEFT JOIN LOCATION_MST LM
                ON UL.LOC_ID = LM.LOC_ID
        `;
        const result = await connection.execute(query, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });

        // Group by EMP_CODE
        const inchargesMap = new Map();

        for (const row of result.rows) {
            if (!inchargesMap.has(row.ID)) {
                inchargesMap.set(row.ID, {
                    id: row.ID,
                    emp_code: row.EMP_CODE,
                    emp_name: row.EMP_NAME,
                    mobile_no: row.MOBILE_NO,
                    circle: row.CIRCLE,
                    division: row.DIVISION,
                    role: row.ROLE,
                    status: row.STATUS,
                    locations: []
                });
            }

            if (row.LOC_ID) {
                inchargesMap.get(row.ID).locations.push({
                    loc_id: row.LOC_ID,
                    loc_name: row.LOC_NAME
                });
            }
        }

        const incharges = Array.from(inchargesMap.values());

        res.json({ data: payloadencrypt(JSON.stringify(incharges)) });

    } catch (err) {
        logWrite(`Failed to fetch all incharges. Error: ${err.message}`);
        res.status(500).json({ data: payloadencrypt(JSON.stringify({ message: 'Failed to fetch all incharges.' })) });
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


router.post('/addincharge', verifyToken, async (req, res) => {
    const { emp_code, emp_name, email_id, mob, circle, div, loc, role, status, created_by } = req.body;
    let connection;

    // Validation
    if (!emp_code || !emp_name || !email_id || !mob || !circle || !div || !loc || !role || !status ||
        !created_by ||
        emp_name.trim() === "" || email_id.trim() === "" || mob.trim() === "" ||
        circle.trim() === "" || div.trim() === "" || role.trim() === "" ||
        status.trim() === "" || created_by.trim() === "" ||
        !emailRegex.test(email_id) || !mobileValidation.test(mob)) {
        return res.status(400).json({ data: payloadencrypt(JSON.stringify({ message: 'Invalid data.' })) });
    }

    try {
        const pool = await getPool();
        connection = await pool.getConnection();

        // Step 1: Insert into INCHARGES_MST and return generated ID
        const insertInchargeQuery = `
      INSERT INTO INCHARGES_MST 
      (EMP_CODE, EMP_NAME, EMAIL_ID, MOBILE_NO, CIRCLE, DIVISION, ROLE_ID, STATUS, CREATED_BY, CREATED_ON)
      VALUES (:EMP_CODE, :EMP_NAME, :EMAIL_ID, :MOBILE_NO, :CIRCLE, :DIVISION, :ROLE_ID, :STATUS, :CREATED_BY, SYSDATE)
      RETURNING ID INTO :ID
    `;

        const inchargeBinds = {
            EMP_CODE: emp_code.toUpperCase(),
            EMP_NAME: emp_name.toUpperCase(),
            EMAIL_ID: email_id.toUpperCase(),
            MOBILE_NO: mob.toUpperCase(),
            CIRCLE: circle.toUpperCase(),
            DIVISION: div.toUpperCase(),
            ROLE_ID: role.toUpperCase(),
            STATUS: status.toUpperCase(),
            CREATED_BY: created_by.toUpperCase(),
            ID: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
        };

        const insertResult = await connection.execute(insertInchargeQuery, inchargeBinds, { autoCommit: false });
        const newInchargeId = insertResult.outBinds.ID[0]; // <-- get generated ID

        // Step 2: Insert into WPINSP_UserLocations using the generated ID
        const insertLocationQuery = `
      INSERT INTO WPINSP_UserLocations (EMP_CODE, LOC_ID)
      VALUES (:EMP_ID, :LOC_ID)
    `;

        const locations = Array.isArray(loc) ? loc : [loc]; // support array or single value
        for (const locationId of locations) {
            await connection.execute(insertLocationQuery, {
                EMP_ID: newInchargeId,
                LOC_ID: locationId.toUpperCase()
            }, { autoCommit: false });
        }

        // Commit transaction
        await connection.commit();

        return res.status(200).json({ data: payloadencrypt(JSON.stringify({ message: 'Incharge added successfully' })) });

    } catch (e) {
        if (connection) await connection.rollback(); // rollback on error
        let errorMessage = 'Failed to add incharge.';
        if (e.errorNum === 1) { // ORA-00001: unique constraint violation
            if (e.message.includes('UQ_MOBILE_NO')) {
                errorMessage = 'Mobile number already exists for another incharge.';
            } else if (e.message.includes('SYS_C0030356')) {
                errorMessage = 'This location is already assigned to another incharge.';
            }
        }
        logWrite(`Error in adding incharge. Error: ${e.message}`);
        res.status(500).json({ data: payloadencrypt(JSON.stringify({ message: errorMessage })) });
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





router.patch('/updateincharge', verifyToken, async (req, res) => {
    const { id, emp_code, emp_name, email_id, mob, circle, div, loc, role, status, updated_by } = req.body;
    let connection;

    // Validation
    if (!id || !emp_code || !emp_name || !email_id || !mob || !circle || !div || !loc || !role || !status || !updated_by ||
        emp_code.trim() === "" || emp_name.trim() === "" || email_id.trim() === "" ||
        mob.trim() === "" || circle.trim() === "" || div.trim() === "" ||
        role.trim() === "" || status.trim() === "" || updated_by.trim() === "" ||
        !emailRegex.test(email_id) || !mobileValidation.test(mob)) {
        return res.status(400).json({ data: payloadencrypt(JSON.stringify({ message: 'Invalid data.' })) });
    }

    try {
        const pool = await getPool();
        connection = await pool.getConnection();

        // Step 1: Update INCHARGES_MST
        const updateQuery = `
            UPDATE INCHARGES_MST
            SET EMP_CODE   = :EMP_CODE,
                EMP_NAME   = :EMP_NAME,
                EMAIL_ID   = :EMAIL_ID,
                MOBILE_NO  = :MOBILE_NO,
                CIRCLE     = :CIRCLE,
                DIVISION   = :DIVISION,
                ROLE_ID    = :ROLE_ID,
                STATUS     = :STATUS,
                UPDATED_BY = :UPDATED_BY,
                UPDATED_ON = SYSDATE
            WHERE ID = :ID
            `;

        const inchargeBinds = {
            EMP_CODE: emp_code.toUpperCase(),
            EMP_NAME: emp_name.toUpperCase(),
            EMAIL_ID: email_id.toUpperCase(),
            MOBILE_NO: mob.toUpperCase(),
            CIRCLE: circle.toUpperCase(),
            DIVISION: div.toUpperCase(),
            ROLE_ID: role.toUpperCase(),
            STATUS: status.toUpperCase(),
            UPDATED_BY: updated_by.toUpperCase(),
            ID: id
        };

        const result = await connection.execute(updateQuery, inchargeBinds, { autoCommit: false });

        if (result.rowsAffected !== 1) {
            throw new Error('Incharge not found or failed to update.');
        }

        // Step 2a: Check if any of the new locations are already assigned to another user
        const locations = Array.isArray(loc) ? loc : [loc];

if (locations.length > 0) {
    const bindPlaceholders = locations.map((_, i) => `:loc${i}`).join(",");
    const conflictQuery = `
        SELECT LOC_ID, EMP_CODE
        FROM WPINSP_UserLocations
        WHERE LOC_ID IN (${bindPlaceholders})
        AND EMP_CODE <> :EMP_CODE
    `;

    const binds = { EMP_CODE: id.toUpperCase() };
    locations.forEach((l, i) => {
        binds[`loc${i}`] = l.toUpperCase();
    });

    const conflictResult = await connection.execute(conflictQuery, binds, { outFormat: oracledb.OUT_FORMAT_OBJECT });

    if (conflictResult.rows.length > 0) {
        const conflictLocs = conflictResult.rows.map(r => r.LOC_ID).join(", ");
        return res.status(400).json({
            data: payloadencrypt(JSON.stringify({ message: `Location(s) ${conflictLocs} already assigned to another incharge.` }))
        });
    }
}

        //  Step 2: Replace locations in WPINSP_UserLocations
        await connection.execute(
            `DELETE FROM WPINSP_UserLocations WHERE EMP_CODE = :EMP_CODE`,
            { EMP_CODE: id.toUpperCase() },
            { autoCommit: false }
        );

        const insertLocationQuery = `INSERT INTO WPINSP_UserLocations (EMP_CODE, LOC_ID) VALUES (:EMP_CODE, :LOC_ID)`;

        for (const locationId of locations) {
            await connection.execute(insertLocationQuery, {
                EMP_CODE: id.toUpperCase(),
                LOC_ID: locationId.toUpperCase()
            }, { autoCommit: false });
        }

        await connection.commit();

        return res.status(200).json({ data: payloadencrypt(JSON.stringify({ message: 'Incharge updated successfully' })) });

    } catch (e) {
        if (connection) await connection.rollback();

        let errorMessage = 'Failed to update incharge.';

        //  Custom Oracle error handling
        if (e.errorNum === 1) { // ORA-00001 unique constraint violation
            if (e.message.includes('UQ_MOBILE_NO')) {
                errorMessage = 'Mobile number already exists for another incharge.';
            } else if (e.message.includes('SYS_C0030356')) {
                errorMessage = 'This location is already assigned to another incharge.';
            }
        }

        logWrite(`Failed to update incharge. Error: ${e.message}`);
        res.status(400).json({ data: payloadencrypt(JSON.stringify({ message: errorMessage })) });
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


router.patch('/updateprofileincharge', verifyToken, async (req, res) => {
    const { id, emp_code, emp_name, email_id, mob, updated_by } = req.body;
    let connection;
    if (!id || !emp_code || !emp_name || !email_id || !mob ||
        !updated_by || emp_code.trim() === "" || emp_name.trim() === "" || email_id.trim() === "" ||
        mob.trim() === "" || updated_by.trim() === "" || !smsRegex.test(id) ||
        !smsRegex.test(emp_code) || !smsRegex.test(emp_name) || !emailRegex.test(email_id) ||
        !mobileValidation.test(mob) || !smsRegex.test(updated_by)) {
        return res.status(400).json({ data: payloadencrypt(JSON.stringify({ message: 'Invalid data.' })) });
    }

    try {
        const pool = await getPool();
        connection = await pool.getConnection();
        const query = `
            UPDATE INCHARGES_MST
            SET EMP_CODE = :EMP_CODE, EMP_NAME = :EMP_NAME, EMAIL_ID = :EMAIL_ID, MOBILE_NO = :MOBILE_NO, 
                UPDATED_BY = :UPDATED_BY, UPDATED_ON = SYSDATE
            WHERE ID = :ID
        `;

        const binds = {
            EMP_CODE: emp_code.toUpperCase(),
            EMP_NAME: emp_name.toUpperCase(),
            EMAIL_ID: email_id.toUpperCase(),
            MOBILE_NO: mob.toUpperCase(),
            UPDATED_BY: updated_by.toUpperCase(),
            ID: id
        };

        const result = await connection.execute(query, binds, { autoCommit: true });

        if (result.rowsAffected === 1) {
            return res.status(200).json({ data: payloadencrypt(JSON.stringify({ message: 'Incharge updated successfully' })) });
        } else {
            logWrite(`Failed to update profile incharge. Response: ${JSON.stringify(result)}`);
            return res.status(500).json({ data: payloadencrypt(JSON.stringify({ message: 'Failed to update incharge.' })) });
        }
    } catch (e) {
        logWrite(`Failed to update profile incharge. Error: ${e.message}`);
        res.status(500).json({ data: payloadencrypt(JSON.stringify({ message: 'Failed to update incharge.' })) });
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



router.delete('/deleteincharge', verifyToken, async (req, res) => {
    const { id } = req.body;
    if (!id || !smsRegex.test(id)) {
        return res.status(400).json({ data: payloadencrypt(JSON.stringify({ message: 'Invalid data.' })) });
    }

    let connection;
    try {
        const pool = await getPool();
        connection = await pool.getConnection();

        // Start transaction
        await connection.execute('SAVEPOINT before_delete');

        //  Delete from child table first
        await connection.execute(
            `DELETE FROM WPINSP_UserLocations WHERE EMP_CODE = :ID`,
            { ID: id }
        );

        // Delete from parent table
        const result = await connection.execute(
            `DELETE FROM INCHARGES_MST WHERE ID = :ID`,
            { ID: id }
        );

        if (result.rowsAffected === 1) {
            await connection.commit();
            return res.status(200).json({
                data: payloadencrypt(JSON.stringify({ message: 'Incharge deleted successfully' }))
            });
        } else {
            await connection.rollback();
            logWrite(`Failed to delete incharge. Response: ${JSON.stringify(result)}`);
            return res.status(404).json({
                data: payloadencrypt(JSON.stringify({ message: 'Incharge not found.' }))
            });
        }
    } catch (e) {
        if (connection) await connection.rollback();
        logWrite(`Failed to delete incharge. Error: ${e.message}`);
        res.status(500).json({ data: payloadencrypt(JSON.stringify({ message: 'Failed to delete incharge.' })) });
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
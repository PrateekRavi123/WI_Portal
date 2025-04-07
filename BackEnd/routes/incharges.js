const express = require('express');
const router = express.Router();
const { sql, getPool } = require('../config/db');
const { smsRegex, emailRegex, mobileValidation } = require('../config/inputValidation');
const { verifyToken } = require('../config/tokenValidation');
const { logWrite } = require('../config/logfile')


router.post('/getincharge', verifyToken, async (req, res) => {
    let poolInstance;
    try {
        const { emp_code } = req.body;
        if (!emp_code || emp_code.trim() === "" || !smsRegex.test(emp_code)) {
            return res.status(400).json({ message: 'Invalid data.'});
        }
        poolInstance = await getPool();
        const query = `SELECT IM.EMP_CODE,IM.EMP_NAME,IM.EMAIL_ID,
    IM.MOBILE_NO,
    LTRIM(RTRIM(IM.CIRCLE)) AS CIRCLE_CODE,  
    LTRIM(RTRIM(IM.DIVISION)) AS DIV_CODE,   
    LTRIM(RTRIM(IM.LOCATION)) AS LOC_CODE, 
    LTRIM(RTRIM(IM.ROLE_ID)) AS ROLE_ID, 
    DM_CIRCLE.NAME AS CIRCLE,
    DM_DIVISION.name AS DIVISION,
    LM.loc_name AS LOCATION,
    RM.ROLE_NAME AS ROLE,
    IM.STATUS
FROM 
    INCHARGES_MST IM
LEFT JOIN 
    DIV_MST DM_CIRCLE ON IM.CIRCLE = DM_CIRCLE.id
LEFT JOIN 
    DIV_MST DM_DIVISION ON IM.DIVISION = DM_DIVISION.id
LEFT JOIN 
    LOCATION_MST LM ON IM.LOCATION = LM.loc_id
LEFT JOIN 
    ROLE_MST RM ON IM.ROLE_ID = RM.ROLE_ID
WHERE 
    IM.EMP_CODE = @EMP_CODE`;
        const request = await poolInstance.request();
        request.input('EMP_CODE', sql.VarChar, emp_code);
        const result = await request.query(query);
        res.json(result.recordset);
    } catch (err) {
        logWrite(`Failed to fetch incharge. Error: ${err.message}`);
        res.status(500).json({ message: 'Failed to fetch incharge.'});
    }
});

router.get('/getallincharges', verifyToken, async (req, res) => {
    let poolInstance;
    try {
        poolInstance = await getPool();
        const result = await poolInstance.request().query(`
            SELECT IM.EMP_CODE,IM.EMP_NAME,
    DM_CIRCLE.NAME AS CIRCLE,
    DM_DIVISION.name AS DIVISION,
    LM.loc_name AS LOCATION,
    RM.ROLE_NAME AS ROLE,
    IM.STATUS
FROM 
    INCHARGES_MST IM
LEFT JOIN 
    DIV_MST DM_CIRCLE ON IM.CIRCLE = DM_CIRCLE.id
LEFT JOIN 
    DIV_MST DM_DIVISION ON IM.DIVISION = DM_DIVISION.id
LEFT JOIN 
    LOCATION_MST LM ON IM.LOCATION = LM.loc_id
LEFT JOIN 
    ROLE_MST RM ON IM.ROLE_ID = RM.ROLE_ID`);
        res.json(result.recordset);
    } catch (err) {
        logWrite(`Failed to fetch all incharges. Error: ${err.message}`);
        res.status(500).json({ message: 'Failed to fetch all incharges.'});
    }
});

router.post('/addincharge', verifyToken, async (req, res) => {
    const { emp_code, emp_name, email_id, mob, circle, div, loc, role, status, created_by } = req.body;

    if (!emp_code || !emp_name || !email_id || !mob || !circle || !div || !loc || !role || !status ||
        !created_by || emp_code.trim() === "" || emp_name.trim() === "" || email_id.trim() === "" ||
        mob.trim() === "" || circle.trim() === "" || div.trim() === "" || loc.trim() === "" ||
        role.trim() === "" || status.trim() === "" || created_by.trim() === "" || !smsRegex.test(emp_code) ||
        !smsRegex.test(emp_name) || !emailRegex.test(email_id) || !mobileValidation.test(mob) ||
        !smsRegex.test(circle) || !smsRegex.test(div) || !smsRegex.test(loc) || !smsRegex.test(role) || !smsRegex.test(status) || !smsRegex.test(created_by)) {
        return res.status(400).json({ message: 'Invalid data.'});
    }
    try {
        const pool = await getPool();
        const query = `INSERT INTO INCHARGES_MST(EMP_CODE,EMP_NAME,EMAIL_ID,MOBILE_NO,CIRCLE,DIVISION,LOCATION,ROLE_ID,STATUS,CREATED_BY,CREATED_ON) VALUES (@EMP_CODE, @EMP_NAME, @EMAIL_ID, @MOBILE_NO, @CIRCLE, @DIVISION, @LOCATION,@ROLE_ID,@STATUS, @CREATED_BY, GETDATE())`;
        const request = await pool.request();
        request.input('EMP_CODE', sql.VarChar, emp_code.toUpperCase());
        request.input('EMP_NAME', sql.VarChar, emp_name.toUpperCase());
        request.input('EMAIL_ID', sql.VarChar, email_id.toUpperCase());
        request.input('MOBILE_NO', sql.VarChar, mob.toUpperCase());
        request.input('CIRCLE', sql.VarChar, circle.toUpperCase());
        request.input('DIVISION', sql.VarChar, div.toUpperCase());
        request.input('LOCATION', sql.VarChar, loc.toUpperCase());
        request.input('ROLE_ID', sql.VarChar, role.toUpperCase());
        request.input('STATUS', sql.VarChar, status.toUpperCase());
        request.input('CREATED_BY', sql.VarChar, created_by.toUpperCase());
        const response = await request.query(query);
        if (response.rowsAffected && response.rowsAffected[0] === 1) {
            return res.status(200).json({ message: 'Incharge added successfully' });       
        } else {
            logWrite(`Failed to add location. Response: ${JSON.stringify(response)}`)
            return res.status(500).json({ message: 'Failed to add incharge.'});
        }
    }
    catch (e) {
        logWrite(`Error in adding incharge. Error: ${e.message}`);
        res.status(500).json({ message: 'Failed to add incharge.'});
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
        return res.status(400).json({ message: 'Invalid data.'});
    }
    try {
        const pool = await getPool();

        const query = `UPDATE INCHARGES_MST SET EMP_NAME = @EMP_NAME, EMAIL_ID = @EMAIL_ID, MOBILE_NO = @MOBILE_NO, CIRCLE = @CIRCLE, DIVISION = @DIVISION, LOCATION = @LOCATION, ROLE_ID = @ROLE_ID,STATUS = @STATUS, UPDATED_BY = @UPDATED_BY, UPDATED_ON = GETDATE() WHERE EMP_CODE = @EMP_CODE`;
        const request = await pool.request();
        request.input('EMP_NAME', sql.VarChar, emp_name.toUpperCase());
        request.input('EMAIL_ID', sql.VarChar, email_id.toUpperCase());
        request.input('MOBILE_NO', sql.VarChar, mob.toUpperCase());
        request.input('CIRCLE', sql.VarChar, circle.toUpperCase());
        request.input('DIVISION', sql.VarChar, div.toUpperCase());
        request.input('LOCATION', sql.VarChar, loc.toUpperCase());
        request.input('ROLE_ID', sql.VarChar, role.toUpperCase());
        request.input('STATUS', sql.VarChar, status.toUpperCase());
        request.input('UPDATED_BY', sql.VarChar, updated_by.toUpperCase());
        request.input('EMP_CODE', sql.VarChar, emp_code.toUpperCase());
        const response = await request.query(query);
        if (response.rowsAffected && response.rowsAffected[0] === 1) {
            return res.status(200).json({ message: 'Incharge updated successfully'});
        } else {
            logWrite(`Failed to update incharge. Response: ${JSON.stringify(response)}`);
            return res.status(500).json({ message: 'Failed to update incharge.'});
        }
    }
    catch (e) {
        logWrite(`Failed to update incharge. Error: ${e.message}`);
        res.status(500).json({ message: 'Failed to update incharge.'});
    }
});

router.delete('/deleteincharge', verifyToken, async (req, res) => {
    const { emp_code } = req.body;
    if (!emp_code || emp_code.trim() === "" || !smsRegex.test(emp_code)) {
        return res.status(400).json({ message: 'Invalid data.'});
    }
    try {
        const pool = await getPool();
        const query = `DELETE FROM INCHARGES_MST WHERE EMP_CODE = @EMP_CODE`;
        const request = await pool.request();
        request.input('EMP_CODE', sql.VarChar, emp_code);
        const response = await request.query(query);
        if (response.rowsAffected && response.rowsAffected[0] === 1) {
            return res.status(200).json({ message: 'Incharge deleted successfully'});
        } else {
            logWrite(`Failed to delete incharge. Response: ${JSON.stringify(response)}`);
            return res.status(500).json({ message: 'Failed to delete incharge.'});
        }
    }
    catch (e) {
        logWrite(`Failed to delete incharge. Error: ${e.message}`);
        res.status(500).json({ message: 'Failed to delete incharge.'});
    }
});

module.exports = router;
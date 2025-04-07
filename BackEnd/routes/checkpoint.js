const express = require('express');
const router = express.Router();
const { sql, getPool } = require('../config/db');
const { smsRegex, emailRegex } = require('../config/inputValidation');
const { verifyToken } = require('../config/tokenValidation');
const { logWrite } = require('../config/logfile')


router.get('/getcheckpoint', verifyToken, async (req, res) => {
    let poolInstance;
    try {
        poolInstance = await getPool();
        let query = ' SELECT TYPE_ID,NAME,ROLE_ID FROM INSPECTION_CHECKPOINT_MST WHERE id = @id ';
        const { id } = req.body;
        if (!id  || id.trim() === "" ||  !smsRegex.test(id) ) {
            return res.status(400).json({ message:  'Invalid data.'});
        }
        const request = await poolInstance.request();
        request.input('id', sql.VarChar, id.toUpperCase());
        const result = await request.query(query);
        res.json(result.recordset);
    } catch (err) {
        logWrite(`Failed to retrieve the checkpoint. Error: ${err.message}`);
        res.status(500).json({ message:  'Failed to retrieve the checkpoint'});
    }
});

router.get('/getallcheckpoint', verifyToken, async (req, res) => {
    let poolInstance;
    try {
        poolInstance = await getPool();
        const result = await poolInstance.request().query(`	SELECT 
    icm.id, 
    icm.type_id, 
    t.type_name, 
    icm.NAME, 
    icm.ROLE_ID,
	r.role_name
FROM INSPECTION_CHECKPOINT_MST icm
LEFT JOIN CHECKPOINT_TYPE_MST t ON icm.type_id = t.TYPE_ID
left join ROLE_MST r on r.ROLE_ID = icm.ROLE_ID
order by icm.type_id `);
        res.json(result.recordset);
    } catch (err) {
        logWrite(`Failed to fetch all checkpoint. Error: ${err.message}`);
        res.status(500).json({ message:  "Failed to fetch all checkpoint."});
    }
});

router.get('/getallcheckpointtype', verifyToken, async (req, res) => {
    let poolInstance;
    try {
        poolInstance = await getPool();
        const result = await poolInstance.request().query('SELECT id,TYPE_ID,TYPE_NAME FROM CHECKPOINT_TYPE_MST');
        res.json(result.recordset);
    } catch (err) {
        logWrite(`Failed to fetch all checkpoint type. Error: ${err.message}`);
        res.status(500).json({ message:  "Failed to fetch all checkpoint type."});
    }
});

router.post('/addcheckpoint', verifyToken, async (req, res) => {
    const { type, name, fwdrole } = req.body;
    if (!type || !name || !fwdrole || type.trim() === "" || name.trim() === "" || fwdrole.trim() === ""  ||!smsRegex.test(type) || !smsRegex.test(name) || !smsRegex.test(fwdrole)) {
        return res.status(400).json({ message:  'Invalid data.'});
    }
    try {
        const pool = await getPool();
        const query = `INSERT INTO INSPECTION_CHECKPOINT_MST (TYPE_ID,NAME,ROLE_ID) VALUES (@TYPE,@NAME,@FORWARD_ROLE)`;
        const request = await pool.request();
        request.input('TYPE', sql.VarChar, type.toUpperCase());
        request.input('NAME', sql.VarChar, name.toUpperCase());
        request.input('FORWARD_ROLE', sql.VarChar, fwdrole.toUpperCase());
        const response = await request.query(query);
        if (response.rowsAffected && response.rowsAffected[0] === 1) {
            return res.status(200).json({ message:  'Checkpoint added successfully'});
        } else {
            logWrite(`Failed to add checkpoint. Response: ${JSON.stringify(response)}`)
            return res.status(500).json({ message:  'Failed to add checkpoint.'});
        }
        
    }
    catch (e) {
        logWrite(`Error in adding checkpoint. Error: ${e.message}`);
        res.status(500).json({ message:  'Failed to add checkpoint.'});
    }
});

router.patch('/updatecheckpoint', verifyToken, async (req, res) => {
    logWrite(`Failed to update checkpoint. Response: ${JSON.stringify(req.body)}`);
    const { id, type, name, fwdrole } = req.body;
    if (!id || !type || !name || !fwdrole  || id.trim() === "" || type.trim() === "" || name.trim() === "" || fwdrole.trim() === ""  || !smsRegex.test(id) || !smsRegex.test(type) || !smsRegex.test(name) || !smsRegex.test(fwdrole) ) {
        return res.status(400).json({ message:  'Invalid data.'});
    }
    try {
        const pool = await getPool();
        const query = `UPDATE INSPECTION_CHECKPOINT_MST SET TYPE_ID = @TYPE, NAME = @NAME, ROLE_ID = @FORWARD_ROLE WHERE ID = @ID`;
        const request = await pool.request();
        request.input('TYPE', sql.VarChar, type.toUpperCase());
        request.input('NAME', sql.VarChar, name.toUpperCase());
        request.input('FORWARD_ROLE', sql.VarChar, fwdrole.toUpperCase());
        request.input('ID', sql.VarChar, id.toUpperCase());
        const response = await request.query(query);
        if (response.rowsAffected && response.rowsAffected[0] === 1) {
            return res.status(200).json({ message:  'Checkpoint updated successfully'});
        } else {
            logWrite(`Failed to update checkpoint. Response: ${JSON.stringify(response)}`);
            return res.status(500).json({ message:  'Failed to update checkpoint.'});
        }
    }
    catch (e) {
        logWrite(`Failed to update checkpoint. Error: ${e.message}`)
        res.status(500).json({ message:  'Failed to update checkpoint.'});
    }
});

router.delete('/deletecheckpoint', verifyToken, async (req, res) => {
    const { id } = req.body;
    if (!id || id.trim() === ""  || !smsRegex.test(id)) {
        return res.status(400).json({ message:  'Invalid data.'});
    }
    try {
        const pool = await getPool();
        const query = `DELETE FROM INSPECTION_CHECKPOINT_MST WHERE id = @id`;
        const request = await pool.request();
        request.input('id', sql.VarChar, id.toUpperCase());
        const response = await request.query(query);
        if (response.rowsAffected && response.rowsAffected[0] === 1) {
            return res.status(200).json({ message:  'Checkpoint deleted successfully'});
        } else {
            logWrite(`Failed to delete checkpoint. Response: ${JSON.stringify(response)}`);
            return res.status(500).json({ message:  'Failed to delete checkpoint.'});
        }
    }
    catch (e) {
        logWrite(`Failed to delete checkpoint. Error: ${e.message}`);
        res.status(500).json({ message:  'Failed to delete checkpoint.'});
    }
});

module.exports = router;
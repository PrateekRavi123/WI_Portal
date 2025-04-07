const express = require('express');
const router = express.Router();
const { sql, getPool } = require('../config/db');
const { smsRegex, emailRegex } = require('../config/inputValidation');
const { verifyToken } = require('../config/tokenValidation');
const { logWrite } = require('../config/logfile')


router.post('/getlocation', verifyToken, async (req, res) => {
    let poolInstance;
    try {
        poolInstance = await getPool();
        let query = ' SELECT LOC_ID,LOC_NAME,DIV_CODE,CIRCLE FROM LOCATION_MST ';
        const {  div } = req.body;
        if ( !div ||  div.trim() === "" || !smsRegex.test(div) ) {
            return res.status(400).json({ message: 'Invalid data.'});
        }
        const request = await poolInstance.request();
            if (div != 'All') {
                query += ' WHERE  DIV_CODE = @DIV_CODE ';
                request.input('DIV_CODE', sql.VarChar, div.toUpperCase());
            } 
        const result = await request.query(query);
        res.json(result.recordset);
    } catch (err) {
        logWrite(`Failed to retrieve the location. Error: ${err.message}`);
        res.status(500).json({ message: 'Failed to retrieve the location'});
    }
});

router.get('/getalllocations', verifyToken, async (req, res) => {
    let poolInstance;
    try {
        poolInstance = await getPool();
        const result = await poolInstance.request().query('SELECT loc.loc_id, loc.loc_name,loc.div_code as div_code, div1.name AS div,loc.circle as circle_code, div2.name AS circle FROM LOCATION_MST loc LEFT JOIN div_mst div1 ON div1.id = loc.div_code LEFT JOIN div_mst div2 ON div2.id = loc.circle;');
        res.json(result.recordset);
    } catch (err) {
        logWrite(`Failed to fetch all locations. Error: ${err.message}`);
        res.status(500).json({ message: "Failed to fetch all locations."});
    }
});

router.post('/addlocation', verifyToken, async (req, res) => {
    const { loc_name, div_code, circle } = req.body;
    let loc_id;
    if (!loc_name || !div_code || !circle || circle.trim() === "" || div_code.trim() === "" || loc_name.trim() === ""  ||!smsRegex.test(loc_name) || !smsRegex.test(div_code) || !smsRegex.test(circle)) {
        return res.status(400).json({ message: 'Invalid data.'});
    }
    try {
        const pool = await getPool();
        const q = ` SELECT LOC_ID FROM LOCATION_MST WHERE DIV_CODE = @DIV_CODE ORDER BY LOC_ID DESC `;
        const r = await pool.request();
        r.input('DIV_CODE', sql.VarChar, div_code);
        const re = await r.query(q);
        if (re.recordset.length > 0) {
            const prevloc_id = re.recordset[0].LOC_ID;
            const match = prevloc_id.match(/^([A-Za-z]+_)(\d{3})$/);
            if (match) {
                const prefix = match[1];
                const number = parseInt(match[2], 10) + 1;
                loc_id = `${prefix}${number.toString().padStart(3, '0')}`;
            } else {
                logWrite(`Error in adding location: db loc_id is not in valid format: ${prevloc_id}`);
                return res.status(500).json({ message: 'Failed to add location.'});
            }
        } else {
            logWrite('Error in adding location: no loc_id found from db');
            return res.status(500).json({ message: 'Failed to add location.'});
        }
        logWrite(`prev location:  ${loc_id}`);
        const query = `INSERT INTO LOCATION_MST(LOC_ID,LOC_NAME,DIV_CODE,CIRCLE) VALUES (@LOC_ID, @LOC_NAME, @DIV_CODE, @CIRCLE)`;
        const request = await pool.request();
        request.input('LOC_ID', sql.VarChar, loc_id.toUpperCase());
        request.input('LOC_NAME', sql.VarChar, loc_name.toUpperCase());
        request.input('DIV_CODE', sql.VarChar, div_code.toUpperCase());
        request.input('CIRCLE', sql.VarChar, circle.toUpperCase());
        const response = await request.query(query);
        if (response.rowsAffected && response.rowsAffected[0] === 1) {
            return res.status(200).json({ message: 'Location added successfully'});
        } else {
            logWrite(`Failed to add location. Response: ${JSON.stringify(response)}`)
            return res.status(500).json({ message: 'Failed to add location.'});
        }
        
    }
    catch (e) {
        logWrite(`Error in adding location. Error: ${e.message}`);
        res.status(500).json({ message: 'Failed to add location.'});
    }
});

router.patch('/updatelocation', verifyToken, async (req, res) => {
    const { loc_id, loc_name, div_code, circle } = req.body;
    if (!loc_id || !loc_name || !div_code || !circle || circle.trim() === "" || div_code.trim() === "" || loc_name.trim() === ""  || loc_id.trim() === ""  || !smsRegex.test(loc_id) || !smsRegex.test(loc_name) || !smsRegex.test(div_code) || !smsRegex.test(circle)) {
        return res.status(400).json({ message: 'Invalid data.'});
    }
    try {
        const pool = await getPool();
        const query = `UPDATE LOCATION_MST SET LOC_NAME = @LOC_NAME, DIV_CODE = @DIV_CODE, CIRCLE = @CIRCLE WHERE LOC_ID = @LOC_ID`;
        const request = await pool.request();
        request.input('LOC_NAME', sql.VarChar, loc_name.toUpperCase());
        request.input('DIV_CODE', sql.VarChar, div_code.toUpperCase());
        request.input('CIRCLE', sql.VarChar, circle.toUpperCase());
        request.input('LOC_ID', sql.VarChar, loc_id.toUpperCase());
        const response = await request.query(query);
        if (response.rowsAffected && response.rowsAffected[0] === 1) {
            return res.status(200).json({ message: 'Location updated successfully'});
        } else {
            logWrite(`Failed to update location. Response: ${JSON.stringify(response)}`);
            return res.status(500).json({ message: 'Failed to update location.'});
        }
    }
    catch (e) {
        logWrite(`Failed to update location. Error: ${e.message}`)
        res.status(500).json({ message: 'Failed to update location.'});
    }
});

router.delete('/deletelocation', verifyToken, async (req, res) => {
    const { loc_id } = req.body;
    if (!loc_id || loc_id.trim() === ""  || !smsRegex.test(loc_id)) {
        return res.status(400).json({ message: 'Invalid data.'});
    }
    try {
        const pool = await getPool();
        const query = `DELETE FROM LOCATION_MST WHERE LOC_ID = @LOC_ID`;
        const request = await pool.request();
        request.input('LOC_ID', sql.VarChar, loc_id.toUpperCase());
        const response = await request.query(query);
        if (response.rowsAffected && response.rowsAffected[0] === 1) {
            return res.status(200).json({ message: 'Location deleted successfully'});
        } else {
            logWrite(`Failed to delete location. Response: ${JSON.stringify(response)}`);
            return res.status(500).json({ message: 'Failed to delete location.'});
        }
    }
    catch (e) {
        logWrite(`Failed to delete location. Error: ${e.message}`);
        res.status(500).json({ message: 'Failed to delete location.'});
    }
});

module.exports = router;
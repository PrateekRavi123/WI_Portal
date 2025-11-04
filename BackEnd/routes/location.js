const express = require('express');
const oracledb = require('oracledb');
const router = express.Router();
const { getPool } = require('../config/db');
const { smsRegex } = require('../config/inputValidation');
const { verifyToken } = require('../config/tokenValidation');
const { logWrite } = require('../config/logfile');
const { payloadencrypt } = require('../config/payloadCrypto');
const { checkAccess } = require('../config/accessValidation');





router.post('/getactivelocation', verifyToken, checkAccess(['R1']), async (req, res) => {
    let connection;
    try {
        const { id, div } = req.body;
        if (!div || div.trim() === "" || !smsRegex.test(div)) {
            return res.status(400).json({ data: payloadencrypt(JSON.stringify({ message: 'Invalid data.' })) });
        }

        const binds = {};
        const pool = await getPool();
        connection = await pool.getConnection();

        let query = `
            SELECT lm.LOC_ID,
                   lm.LOC_NAME,
                   lm.DIV_CODE,
                   lm.CIRCLE,
                   lm.OFFICE_TYPE,
                   lm.STATUS
            FROM LOCATION_MST lm
            WHERE lm.STATUS = 'Y'
              AND NOT EXISTS (
                SELECT 1
                FROM WPINSP_UserLocations ul
                WHERE ul.LOC_ID = lm.LOC_ID`; //Show locations which are not allotted yet
        if (id !== '') {
            query += ` AND ul.EMP_CODE <> :id`; //Show locations except already allotted location to itself

            binds.id = id;
        }

        query += `  )`;

        if (div !== 'All') {
            query += ` AND lm.DIV_CODE = :DIV_CODE`;
            binds.DIV_CODE = div.toUpperCase();
        }

        const result = await connection.execute(query, binds, { outFormat: oracledb.OUT_FORMAT_OBJECT });

        res.json({ data: payloadencrypt(JSON.stringify(result.rows)) });
    } catch (err) {
        logWrite(`Failed to retrieve active location. Error: ${err.message}`);
        res.status(500).json({ data: payloadencrypt(JSON.stringify({ msg: 'Failed to retrieve active location.' })) });
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


router.get('/getalllocations', verifyToken, async (req, res) => {
    let connection;
    try {
        // Establish connection to Oracle DB
        const pool = await getPool();
        connection = await pool.getConnection();
        // Oracle SQL query
        const query = `
            SELECT 
                loc.loc_id, 
                loc.loc_name, 
                loc.div_code AS div_code, 
                div1.name AS div, 
                loc.circle AS circle_code, 
                div2.name AS circle, 
                loc.office_type AS office_type_id, 
                otm.name AS office_type,
                loc.status AS status
            FROM LOCATION_MST loc
            LEFT JOIN div_mst div1 ON div1.id = loc.div_code
            LEFT JOIN div_mst div2 ON div2.id = loc.circle
            LEFT JOIN OFFICE_TYPE_MST otm ON otm.id = loc.office_type
        `;

        // Execute the query
        const result = await connection.execute(query, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });

        // Send encrypted response back
        res.json({ data: payloadencrypt(JSON.stringify(result.rows)) });
    } catch (err) {
        logWrite(`Failed to fetch all locations. Error: ${err.message}`);
        res.status(500).json({ data: payloadencrypt(JSON.stringify({ message: "Failed to fetch all locations." })) });
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

// Add Location
router.post('/addlocation', verifyToken, async (req, res) => {
    const { loc_name, div_code, circle, office_type, status } = req.body;
    let loc_id;
    if (!loc_name || !div_code || !circle || !office_type || !status || office_type.trim() === "" || circle.trim() === "" || div_code.trim() === "" || loc_name.trim() === "" || status.trim() === "" || !smsRegex.test(loc_name) || !smsRegex.test(div_code) || !smsRegex.test(circle) || !smsRegex.test(office_type) || !smsRegex.test(status)) {
        return res.status(400).json({ data: payloadencrypt(JSON.stringify({ message: 'Invalid data.' })) });
    }

    let connection;
    try {
        // Establish connection to Oracle DB
        const pool = await getPool();
        connection = await pool.getConnection();
        // Query to get the latest LOC_ID
        const q = `SELECT LOC_ID FROM LOCATION_MST WHERE DIV_CODE = :DIV_CODE ORDER BY LOC_ID DESC`;

        const result = await connection.execute(q, [div_code.toUpperCase()], { outFormat: oracledb.OUT_FORMAT_OBJECT });

        if (result.rows.length > 0) {
            const prevloc_id = result.rows[0].LOC_ID;
            const match = prevloc_id.match(/^([A-Za-z]+_)(\d{3})$/);
            if (match) {
                const prefix = match[1];
                const number = parseInt(match[2], 10) + 1;
                loc_id = `${prefix}${number.toString().padStart(3, '0')}`;
            } else {
                logWrite(`Error in adding location: db loc_id is not in valid format: ${prevloc_id}`);
                return res.status(500).json({ data: payloadencrypt(JSON.stringify({ message: 'Failed to add location.' })) });
            }
        } else {
            logWrite('Error in adding location: no loc_id found from db');
            return res.status(500).json({ data: payloadencrypt(JSON.stringify({ message: 'Failed to add location.' })) });
        }

        // Insert location query
        const query = `
            INSERT INTO LOCATION_MST (LOC_ID, LOC_NAME, DIV_CODE, CIRCLE, OFFICE_TYPE, STATUS) 
            VALUES (:LOC_ID, :LOC_NAME, :DIV_CODE, :CIRCLE, :OFFICE_TYPE, :STATUS)
        `;

        const insertResult = await connection.execute(query, {
            LOC_ID: loc_id.toUpperCase(),
            LOC_NAME: loc_name.toUpperCase(),
            DIV_CODE: div_code.toUpperCase(),
            CIRCLE: circle.toUpperCase(),
            OFFICE_TYPE: office_type.toUpperCase(),
            STATUS: status.toUpperCase()
        }, { autoCommit: true });

        if (insertResult.rowsAffected === 1) {
            return res.status(200).json({ data: payloadencrypt(JSON.stringify({ message: 'Location added successfully' })) });
        } else {
            logWrite(`Failed to add location. Response: ${JSON.stringify(insertResult)}`);
            return res.status(500).json({ data: payloadencrypt(JSON.stringify({ message: 'Failed to add location.' })) });
        }

    } catch (err) {
        logWrite(`Error in adding location. Error: ${err.message}`);
        res.status(500).json({ data: payloadencrypt(JSON.stringify({ message: 'Failed to add location.' })) });
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

// Update Location
router.patch('/updatelocation', verifyToken, async (req, res) => {
    const { loc_id, loc_name, div_code, circle, OFFICE_TYPE, status } = req.body;
    if (!loc_id || !loc_name || !div_code || !circle || !OFFICE_TYPE || !status || OFFICE_TYPE.trim() === "" || circle.trim() === "" || div_code.trim() === "" || loc_name.trim() === "" || loc_id.trim() === "" || status.trim() === "" || !smsRegex.test(loc_id) || !smsRegex.test(loc_name) || !smsRegex.test(div_code) || !smsRegex.test(circle) || !smsRegex.test(OFFICE_TYPE) || !smsRegex.test(status)) {
        return res.status(400).json({ data: payloadencrypt(JSON.stringify({ message: 'Invalid data.' })) });
    }

    let connection;
    try {
        // Establish connection to Oracle DB
        const pool = await getPool();
        connection = await pool.getConnection();

        const query = `
            UPDATE LOCATION_MST 
            SET LOC_NAME = :LOC_NAME, DIV_CODE = :DIV_CODE, CIRCLE = :CIRCLE, OFFICE_TYPE = :OFFICE_TYPE, STATUS = :STATUS 
            WHERE LOC_ID = :LOC_ID
        `;

        const result = await connection.execute(query, {
            LOC_NAME: loc_name.toUpperCase(),
            DIV_CODE: div_code.toUpperCase(),
            CIRCLE: circle.toUpperCase(),
            OFFICE_TYPE: OFFICE_TYPE.toUpperCase(),
            STATUS: status.toUpperCase(),
            LOC_ID: loc_id.toUpperCase()
        }, { autoCommit: true });

        if (result.rowsAffected === 1) {
            return res.status(200).json({ data: payloadencrypt(JSON.stringify({ message: 'Location updated successfully' })) });
        } else {
            logWrite(`Failed to update location. Response: ${JSON.stringify(result)}`);
            return res.status(500).json({ data: payloadencrypt(JSON.stringify({ message: 'Failed to update location.' })) });
        }

    } catch (err) {
        logWrite(`Failed to update location. Error: ${err.message}`);
        res.status(500).json({ data: payloadencrypt(JSON.stringify({ message: 'Failed to update location.' })) });
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

// Delete Location
router.delete('/deletelocation', verifyToken, async (req, res) => {
    const { loc_id } = req.body;
    if (!loc_id || loc_id.trim() === "" || !smsRegex.test(loc_id)) {
        return res.status(400).json({ data: payloadencrypt(JSON.stringify({ message: 'Invalid data.' })) });
    }

    let connection;
    try {
        // Establish connection to Oracle DB
        const pool = await getPool();
        connection = await pool.getConnection();
        

        const query = `DELETE FROM LOCATION_MST WHERE LOC_ID = :LOC_ID`;

        const result = await connection.execute(query, [loc_id.toUpperCase()], { autoCommit: true });

        if (result.rowsAffected === 1) {
            return res.status(200).json({ data: payloadencrypt(JSON.stringify({ message: 'Location deleted successfully' })) });
        } else {
            logWrite(`Failed to delete location. Response: ${JSON.stringify(result)}`);
            return res.status(500).json({ data: payloadencrypt(JSON.stringify({ message: 'Failed to delete location.' })) });
        }

    } catch (err) {
        logWrite(`Failed to delete location. Error: ${err.message}`);
        res.status(500).json({ data: payloadencrypt(JSON.stringify({ message: 'Failed to delete location.' })) });
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
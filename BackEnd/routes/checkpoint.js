
const express = require('express');
const oracledb = require('oracledb'); 
const router = express.Router();
const { getPool } = require('../config/db');
const { smsRegex } = require('../config/inputValidation');
const { verifyToken } = require('../config/tokenValidation');
const { logWrite } = require('../config/logfile');
const { payloadencrypt } = require('../config/payloadCrypto');



router.get('/getcheckpoint', verifyToken, async (req, res) => {
    let connection;
    try {
        const { id } = req.body;

        if (!id || id.trim() === "" || !smsRegex.test(id)) {
            return res.status(400).json({ data: payloadencrypt(JSON.stringify({ message: 'Invalid data.' })) });
        }

        const pool = await getPool(); // Oracle connection pool
        connection = await pool.getConnection();

        const query = `SELECT TYPE_ID, LABEL, NAME, ROLE_ID FROM INSPECTION_CHECKPOINT_MST WHERE ID = :id`;

        const result = await connection.execute(query, { id: id.toUpperCase() }, { outFormat: sql.OBJECT });

        res.json({ data: payloadencrypt(JSON.stringify(result.rows)) });

    } catch (err) {
        logWrite(`Failed to retrieve the checkpoint. Error: ${err.message}`);
        res.status(500).json({ data: payloadencrypt(JSON.stringify({ message: 'Failed to retrieve the checkpoint' })) });
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

router.get('/getallcheckpoint', verifyToken, async (req, res) => {
    let connection;
    try {
        const pool = await getPool();
        connection = await pool.getConnection();

        const query = `
            SELECT 
                icm.id, 
                icm.type_id, 
                t.type_name,
                icm.LABEL, 
                icm.NAME, 
                icm.ROLE_ID,
                r.role_name,
                icm.STATUS
            FROM INSPECTION_CHECKPOINT_MST icm
            LEFT JOIN CHECKPOINT_TYPE_MST t ON icm.type_id = t.TYPE_ID
            LEFT JOIN ROLE_MST r ON r.ROLE_ID = icm.ROLE_ID
            ORDER BY icm.type_id
        `;

        const result = await connection.execute(query, [],  { outFormat: oracledb.OUT_FORMAT_OBJECT });
        res.json({ data: payloadencrypt(JSON.stringify(result.rows)) });

    } catch (err) {
        logWrite(`Failed to fetch all checkpoint. Error: ${err.message}`);
        res.status(500).json({ data: payloadencrypt(JSON.stringify({ message: "Failed to fetch all checkpoint." })) });
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

router.get('/getallactivecheckpoint', verifyToken, async (req, res) => {
    let connection;
    try {
        const pool = await getPool();
        connection = await pool.getConnection();

        const query = `
            SELECT 
                icm.id, 
                icm.type_id, 
                t.type_name,
                icm.LABEL, 
                icm.NAME, 
                icm.ROLE_ID,
                r.role_name
            FROM INSPECTION_CHECKPOINT_MST icm
            LEFT JOIN CHECKPOINT_TYPE_MST t ON icm.type_id = t.TYPE_ID
            LEFT JOIN ROLE_MST r ON r.ROLE_ID = icm.ROLE_ID
            WHERE icm.STATUS = 'Y'
            ORDER BY icm.type_id
        `;

        const result = await connection.execute(query, [],  { outFormat: oracledb.OUT_FORMAT_OBJECT });
        res.json({ data: payloadencrypt(JSON.stringify(result.rows)) });

    } catch (err) {
        logWrite(`Failed to fetch all checkpoint. Error: ${err.message}`);
        res.status(500).json({ data: payloadencrypt(JSON.stringify({ message: "Failed to fetch all checkpoint." })) });
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

router.get('/getallcheckpointtype', verifyToken, async (req, res) => {
    let connection;
    try {
        const pool = await getPool();
        connection = await pool.getConnection();

        const query = 'SELECT id, TYPE_ID, TYPE_NAME FROM CHECKPOINT_TYPE_MST';
        const result = await connection.execute(query, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });

        res.json({ data: payloadencrypt(JSON.stringify(result.rows)) });
    } catch (err) {
        logWrite(`Failed to fetch all checkpoint type. Error: ${err.message}`);
        res.status(500).json({ data: payloadencrypt(JSON.stringify({ message: "Failed to fetch all checkpoint type." })) });
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

router.post('/addcheckpoint', verifyToken, async (req, res) => {
    const { type,label, name, fwdrole, status } = req.body;
    if (!type || !label || !name || !fwdrole || !status || type.trim() === "" || label.trim() === "" || name.trim() === "" || fwdrole.trim() === "" || status.trim() === "" || 
        !smsRegex.test(type) || !smsRegex.test(label) || !smsRegex.test(name) || !smsRegex.test(fwdrole)|| !smsRegex.test(status)) {
        return res.status(400).json({ data: payloadencrypt(JSON.stringify({ message: 'Invalid data.' })) });
    }

    let connection;
    try {
        const pool = await getPool();
        connection = await pool.getConnection();
        const query = `
            INSERT INTO INSPECTION_CHECKPOINT_MST (TYPE_ID, LABEL, NAME, ROLE_ID, STATUS)
            VALUES (:TYPE, :LABEL, :NAME, :FORWARD_ROLE, :STATUS)
        `;
        const binds = {
            TYPE: type.toUpperCase(),
            LABEL: label.toUpperCase(),
            NAME: name.toUpperCase(),
            FORWARD_ROLE: fwdrole.toUpperCase(),
            STATUS: status.toUpperCase()
        };

        const result = await connection.execute(query, binds, { autoCommit: true });

        if (result.rowsAffected === 1) {
            return res.status(200).json({ data: payloadencrypt(JSON.stringify({ message: 'Checkpoint added successfully' })) });
        } else {
            logWrite(`Failed to add checkpoint. Response: ${JSON.stringify(result)}`);
            return res.status(500).json({ data: payloadencrypt(JSON.stringify({ message: 'Failed to add checkpoint.' })) });
        }
    } catch (e) {
        logWrite(`Error in adding checkpoint. Error: ${e.message}`);
        return res.status(500).json({ data: payloadencrypt(JSON.stringify({ message: 'Failed to add checkpoint.' })) });
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

router.patch('/updatecheckpoint', verifyToken, async (req, res) => {
    logWrite(`Failed to update checkpoint. Response: ${JSON.stringify(req.body)}`);
    const { id, type, label, name, fwdrole, status} = req.body;

    if (!id || !type || !label || !name || !fwdrole || !status || id.trim() === "" || type.trim() === "" || label.trim() === "" || name.trim() === "" || fwdrole.trim() === "" || status.trim() === "" ||
        !smsRegex.test(id) || !smsRegex.test(type) || !smsRegex.test(label) || !smsRegex.test(name) || !smsRegex.test(fwdrole) || !smsRegex.test(status)) {
        return res.status(400).json({ data: payloadencrypt(JSON.stringify({ message: 'Invalid data.' })) });
    }

    let connection;
    try {
        const pool = await getPool();
        connection = await pool.getConnection();

        const query = `
            UPDATE INSPECTION_CHECKPOINT_MST
            SET TYPE_ID = :TYPE, LABEL = :LABEL, NAME = :NAME, ROLE_ID = :FORWARD_ROLE, STATUS = :STATUS WHERE ID = :ID
        `;
        const binds = {
            TYPE: type.toUpperCase(),
            LABEL: label.toUpperCase(),
            NAME: name.toUpperCase(),
            FORWARD_ROLE: fwdrole.toUpperCase(),
            STATUS: status.toUpperCase(),
            ID: id.toUpperCase()
        };

        const result = await connection.execute(query, binds, { autoCommit: true });

        if (result.rowsAffected === 1) {
            return res.status(200).json({ data: payloadencrypt(JSON.stringify({ message: 'Checkpoint updated successfully' })) });
        } else {
            logWrite(`Failed to update checkpoint. Response: ${JSON.stringify(result)}`);
            return res.status(500).json({ data: payloadencrypt(JSON.stringify({ message: 'Failed to update checkpoint.' })) });
        }
    } catch (e) {
        logWrite(`Failed to update checkpoint. Error: ${e.message}`);
        res.status(500).json({ data: payloadencrypt(JSON.stringify({ message: 'Failed to update checkpoint.' })) });
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

router.delete('/deletecheckpoint', verifyToken, async (req, res) => {
    const { id } = req.body;

    if (!id || id.trim() === "" || !smsRegex.test(id)) {
        return res.status(400).json({ data: payloadencrypt(JSON.stringify({ message: 'Invalid data.' })) });
    }

    let connection;
    try {
        const pool = await getPool();
        connection = await pool.getConnection();

        const query = 'DELETE FROM INSPECTION_CHECKPOINT_MST WHERE ID = :ID';
        const binds = {
            ID: id.toUpperCase()
        };

        const result = await connection.execute(query, binds, { autoCommit: true });

        if (result.rowsAffected === 1) {
            return res.status(200).json({ data: payloadencrypt(JSON.stringify({ message: 'Checkpoint deleted successfully' })) });
        } else {
            logWrite(`Failed to delete checkpoint. Response: ${JSON.stringify(result)}`);
            return res.status(500).json({ data: payloadencrypt(JSON.stringify({ message: 'Failed to delete checkpoint.' })) });
        }
    } catch (e) {
        logWrite(`Failed to delete checkpoint. Error: ${e.message}`);
        res.status(500).json({ data: payloadencrypt(JSON.stringify({ message: 'Failed to delete checkpoint.' })) });
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
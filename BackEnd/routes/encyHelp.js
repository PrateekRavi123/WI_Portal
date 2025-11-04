

const express = require('express');
const router = express.Router();
const { logWrite } = require('../config/logfile');
const { payloadencrypt , payloaddecrypt} = require('../config/payloadCrypto');

router.post('/encrypt', async (req, res) => {
    try {
        const { plainText } = req.body;
        if (!plainText || typeof plainText !== 'string') {
            return res.status(400).json({ message: 'Invalid input for encryption.' });
        }

        const encryptedData = payloadencrypt(plainText);
        res.status(200).json({ data: encryptedData });
    } catch (err) {
        logWrite(`Encryption error: ${err.message}`);
        res.status(500).json({ message: 'Encryption failed.' });
    }
});
// Make sure this is imported

router.post('/decrypt', async (req, res) => {
    try {
        const { encryptedText } = req.body;
        if (!encryptedText || typeof encryptedText !== 'string') {
            return res.status(400).json({ message: 'Invalid input for decryption.' });
        }

        const decryptedData = payloaddecrypt(encryptedText);
        res.status(200).json({ data: decryptedData });
    } catch (err) {
        logWrite(`Decryption error: ${err.message}`);
        res.status(500).json({ message: 'Decryption failed. Possibly due to invalid or corrupted input.' });
    }
});

module.exports = router;
const express = require('express');
const router = express.Router();
const { getCon } = require('../config/oracledb');
const { sql, getPool } = require('../config/db');
const { mobileValidation, smsRegex, otpValidation } = require('../config/inputValidation');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { secretKey } = require('../config/tokenValidation');
const { logWrite } = require('../config/logfile')
const { payloadencrypt } = require('../config/payloadCrypto');

const otpRequests = {}; // In-memory storage for tracking OTP attempts
const OTP_LIMIT = 3;
const OTP_TIMEOUT = 15 * 60 * 1000; // 15 minutes in milliseconds
router.post('/sendOTP', async (req, res) => {
    const otp = Math.floor(100000 + Math.random() * 900000);
    const cnt_no = req.body.cnt_no;
    const now = Date.now();
    if (!otpRequests[cnt_no]) {
        otpRequests[cnt_no] = { count: 1, timestamp: now };
    } else {
        const requestInfo = otpRequests[cnt_no];

        // Check if timeout period has passed
        if (now - requestInfo.timestamp > OTP_TIMEOUT) {
            otpRequests[cnt_no] = { count: 1, timestamp: now };
        } else {
            // Increment count and enforce limit
            if (requestInfo.count >= OTP_LIMIT) {
                return res.status(200).json({ data: payloadencrypt(JSON.stringify({ msg: 'OTP limit reached. Try again later.' })) });
            }

            otpRequests[cnt_no].count++;
        }
    }
    

    if (!cnt_no || !mobileValidation.test(cnt_no)) {
        return res.status(400).json({ data: payloadencrypt(JSON.stringify({ msg: 'Invalid data.' })) });
    }
    try {
        //Check mobile no
        let poolInstance;
        poolInstance = await getPool();
        const query = 'SELECT emp_code,emp_name FROM INCHARGES_MST WHERE MOBILE_NO = @MOBILE_NO';
        const request = await poolInstance.request();
        request.input('MOBILE_NO', sql.VarChar, cnt_no);
        const result = await request.query(query);
        if (result.recordset.length > 0) {
            const emp_name = result.recordset[0].emp_name;
            const SMS = `Dear ${emp_name}, Your OTP is ${otp} for login into Workplace Inspection Portal. Team BSES`;
            const connection = await getCon();
            const r = await connection.execute("SELECT Generate_recordID() RECORDID FROM DUAL");
            //console.log(r.rows[0][0]);
            const result2 = await connection.execute(
                `INSERT INTO ALLMODULES_SENDSMS (RECORDID, SMS_TYPE, MODULE_NAME, SMS_TEXT, MOBILENO, MISC_FIELD1) 
               VALUES (:r_id, :sms_type, :module_name, :sms_text, :mobileno, :otp)`,
                {
                    r_id: r.rows[0][0],
                    sms_type: 'OTP',
                    module_name: 'WI_PORTAL',
                    sms_text: SMS,
                    mobileno: cnt_no,
                    otp: otp
                }
            );
            await connection.commit();
            connection.close();
            res.status(200).json({ data: payloadencrypt(JSON.stringify({ msg: 'SMS sent successfully'})) });
        } else {
            res.status(200).json({ data: payloadencrypt(JSON.stringify({ msg: 'No user found.' })) });
        }
    }
    catch (e) {
        logWrite(`Error in sending OTP: , ${e.message}`);
        res.status(500).json({ data: payloadencrypt(JSON.stringify({ msg: 'Failed to send SMS' })) });
    }
});
// Clear in-memory data periodically
// setInterval(() => {
//     const now = Date.now();
//     for (const [key, value] of Object.entries(otpRequests)) {
//         if (now - value.timestamp > OTP_TIMEOUT) {
//             delete otpRequests[key];
//         }
//     }
// }, OTP_TIMEOUT);


router.post('/validateOTP', async (req, res) => {
    const cnt_no = req.body.cnt_no;
    const val = req.body.val;
    if (!mobileValidation.test(cnt_no) || !otpValidation.test(val)) {
        return res.status(400).json({ msg: 'Invalid data.' });
    }
    try {
        //Validate given mobile & retrieve the emp_code --To be implemented
        let poolInstance;
        poolInstance = await getPool();
        const query = 'SELECT id,role_id FROM INCHARGES_MST WHERE MOBILE_NO = @MOBILE_NO';
        const request = await poolInstance.request();
        request.input('MOBILE_NO', sql.VarChar, cnt_no);
        const result = await request.query(query);
        if (result.recordset.length > 0) {
            const id = result.recordset[0].id;
            const role_id = result.recordset[0].role_id;
            
            // Validate OTP
            const connection = await getCon();
            const r = await connection.execute(`SELECT MISC_FIELD1 FROM ALLMODULES_SENDSMS 
                WHERE MOBILENO = :mobileno AND SMS_TYPE = 'OTP' AND MODULE_NAME = 'WI_PORTAL' 
                order by entry_date desc fetch first 1 row only`, {
                mobileno: cnt_no
            });
            if (r.rows.length === 0) {

                return res.status(200).send({ msg: 'Invalid OTP session.' });
            }
            const otp = r.rows[0][0];
            if (val != otp) {
                return res.status(200).send({ msg: 'Incorrect OTP.' });
            }
            connection.close();


            // Generate JWT token
            const tokenPayload = { cnt_no };
            const token = jwt.sign(tokenPayload, secretKey, { expiresIn: '1h' });

           
            // Update session table
            await poolInstance.request()
            .input('user_id', sql.VarChar, cnt_no)
            .input('token', sql.VarChar, token)
            .query(`
            IF EXISTS (SELECT 1 FROM USER_SESSIONS WHERE user_id = @user_id)
                UPDATE USER_SESSIONS SET token = @token, login_time = GETDATE(), status = 'Y' WHERE user_id = @user_id
            ELSE
                INSERT INTO USER_SESSIONS (user_id, token, login_time) VALUES (@user_id, @token, GETDATE())
            `);

            const responseObj = { 
                msg: 'OTP validated successfully.', 
                token: token, 
                user: id, 
                role: role_id 
              };
              
              const payloadencryptedData = payloadencrypt(JSON.stringify(responseObj));
              res.status(200).json({ data: payloadencryptedData });
              
        } else {
            res.status(200).json({ data: payloadencrypt(JSON.stringify({ msg: 'No user found.' })) });
        }
    }
    catch (e) {
        logWrite(`Error in validating OTP: , ${e.message}`);
        res.status(500).json({ data: payloadencrypt(JSON.stringify({ msg: 'Failed to validate OTP' })) });
    }
});


module.exports = router;
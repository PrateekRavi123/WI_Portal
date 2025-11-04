const express = require('express');
const router = express.Router();
const oracledb = require('oracledb'); 
const { getCon } = require('../config/oracledb');
const { getPool } = require('../config/db');
const { mobileValidation, otpValidation } = require('../config/inputValidation');

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
        // Check mobile no
       
        const pool = await getPool();  // Get the pool object
        const connection = await pool.getConnection();  // Connect to WPINSP Oracle DB

        const query = `SELECT emp_code, emp_name FROM INCHARGES_MST WHERE MOBILE_NO = :MOBILE_NO`;
        const result = await connection.execute(query, [cnt_no], { outFormat: oracledb.OUT_FORMAT_OBJECT });

        if (result.rows.length > 0) {
            const emp_name = result.rows[0].EMP_NAME;
            const SMS = `Dear ${emp_name}, Your OTP is ${otp} for login into Workplace Inspection Portal. Team BSES`;

          
            
            // Generate SMS in IMS DB - START
             const imsPool = await getCon();  // Connect to IMS Oracle DB
             const imsConnection = await imsPool.getConnection();
             const r = await imsConnection.execute("SELECT Generate_recordID() AS RECORDID FROM DUAL");
           

             const insertQuery = `
                 INSERT INTO ALLMODULES_SENDSMS (RECORDID, SMS_TYPE, MODULE_NAME, SMS_TEXT, MOBILENO, MISC_FIELD1)
                VALUES (:r_id, :sms_type, :module_name, :sms_text, :mobileno, :otp)
            `;
            await imsConnection.execute(insertQuery, {
               r_id: r.rows[0][0],
                sms_type: 'OTP',
                 module_name: 'WI_PORTAL',
                 sms_text: SMS,
                 mobileno: cnt_no,
                 otp: otp
             }, { autoCommit: true });
            await imsConnection.close();
            // Generate SMS in IMS DB - END

            res.status(200).json({ data: payloadencrypt(JSON.stringify({ msg: 'SMS sent successfully' })) });
        } else {
            res.status(200).json({ data: payloadencrypt(JSON.stringify({ msg: 'No user found.' })) });
        }

        // Close the connections
        await connection.close();
    } catch (e) {
        logWrite(`Error in sending OTP: ${e.message}`);
        res.status(500).json({ data: payloadencrypt(JSON.stringify({ msg: 'Failed to send SMS' })) });
    }
});


router.post('/validateOTP', async (req, res) => {
    const cnt_no = req.body.cnt_no;
    const val = req.body.val;

    // Validate mobile number and OTP format
    if (!mobileValidation.test(cnt_no) || !otpValidation.test(val)) {
        return res.status(400).json({ data: payloadencrypt(JSON.stringify({ msg: 'Invalid data.'  })) });
            
    }

    try {
        // Check if the mobile number exists in the WPINSP DB
        const pool = await getPool();  // Get the pool object
        const connection = await pool.getConnection(); // Connect to WPINSP Oracle DB

        const query = 'SELECT id, role_id FROM INCHARGES_MST WHERE MOBILE_NO = :MOBILE_NO';
        const result = await connection.execute(query, [cnt_no], { outFormat: oracledb.OUT_FORMAT_OBJECT });

        if (result.rows.length > 0) {
            const id = result.rows[0].ID;
            const role_id = result.rows[0].ROLE_ID;

            // Validate OTP in IMS DB - START
             const imsPool = await getCon();  // Connect to IMS Oracle DB
             const imsConnection = await imsPool.getConnection();

            const otpQuery = `
                SELECT MISC_FIELD1 
                 FROM ALLMODULES_SENDSMS 
                WHERE MOBILENO = encrypt(:mobileno)
                AND SMS_TYPE = 'OTP' 
                 AND MODULE_NAME = 'WI_PORTAL' 
                ORDER BY ENTRY_DATE DESC 
                 FETCH FIRST 1 ROWS ONLY
             `;
             const otpResult = await imsConnection.execute(otpQuery, { mobileno: cnt_no }, { outFormat: oracledb.OUT_FORMAT_OBJECT });

             if (otpResult.rows.length === 0) {
                 return res.status(400).send({ data: payloadencrypt(JSON.stringify({ msg: 'Invalid OTP session.' })) });
             }

             const otp = otpResult.rows[0].MISC_FIELD1;
             if (val !== otp) {
                return res.status(400).send({ data: payloadencrypt(JSON.stringify({ msg: 'Incorrect OTP.' })) });
             }
             await imsConnection.close();

            // Validate OTP in IMS DB - END

            // Generate JWT token
            const tokenPayload = { cnt_no,id,role_id };
            const token = jwt.sign(tokenPayload, secretKey, { expiresIn: '8h' });

            // Update or insert session in WPINSP database
            const mergeQuery = `
                MERGE INTO USER_SESSIONS us
                USING dual
                ON (us.user_id = :user_id)
                WHEN MATCHED THEN
                    UPDATE SET us.token = :token, us.login_time = SYSDATE, us.status = 'Y'
                WHEN NOT MATCHED THEN
                    INSERT (user_id, token, login_time)
                    VALUES (:user_id, :token, SYSDATE)
            `;
            await connection.execute(mergeQuery, {
                user_id: cnt_no,
                token: token
            }, { autoCommit: true });

            // Prepare the response object
            const responseObj = {
                msg: 'OTP validated successfully.',
                token: token,
                user: id,
                role: role_id
            };
            

            // Encrypt and send the response
            const payloadencryptedData = payloadencrypt(JSON.stringify(responseObj));
            res.status(200).json({ data: payloadencryptedData });
        } else {
            // No user found with the given mobile number
            res.status(200).json({ data: payloadencrypt(JSON.stringify({ msg: 'No user found.' })) });
        }

        // Close the connections
     
        await connection.close();

    } catch (e) {
        // Handle errors
        logWrite(`Error in validating OTP: ${e.message}`);
        res.status(500).json({ data: payloadencrypt(JSON.stringify({ msg: 'Failed to validate OTP' })) });
    }
});




module.exports = router;

const OracleDB = require('oracledb');
const { getPool } = require('../config/db');
const { sendEmailSmtp } = require('../config/emailHelper'); 
const { logWrite } = require('../config/logfile');


async function sendMonthlyEmailJob() {
  const success = await sendEmailSmtp({
    emailFrom: 'prateek.ravi@reliancegroupindia.com',
    emailTo: ['prateek.ravi@reliancegroupindia.com'],
    emailCc: ['prateek.ravi@reliancegroupindia.com'],
    emailBcc: [],
    emailBody: '<h3>Kindly upload Office Inspection Check-sheet in the Workplace Inspection Portal for the current month. Please find the url of portal</h3>',
    emailSubject: 'Scheduled Email - Monthly Reminder',
    attachmentBytes: null, 
    attachmentFilename: null
  });

  logWrite(success ? 'Email sent.' : 'Failed to send email.');
}

async function send15thEmails() {
  let connection;

  try {
    const pool = await getPool();
    connection = await pool.getConnection();

    // Query for active users
    const query = `select * from incharges_mst im
left join CHECKLIST_MST cm on im.EMP_CODE = cm.EMP_CODE
and TRUNC(cm.created_on) >= TRUNC(ADD_MONTHS(SYSDATE, 0), 'MM')
left join LOCATION_MST lm on im.LOCATION = lm.LOC_ID
and lm.status = 'Y'
where im.role_id = 'R2'
and cm.created_on is null
`;
    const result = await connection.execute(query, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });

    const users = result.rows;
if (users.length === 0) {
      logWrite("All checklists received. No email sent on 15th.");
      return;
    }
    for (const user of users) {
      const name = user.NAME;
      const email = user.EMAIL;

      const emailBody = `
        <h3>Dear ${name},</h3>
        <p>Kindly upload Office Inspection Check-sheet in the Workplace Inspection Portal for the current month.</p>
        <p><strong>URL:</strong> <a href="https://bywip.bsesdelhi.com">Workplace Inspection Portal</a></p>
        <p>Thank you.</p>
        <p>Regards,<br/>Workplace Inspection Automation System</p>
      `;

      const success = await sendEmailSmtp({
        emailFrom: 'prateek.ravi@reliancegroupindia.com',
        emailTo: [email],
        emailCc: [],
        emailBcc: [],
        emailSubject: 'Monthly Reminder: Office Inspection Check-sheet',
        emailBody,
        attachmentBytes: null,
        attachmentFilename: null
      });

      logWrite(success ? `Email sent to ${email}` : `Failed to send email to ${email}`);
    }

  } catch (err) {
    logWrite(`Error sending personalized emails: ${err.message}`);
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        logWrite(`Failed to close Oracle DB connection: ${err.message}`);
      }
    }
  }
}

async function send20thEmails() {
  let connection;

  try {
    const pool = await getPool();
    connection = await pool.getConnection();

    // Query for active users
    const query = `SELECT lm.LOC_ID ,lm.LOC_NAME ,dm.name as circle ,dm2.name as division,im.EMP_CODE ,im.emp_name ,im.email_id,im.mobile_no 
FROM INCHARGES_MST im
LEFT JOIN LOCATION_MST lm ON TRIM(UPPER(im.LOCATION)) = TRIM(UPPER(lm.LOC_ID))
LEFT JOIN CHECKLIST_MST cm on TRIM(UPPER(cm.LOC_CODE)) = TRIM(UPPER(lm.LOC_ID))
LEFT JOIN DIV_MST dm on TRIM(UPPER(lm.circle)) = TRIM(UPPER(dm.id))
LEFT JOIN DIV_MST dm2 on TRIM(UPPER(lm.div_code)) = TRIM(UPPER(dm2.id))
WHERE im.ROLE_ID = 'R2'
AND lm.status = 'Y'
AND NOT EXISTS (
        SELECT 1 
        FROM CHECKLIST_MST cm
        WHERE 
            TRIM(UPPER(cm.LOC_CODE)) = TRIM(UPPER(lm.LOC_ID))
            AND trunc(cm.CREATED_ON) >= TRUNC(ADD_MONTHS(SYSDATE, 0), 'MM')
       )
`;
    const result = await connection.execute(query, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });

    const offices = result.rows;

    if (offices.length === 0) {
      logWrite("All checklists received. No escalation email sent on 20th.");
      return;
    }

    const tableRows = offices.map(row => `
      <tr>
        <td>${row.LOC_ID}</td>
        <td>${row.LOC_NAME}</td>
        <td>${row.circle}</td>
        <td>${row.division}</td>
        <td>${row.EMP_CODE}</td>
        <td>${row.EMP_NAME}</td>
        <td>${row.EMAIL_ID}</td>
        <td>${row.MOBILE_NO}</td>
      </tr>
    `).join('');

    const emailBody = `
      <p>Dear HR Team,</p>

      <p>This is to inform you that the <strong>Office Inspection Check-sheet</strong> has <strong>not been received</strong> for the current month from the following offices:</p>

      <table border="1" cellspacing="0" cellpadding="6" style="border-collapse: collapse; font-family: Arial, sans-serif; font-size: 14px;">
        <thead style="background-color: #f2f2f2;">
          <tr>
            <th>LOC ID</th>
            <th>Location Name</th>
            <th>Circle</th>
            <th>Division</th>
            <th>Emp Code</th>
            <th>Employee Name</th>
            <th>Email</th>
            <th>Mobile</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>

      <p>Please coordinate with the respective incharges to ensure checklist submission.</p>

      <p>Regards,<br/>Workplace Inspection Automation System</p>
    `;

 

      const success = await sendEmailSmtp({
        emailFrom: 'prateek.ravi@reliancegroupindia.com',
        emailTo: [email],
        emailCc: [],
        emailBcc: [],
        emailSubject: 'Monthly Reminder: Office Inspection Check-sheet',
        emailBody,
        attachmentBytes: null,
        attachmentFilename: null
      });

    logWrite(success ? "Escalation email sent to HR." : "Failed to send escalation email to HR.");

  } catch (err) {
    logWrite(`Error sending personalized emails: ${err.message}`);
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        logWrite(`Failed to close Oracle DB connection: ${err.message}`);
      }
    }
  }
}
module.exports = {sendMonthlyEmailJob,send15thEmails,send20thEmails};

const nodemailer = require('nodemailer');
const fs = require('fs');
const { logWrite } = require('./logfile');
/**
 * Sends an email using SMTP
 * @param {string} emailFrom
 * @param {string[]} emailTo
 * @param {string[]} emailCc
 * @param {string[]} emailBcc
 * @param {string} emailBody (HTML)
 * @param {string} emailSubject
 * @param {Buffer} attachmentBytes
 * @param {string} attachmentFilename
 * @returns {Promise<boolean>}
 */
async function sendEmailSmtp({
  emailFrom,
  emailTo = [],
  emailCc = [],
  emailBcc = [],
  emailBody,
  emailSubject,
  attachmentBytes = null,
  attachmentFilename = null
}) {
  try {
    const transporter = nodemailer.createTransport({
      host: '10.8.61.84',
      port: 25,
      secure: false, // Set true for port 465 (SSL)
      auth: {
        user: emailFrom,
        pass: '' // Add password if needed
      },
      tls: {
        rejectUnauthorized: false // If self-signed or insecure cert
      }
    });

    const mailOptions = {
      from: emailFrom,
      to: emailTo.filter(Boolean),
      cc: emailCc.filter(Boolean),
      bcc: emailBcc.filter(Boolean),
      subject: emailSubject,
      html: emailBody,
      attachments: []
    };

    if (attachmentBytes && attachmentFilename) {
      mailOptions.attachments.push({
        filename: attachmentFilename,
        content: attachmentBytes
      });
    }

    await transporter.sendMail(mailOptions);
    logWrite("Email sent successfully.");
    return true;
  } catch (error) {
    logWrite("Failed to send email:", error.message);
    return false;
  }
}

module.exports = {sendEmailSmtp}


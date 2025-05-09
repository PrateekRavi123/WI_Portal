const crypto = require('crypto');

const algorithm = 'aes-256-cbc';
const secretKey = process.env.secretKey; // Must be 32 characters
const iv = crypto.randomBytes(16); // Initialization vector

function payloadencrypt(text) {
    const cipher = crypto.createCipheriv(algorithm, Buffer.from(secretKey), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
}


module.exports = {  payloadencrypt };
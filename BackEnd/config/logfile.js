const fs = require('fs');
const path = require('path');


const logWrite = (message) => {
    const now = new Date();
    const logDir = path.join(process.cwd(), 'logs'); 
    const logFile = path.join(logDir, `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}.log`);
    
    if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true }); 
    }

    const timestamp = new Date().toLocaleString();
    const logMessage = `[${timestamp}] ${message}\n`;

    fs.appendFile(logFile, logMessage, (err) => {
        if (err) console.error('Error writing log:', err);
    });
};

module.exports = {logWrite};
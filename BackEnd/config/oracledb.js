const dbConfig = {
    user: process.env.IMS_DB_USER,
    password: process.env.IMS_DB_PASSWORD,
    connectString: process.env.IMS_DB_CON_STRING,
};
const oracledb = require('oracledb');
const {logWrite} = require('./logfile')
let connection;
async function getCon() {
    try {
        connection = await oracledb.getConnection(dbConfig);
        logWrite('Connected to Oracle Database');
    } catch (err) {
        logWrite(`Oracle Database Connection Failed:, ${err.message}`);
        throw err;
    }
    return connection;
}
module.exports = { dbConfig, getCon };
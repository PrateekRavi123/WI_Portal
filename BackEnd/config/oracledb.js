const dbConfig = {
    user: process.env.IMS_DB_USER,
    password: process.env.IMS_DB_PASSWORD,
    connectString: process.env.IMS_DB_CON_STRING,
    poolMin: 1,
    poolMax: 10,
    poolIncrement: 1,
};
const oracledb = require('oracledb');
const {logWrite} = require('./logfile')
let connection;
async function getCon() {
    try {
        connection = await oracledb.createPool(dbConfig);
        logWrite('Connected to IMS Oracle Database');
    } catch (err) {
        logWrite(`IMS Oracle Database Connection Failed:, ${err.message}`);
        throw err;
    }
    return connection;
}
module.exports = { dbConfig, getCon };
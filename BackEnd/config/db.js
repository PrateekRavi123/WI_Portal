const sql = require('mssql');
const {logWrite} = require('./logfile')

const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER, // SQL Server IP address or hostname
  database: process.env.DB_NAME, // Name of the database you want to connect to
  options: {
    encrypt: false, // Use encryption if required (for Azure SQL Database, set this to true)
    enableArithAbort: true, // To prevent arithmetic errors
    trustServerCertificate: true
  },
};



let pool;

async function getPool() {
  if (!pool) {
    try {
      pool = await sql.connect(dbConfig);
      logWrite("Connected to SQL Database");
    }
    catch (err) {
      logWrite("SQL Database Connection Failed: ", err.message);
      throw err;
    }
  }
  return pool;
}

module.exports = { sql, getPool };

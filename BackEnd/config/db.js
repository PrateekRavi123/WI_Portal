const sql = require('mssql');
const {logWrite} = require('./logfile')
//Test Server
//  const dbConfig = {
//   user: 'newcon',
//   password: 'n@123456',
//   server: '10.125.75.217', // SQL Server IP address or hostname
//   database: 'WCP_TEST', // Name of the database you want to connect to
//   options: {
//   encrypt: false, // Use encryption if required (for Azure SQL Database, set this to true)
//   enableArithAbort: true, // To prevent arithmetic errors
//   },
// };
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


//Live server
// const dbConfig = {
//   user: 'netmetering',
//   password: 'netmetering123',
//   server: '10.125.75.219', // SQL Server IP address or hostname
//   database: 'visitor', // Name of the database you want to connect to
//   options: {
//     encrypt: false, // Use encryption if required (for Azure SQL Database, set this to true)
//     enableArithAbort: true, // To prevent arithmetic errors
//   },
// };

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

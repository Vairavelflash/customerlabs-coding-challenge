const mysql = require('mysql');

// Create a MySQL connection pool
const connection = mysql.createConnection({
  host: 'sql12.freemysqlhosting.net',
  user: '',
  password: '',
  database: 'sql12624287',
});

// connection.connect();
connection.connect((err) => {
    if (err) {
      console.error('Error connecting to MySQL:', err);
      return;
    }
    console.log('Connected to MySQL server');
  });

module.exports = connection;

// https://www.phpmyadmin.co/index.php - login url

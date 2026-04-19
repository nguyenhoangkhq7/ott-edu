import mysql from 'mysql2/promise';

// Tạo pool kết nối tới MySQL container
export const mysqlPool = mysql.createPool({
  host: process.env.MYSQL_HOST || 'mysql-db', // Tên container MySQL trong file docker-compose
  user: process.env.MYSQL_USER || 'root',     // Thay bằng user thực tế của Hậu
  password: process.env.MYSQL_PASSWORD || 'dmin_password', // Thay bằng pass thực tế
  database: process.env.MYSQL_DATABASE || 'ott_edu_db', // Thay bằng tên database thực tế
  waitForConnections: true,
  connectionLimit: 10,
});

console.log("✅ MySQL Pool initialized for Chat Service");
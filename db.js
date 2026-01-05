import pkg from "pg";
const { Pool } = pkg;

const db = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  ssl: { rejectUnauthorized: false }
});

export default db;
//This was in package.json file
 // "scripts": {
  //   "test": "echo \"Error: no test specified\" && exit 1"
  // },
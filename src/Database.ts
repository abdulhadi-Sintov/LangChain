import { DatabaseSync } from "node:sqlite";
import sql from "mssql";

export const db = new DatabaseSync("employee.db");

// ***********Initialize the database with a sample table and data*************

// db.exec(`
//     DROP TABLE IF EXISTS employees;
// CREATE TABLE employees (
// id INTEGER PRIMARY KEY AUTOINCREMENT,
// name TEXT NOT NULL,
// department TEXT NOT NULL,
// salary INTEGER NOT NULL
// );
//     `);

//     db.prepare(`
// INSERT INTO employees (name, department, salary)
// VALUES ('Ali', 'Engineering', 90000),
//        ('Nouman', 'Marketing', 75000),
//        ('Hadi', 'Sales', 80000);
//     `).run();

// ************MSSQL Server connection pool******************

export const pool = await sql.connect({
  user: "agent_user", // or your SQL user
  password: "LocalDatabase@123",
  server: "DESKTOP-E9OG4C9",
  port: 1433,     // or IP
  database: "RecordsManager",
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
});

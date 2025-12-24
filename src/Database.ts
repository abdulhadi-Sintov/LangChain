import { DatabaseSync } from "node:sqlite";

export const db = new DatabaseSync("employee.db");


db.exec(`
    DROP TABLE IF EXISTS employees;
CREATE TABLE employees (
id INTEGER PRIMARY KEY AUTOINCREMENT,
name TEXT NOT NULL,
department TEXT NOT NULL,
salary INTEGER NOT NULL
);
    `);

    db.prepare(`
INSERT INTO employees (name, department, salary)
VALUES ('Ali', 'Engineering', 90000),
       ('Nouman', 'Marketing', 75000),
       ('Hadi', 'Sales', 80000);
    `).run();
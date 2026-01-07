import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { db } from "./Database.js";
import { pool } from "./Database.js";
import sql from "mssql";

// SQL Query Tool - only allows SELECT queries

export const queryDB = tool(
  async ({ query }: { query: string }) => {
    if (!query.toLowerCase().startsWith("select")) {
      throw new Error("Only SELECT queries are allowed.");
    }
    //return db.prepare(query).all();
    const result = await pool.request().query(query);
    return result.recordset;
  },
  {
    name: "query_database",
    description:
      "Run SELECT SQL queries on the employee database. Only SELECT queries are allowed.",
    schema: z.object({
      query: z.string(),
    }),
  }
);

// Get the current local time

export const getCurrentTime = tool(
  async () => new Date().toLocaleTimeString(),
  {
    name: "get_current_time",
    description: "Returns the current local time",
    schema: z.object({}),
  }
);

// List all tables in the database

export const listTables = tool(
  async () => {
    return pool
      .request()
      .query(
        `
      SELECT TABLE_NAME
      FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_TYPE = 'BASE TABLE'
    `
      )
      .then((result) => result.recordset.map((row: any) => row.TABLE_NAME));
  },
  {
    name: "list_tables",
    description: "List all tables in the database",
    schema: z.object({}),
  }
);

// Describe a table

export const describeTable = tool(
  async ({ table }: { table: string }): Promise<{ COLUMN_NAME: string; DATA_TYPE: string }[]> => {
    const result = await pool
      .request()
      .input("tableName", sql.NVarChar, table)
      .query(`
        SELECT COLUMN_NAME, DATA_TYPE
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_NAME = @tableName
      `);

    return result.recordset;
  },
  {
    name: "describe_table",
    description: "Get column names and types for a table",
    schema: z.object({
      table: z.string(),
    }),
  }
);

// Export all tools
export const tools = {
  list_tables: listTables,
  describe_table: describeTable,
  query_database: queryDB,
  get_current_time: getCurrentTime,
};

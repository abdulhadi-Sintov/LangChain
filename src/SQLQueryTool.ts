import {tool} from "@langchain/core/tools";
import {z} from "zod";
import { db } from "./Database.js";

export const queryDB = tool( 
    async ({query}:{query:string}) => {
        if (!query.toLowerCase().startsWith("select")) {
            throw new Error("Only SELECT queries are allowed.");
        }
        return db.prepare(query).all();
    },
    {
        name: "query_database",
        description: "Run SELECT SQL queries on the employee database. Only SELECT queries are allowed.",
        schema: z.object({
            query:z.string(),
        }),
    }
);
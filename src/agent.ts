import readline from "readline";
import { z } from "zod";

import { ChatOllama } from "@langchain/ollama";
import { tool } from "@langchain/core/tools";
import {ChatPromptTemplate, MessagesPlaceholder} from "@langchain/core/prompts";
import { ChatMessageHistory } from "@langchain/community/stores/message/in_memory";
import { HumanMessage, AIMessage } from "@langchain/core/messages";
import { queryDB } from "./SQLQueryTool.js";

/* =========================
   1️-TOOL
   ========================= */
const getCurrentTime = tool(
  async () => new Date().toLocaleTimeString(),
  {
    name: "get_current_time",
    description: "Returns the current local time",
    schema: z.object({}),
  }
);

const tools = {
  query_database: queryDB,
};

/* =========================
   2️- MODEL
   ========================= */
const model = new ChatOllama({
  model: "llama3.1",
  temperature: 6,
}).bindTools([queryDB]);

/* =========================
   3️- PROMPT
   ========================= */
const prompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    `You are a database agent.

CRITICAL RULES:
- You MUST use the SQL tool for ANY question about data
- NEVER answer from memory or guessing
- If a SQL tool is not used, respond: "I must query the database"
- Always use DISTINCT when selecting names
- Never return duplicate rows

Database schema:
Table: employees
Columns: id, name, department, salary`,
  ],
  //Past messages are injected here
  new MessagesPlaceholder("history"),
  //user message
  ["human", "{input}"],
]);
// connect prompt and model
const chain = prompt.pipe(model);

/* =========================
   4️- MEMORY
   ========================= */
const store = new Map<string, ChatMessageHistory>();


//Function to get memory for a user
const getHistory = (sessionId: string) => {
  if (!store.has(sessionId)) {
    //Create memory if first time
    store.set(sessionId, new ChatMessageHistory());
  }
  return store.get(sessionId)!;
};

/* =========================
   5️- CLI LOOP
   ========================= */
   //Enables terminal input/output
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const sessionId = "user-1";

console.log(" Chatbot ready. Type 'exit' to quit.\n");

const ask = () => {
  rl.question("You: ", async (input) => {
    if (input.toLowerCase() === "exit") {
      rl.close();
      return;
    }

    const history = getHistory(sessionId);
    const past = await history.getMessages();

    // Step 1: model responds
    let aiResponse = await chain.invoke({
      input,
      history: past,
    });

    // Save assistant tool request message
    const assistantMessage = aiResponse as AIMessage;

    // Step 2: If tool requested, run it correctly
    if (assistantMessage.tool_calls?.length) {
  for (const call of assistantMessage.tool_calls) {
    const tool = tools[call.name as keyof typeof tools]!;

    const toolResult = await tool.invoke(call.args as { query: string });

    aiResponse = await model.invoke([
      ...past,
      new HumanMessage(input),
      assistantMessage,
      {
        role: "tool",
        tool_call_id: call.id!,
        content: JSON.stringify(toolResult),
      },
    ]);
  }
}

    const finalText =
      typeof aiResponse.content === "string"
        ? aiResponse.content
        : JSON.stringify(aiResponse.content);

    console.log("AI:", finalText, "\n");

    // Step 4: Save memory
    await history.addUserMessage(input);
    await history.addAIMessage(finalText);

    ask();
  });
};

ask();

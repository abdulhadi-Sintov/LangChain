import readline from "readline";

import { ChatOllama } from "@langchain/ollama";
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "@langchain/core/prompts";
import { ChatMessageHistory } from "@langchain/community/stores/message/in_memory";
import { HumanMessage, AIMessage, ToolMessage } from "@langchain/core/messages";
import { tools } from "./Tools.js";
import type { StructuredTool } from "@langchain/core/tools";

const toolRegistry: Record<string, StructuredTool> = tools;

/* =========================
   2️- MODEL
   ========================= */
const model = new ChatOllama({
  model: "llama3.1",
  temperature: 0,
}).bindTools(Object.values(tools)); // Bind all tools

/* =========================
   3️- PROMPT
   ========================= */
const prompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    `You are a strict database agent that ONLY answers user questions by querying data.

CRITICAL RULES:
1. NEVER call describe_table or list_tables unless the user EXPLICITLY asks about table structure
2. If you need to know table/column names, make an educated guess and query_database directly
3. ALWAYS call query_database to get actual data - NEVER return schema information
4. After getting query results, return ONLY the answer to the user's question
5. NEVER show tool outputs, schema, or SQL queries to the user

EXECUTION FLOW:
1. Understand the user's question
2. Call query_database with a SELECT query (guess table/column names if needed)
3. Return ONLY the final answer based on query results

If query fails, return "Failed" - do NOT explain why or show errors.

`,
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

    // Check if user explicitly asked about schema
    const userAskedAboutSchema = 
      input.toLowerCase().includes("schema") ||
      input.toLowerCase().includes("structure") ||
      input.toLowerCase().includes("columns") ||
      input.toLowerCase().includes("describe") ||
      input.toLowerCase().includes("table structure");

    // Step 1: model responds
    let aiResponse = await chain.invoke({
      input,
      history: past,
    });

    let assistantMessage = aiResponse as AIMessage;
    let maxIterations = 10; // Prevent infinite loops
    let iteration = 0;
    let hasQueriedDatabase = false;

    // Step 2: Execute tool calls in a loop
    while (assistantMessage.tool_calls?.length && iteration < maxIterations) {
      iteration++;
      
      // Build messages for this iteration
      const messagesForModel = [...past, new HumanMessage(input), assistantMessage];
      
      for (const call of assistantMessage.tool_calls) {
        // Block describe_table unless explicitly asked
        if (call.name === "describe_table" && !userAskedAboutSchema) {
          // Skip this tool call and force query_database instead
          continue;
        }
        
        if (call.name === "list_tables" && !userAskedAboutSchema) {
          // Skip this tool call
          continue;
        }

        const tool = toolRegistry[call.name];
        if (!tool) {
          throw new Error(`Unknown tool: ${call.name}`);
        }

        const toolResult = await tool.invoke(call.args);
        
        // Track if we queried the database
        if (call.name === "query_database") {
          hasQueriedDatabase = true;
        }

        // Add tool result to messages
        messagesForModel.push(
          new ToolMessage({
            content: JSON.stringify(toolResult),
            tool_call_id: call.id!,
          })
        );
      }

      // If we got schema info but haven't queried database, force a query
      if (!hasQueriedDatabase && !userAskedAboutSchema) {
        // Get the last tool result (likely schema)
        const lastToolResult = messagesForModel[messagesForModel.length - 1];
        
        // Force the model to use schema info to query database
        const forceQueryMessage = new HumanMessage(
          "Now use this information to query the database and answer the user's question. Call query_database immediately."
        );
        
        aiResponse = await model.invoke([...messagesForModel, forceQueryMessage]);
        assistantMessage = aiResponse as AIMessage;
        continue;
      }

      // Get next response from model
      aiResponse = await model.invoke(messagesForModel);
      assistantMessage = aiResponse as AIMessage;
    }

    // If we never queried the database and user didn't ask about schema, force it
    if (!hasQueriedDatabase && !userAskedAboutSchema && !assistantMessage.tool_calls?.length) {
      // Force a database query
      const forceQueryPrompt = `The user asked: "${input}". You must call query_database to answer this question. Do not return schema or table information.`;
      aiResponse = await model.invoke([
        ...past,
        new HumanMessage(forceQueryPrompt),
      ]);
      assistantMessage = aiResponse as AIMessage;
      
      // Execute the forced query
      if (assistantMessage.tool_calls?.length) {
        for (const call of assistantMessage.tool_calls) {
          if (call.name === "query_database") {
            const tool = toolRegistry[call.name];
            const toolResult = await tool.invoke(call.args);
            aiResponse = await model.invoke([
              ...past,
              new HumanMessage(input),
              assistantMessage,
              new ToolMessage({
                content: JSON.stringify(toolResult),
                tool_call_id: call.id!,
              }),
            ]);
            assistantMessage = aiResponse as AIMessage;
            break;
          }
        }
      }
    }

    // Extract final text response
    let finalText =
      typeof assistantMessage.content === "string"
        ? assistantMessage.content
        : JSON.stringify(assistantMessage.content);

    // Filter out schema-related content if user didn't ask
    if (!userAskedAboutSchema) {
      finalText = finalText
        .replace(/schema|structure|columns?|table\s+structure/gi, "")
        .replace(/describe_table|list_tables/gi, "")
        .trim();
      
      // If response looks like schema info, return "Failed"
      if (finalText.toLowerCase().includes("column_name") || 
          finalText.toLowerCase().includes("data_type") ||
          finalText.match(/^\s*\[.*COLUMN_NAME.*\]/)) {
        finalText = "Failed";
      }
    }

    console.log("AI:", finalText, "\n");

    // Save memory
    await history.addUserMessage(input);
    await history.addAIMessage(finalText);

    ask();
  });
};

ask();

import readline from "readline";

import { ChatOllama } from "@langchain/ollama";
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "@langchain/core/prompts";
import { ChatMessageHistory } from "@langchain/community/stores/message/in_memory";
import { HumanMessage, AIMessage } from "@langchain/core/messages";
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
    `You are a strict database agent.

EXECUTION FLOW (MANDATORY):

1. Understand the user's question and identify:
   - Table name
   - Column names
   - Filters

2. If the table or column names are NOT 100% known:
   - Call describe_table for the table
   - Continue to Step 3 (DO NOT STOP)

3. Always retrieve data using query_database:
   - Use SELECT queries only
   - Use case-insensitive comparisons for text
   - Never guess values

4. After receiving query results:
   - Analyze ONLY the returned data
   - Do NOT reuse past answers
   - Do NOT explain schema unless asked

5. Return a FINAL answer:
   - Directly answer the user’s question
   - Use plain text
   - No reasoning, no tool output, no explanations

ABSOLUTE RULES:
- NEVER answer without querying the database
- NEVER stop after schema discovery
- NEVER reuse previous answers
- NEVER hallucinate
- NEVER explain unless asked

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

    // Step 1: model responds
    let aiResponse = await chain.invoke({
      input,
      history: past,
    });

    // Save assistant tool request message
    let assistantMessage = aiResponse as AIMessage;

    // Step 2: If tool requested, run it correctly
    while (assistantMessage.tool_calls?.length) {
      for (const call of assistantMessage.tool_calls) {
        const tool = toolRegistry[call.name]!;
        if (!tool) {
          throw new Error(`Unknown tool: ${call.name}`);
        }

        const toolResult = await tool.invoke(call.args);

        aiResponse = await model.invoke([
          ...past,
          //new HumanMessage(input),
          assistantMessage,
          {
            role: "tool",
            tool_call_id: call.id!,
            content: JSON.stringify(toolResult),
          },
        ]);
         assistantMessage = aiResponse as AIMessage;
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

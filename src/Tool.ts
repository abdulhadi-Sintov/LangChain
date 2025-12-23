import { ChatPromptTemplate } from "@langchain/core/prompts";
import { tool } from "@langchain/core/tools";
import { ChatOllama } from "@langchain/ollama";
import { z } from "zod";

const getCurrentTime = tool(async () => {
    return new Date().toLocaleTimeString();
}, {
    name: "get_current_time",
    description: "Get the current local time",
    schema: z.object({}),
});
const tools = {
  get_current_time: getCurrentTime,
};

const model = new ChatOllama({
  model: "llama3.1",
  temperature: 0,
}).bindTools([getCurrentTime]); 

const prompt = ChatPromptTemplate.fromMessages([
  ["system", "You are a helpful assistant. Use tools when needed."],
  ["human", "{input}"],
]);

const chain = prompt.pipe(model);

const result = await chain.invoke({
  input: "What time is it right now?",
});

// If the model requested a tool
if (result.tool_calls && result.tool_calls.length > 0) {
  for (const call of result.tool_calls) {
    const toolToRun = tools[call.name as keyof typeof tools];
    const toolResult = await toolToRun.invoke(call.args);

    console.log("🛠 Tool Result:", toolResult);

    // Send tool result back to the model
    const finalResponse = await model.invoke([
      {
        role: "tool",
        tool_call_id: call.id,
        content: toolResult,
      },
    ]);

    console.log("Final AI Response:", finalResponse.content);
  }
}
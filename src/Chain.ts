import { ChatOllama } from "@langchain/ollama";
import { PromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";

const model = new ChatOllama({
  model: "llama3.1",
  temperature: 2.0,
});

// 1️⃣ Prompt template
const prompt = new PromptTemplate({
  template: `
You are a helpful teacher.
Explain {topic} to a {audience}.
Keep the answer under 6 sentences.
`,
  inputVariables: ["topic", "audience"],
});

// 2️⃣ Chain = Prompt → Model
const chain = RunnableSequence.from([
  prompt,
  model,
]);

// 3️⃣ Run the chain
const response = await chain.invoke({
  topic: "designing",
  audience: "beginner developer",
});

console.log(response.content);
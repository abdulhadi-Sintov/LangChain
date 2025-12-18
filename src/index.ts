import { ChatOllama } from "@langchain/ollama";

async function main() {
  // Create Ollama LLM
  const model = new ChatOllama({
    model: "llama3.1",
    temperature: 0.7,
  });

  // Ask something
  const response = await model.invoke("Explain LangChain in one sentence");

  console.log(response.content);
}

main();

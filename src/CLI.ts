import readline from "readline";
import { ChatOllama } from "@langchain/ollama";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { RunnableWithMessageHistory } from "@langchain/core/runnables";
import { ChatMessageHistory } from "@langchain/community/stores/message/in_memory";


const model = new ChatOllama({
  model: "llama3.1",
  temperature: 0.7,
});

const prompt = ChatPromptTemplate.fromMessages([
  ["system", "You are a helpful assistant. Remember what the user tells you."],
  new MessagesPlaceholder("history"), //  THIS enables memory
  ["human", "{input}"],
]);

const chain = prompt.pipe(model);

const store = new Map<string, ChatMessageHistory>();

const chainWithMemory = new RunnableWithMessageHistory({
  runnable: chain,
  getMessageHistory: async (sessionId: string) => {
    if (!store.has(sessionId)) {
      store.set(sessionId, new ChatMessageHistory());
    }
    return store.get(sessionId)!;
  },
  inputMessagesKey: "input",
  historyMessagesKey: "history",
});


const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const sessionId = "user-1"; //  same ID = same memory

console.log(" Chatbot started. Type 'exit' to quit.\n");

const ask = () => {
  rl.question("You: ", async (input) => {
    if (input.toLowerCase() === "exit") {
      rl.close();
      return;
    }

    const response = await chainWithMemory.invoke(
      { input },
      { configurable: { sessionId } }
    );

    console.log("AI:", response.content, "\n");
    ask();
  });
};

ask();

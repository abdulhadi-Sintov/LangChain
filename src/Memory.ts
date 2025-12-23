import { ChatOllama } from "@langchain/ollama";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { RunnableWithMessageHistory } from "@langchain/core/runnables";
import { ChatMessageHistory } from "@langchain/community/stores/message/in_memory";

const model = new ChatOllama({
  model: "llama3.1",
  temperature: 0.7,
});

// 1️⃣ Prompt with memory placeholder
const prompt = ChatPromptTemplate.fromMessages([
  ["system", "You are a helpful assistant."],
  new MessagesPlaceholder("history"),
  ["human", "{input}"],
]);

// 2️⃣ Base chain
const chain = prompt.pipe(model);

// 3️⃣ In-memory chat history store
const messageHistories = new Map<string, ChatMessageHistory>();

// 4️⃣ Wrap chain with memory
const chainWithMemory = new RunnableWithMessageHistory({
  runnable: chain,
  getMessageHistory: async (sessionId: string) => {
    if (!messageHistories.has(sessionId)) {
      messageHistories.set(sessionId, new ChatMessageHistory());
    }
    return messageHistories.get(sessionId)!;
  },
  inputMessagesKey: "input",
  historyMessagesKey: "history",
});

// 5️⃣ Simulate a conversation
const sessionId = "user-1";

// console.log("AI:", (await chainWithMemory.invoke(
//   { input: "My name is Abdul." },
//   { configurable: { sessionId } }
// )).content);

console.log("AI:", (await chainWithMemory.invoke(
  { input: "What is my name?" },
  { configurable: { sessionId } }
)).content);

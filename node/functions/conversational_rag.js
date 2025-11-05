import { Chroma } from "@langchain/community/vectorstores/chroma";
import { Ollama } from "@langchain/ollama";
import { OllamaEmbeddings } from "@langchain/ollama";
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "@langchain/core/prompts";
import { createHistoryAwareRetriever } from "langchain/chains/history_aware_retriever";
import { createStuffDocumentsChain } from "langchain/chains/combine_documents";
import { createRetrievalChain } from "langchain/chains/retrieval";

export const conversational_rag = async (llm , chatHistory , input)=>{
  const embeddings = new OllamaEmbeddings({
      model: "nomic-embed-text", 
    });
  
    const vectorStore = new Chroma(embeddings, {
      url: "http://localhost:8000", 
      collectionName: "conversational_rag_doc", 
    });
  
    const retriever = vectorStore.asRetriever(); 
  
    const contextualizeQSystemPrompt =
    "Given a chat history and the latest user question " +
    "which might reference context in the chat history, " +
    "formulate a standalone question which can be understood " +
    "without the chat history. Do NOT answer the question, " +
    "just reformulate it if needed and otherwise return it as is.";
  
  const contextualizeQPrompt = ChatPromptTemplate.fromMessages([
    ["system", contextualizeQSystemPrompt],
    new MessagesPlaceholder("chat_history"),
    ["human", "{input}"],
  ]);
  
  const historyAwareRetriever = await createHistoryAwareRetriever({
    llm,
    retriever,
    rephrasePrompt: contextualizeQPrompt,
  });
  
  const systemPrompt =
    "You are an assistant for question-answering tasks. " +
    "Use the following pieces of retrieved context to answer " +
    "the question. If you don't know the answer, say that you " +
    "don't know. Use three sentences maximum and keep the " +
    "answer concise." +
    "\n\n" +
    "{context}";
  
  const qaPrompt = ChatPromptTemplate.fromMessages([
    ["system", systemPrompt],
    new MessagesPlaceholder("chat_history"),
    ["human", "{input}"],
  ]);
  
  const questionAnswerChain = await createStuffDocumentsChain({
    llm,
    prompt: qaPrompt,
  });
  
  const ragChain = await createRetrievalChain({
    retriever: historyAwareRetriever,
    combineDocsChain: questionAnswerChain,
  });

  const result = await ragChain.invoke({
    input,
    chat_history: chatHistory,
  });

  return result.answer
    
}
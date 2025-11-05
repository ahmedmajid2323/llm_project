import {  OllamaEmbeddings } from "@langchain/ollama";
import { z } from "zod";
import { RunnableSequence } from "@langchain/core/runnables";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { JsonOutputParser, StructuredOutputParser } from "@langchain/core/output_parsers";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { Chroma } from "@langchain/community/vectorstores/chroma";
import dotenv from 'dotenv'
import path from 'path'
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

export const outputparer_function = async (llm , document)=>{

    const loader = new PDFLoader(document)
    const doc = await loader.load()

    const textSplitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 400,
    });
    const splitDocs = await textSplitter.splitDocuments(doc);

    const embeddings = new OllamaEmbeddings({
        model: "nomic-embed-text", 
    });

    /* const vectorStore = await Chroma.fromDocuments(splitDocs, embeddings, {
        collectionName: "outputparser", 
        url: "http://localhost:8000", 
        collectionMetadata: {
            "hnsw:space": "cosine",
        },
    }); */

    const vectorStore = await MemoryVectorStore.fromDocuments(splitDocs , embeddings)

 
  const retrieval = vectorStore.asRetriever()

  const zodSchema = z.object({
    credentials: z.object({
      name: z.string().describe("The name of the resume owner."),
      email: z.string().email().describe("The email of the resume owner."),
      phone_number: z
      .string()
      .describe("The phone number of the resume owner (exactly 8 digits) , it only includes number not characters."),
    }).describe('The credentials of the user\'s resume.'),
    projects: z.array(
      z.object({
        name: z.string().describe("The name of the project."),
        description: z.string().describe("the description of the project, every project has its own description."),
      })
    ).describe("A list of projects, each with a name and description."),
    certificates: z.array(
      z.object({
        name: z.string().describe("The name of the certificate."),
        description: z.string().optional().describe("A brief description of the certificate."),
      })
    ).optional().describe("A list of certificates, each with a name and description."),
    skills: z.array(
      z.object({
        name: z.string().describe("skill name."),
        description: z.string().optional().describe("A brief description of the skill if available."),
      })
    ).describe("A list of skills, each with a name and a description if available , fo not just the name."),
  });

  const parser = StructuredOutputParser.fromZodSchema(zodSchema);

  // Create a prompt template that instructs the model to return only the JSON object.
  // Note: We explicitly tell the model "do not include any extra text or markdown".
  const prompt = ChatPromptTemplate.fromTemplate(
    `Answer the user's question as best as possible using the context provided
    You must return only a JSON object that adheres exactly to the following schema, if they don't exist , don't retutn anything
    (do not output any additional text or markdown):

    {format_instructions}

    context : {context}

    Question: {question}`
  );

  const json_parser = new JsonOutputParser()

  // Create a chain from the prompt, model, and output parser.
  const chain = RunnableSequence.from([
    {
      context: async (input) => {
        const relevantDocs = await retrieval._getRelevantDocuments(input.question);
        return relevantDocs.map(doc => doc.pageContent).join("\n");
      },
      question: (input) => input.question,
      format_instructions: (input) => input.format_instructions,
    },
    prompt,
    llm,
    json_parser
  ]);

  try {
    const response = await chain.invoke({
      question: "Extract the credentials (name , email and phone number), projects, certificates and skills of the resume owner.",
      format_instructions: parser.getFormatInstructions(),
    });
  
    return response;
  } catch (error) {
    console.error("Failed to parse the output:", error);
    throw new Error("Failed to parse the output. Please check the LLM's response.");
  }

}


import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { Chroma } from "@langchain/community/vectorstores/chroma";
import { OllamaEmbeddings } from "@langchain/ollama";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";

export const store_chroma = async (document)=>{

    const loader = new PDFLoader(document);
    const docs = await loader.load();

    const textSplitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200,
    });
    const splitDocs = await textSplitter.splitDocuments(docs);

    const embeddings = new OllamaEmbeddings({
        model: "nomic-embed-text", 
    });

    const vectorStore = await Chroma.fromDocuments(splitDocs, embeddings, {
        collectionName: "conversational_rag_doc", // Replace with your desired collection name
        url: "http://localhost:8000", 
        collectionMetadata: {
            "hnsw:space": "cosine",
        },
    });
}
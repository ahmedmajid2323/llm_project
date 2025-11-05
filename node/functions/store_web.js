import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { Chroma } from "@langchain/community/vectorstores/chroma";
import { OllamaEmbeddings } from "@langchain/ollama";
import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";

export const store_web = async (url)=>{

    const loader = new CheerioWebBaseLoader(url)
    const doc = await loader.load()

    const textSplitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200,
    });
    const splitDocs = await textSplitter.splitDocuments(doc);

    const embeddings = new OllamaEmbeddings({
        model: "nomic-embed-text", 
    });

    const vectorStore = await Chroma.fromDocuments(splitDocs, embeddings, {
        collectionName: "conversational_rag_web", 
        url: "http://localhost:8000", 
        collectionMetadata: {
            "hnsw:space": "cosine",
        },
    });

}
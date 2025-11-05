import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { Chroma } from "@langchain/community/vectorstores/chroma";
import { OllamaEmbeddings } from "@langchain/ollama";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";

export const store_crawl = async (url_array) => {
    // Initialize embeddings
    const embeddings = new OllamaEmbeddings({
        model: "nomic-embed-text",
    });

    // Function to process a single URL
    const processUrl = async (url) => {
        try {
            // Load the webpage content
            const loader = new CheerioWebBaseLoader(url);
            const docs = await loader.load();

            // Split the content into chunks
            const textSplitter = new RecursiveCharacterTextSplitter({
                chunkSize: 1000,
                chunkOverlap: 200,
            });
            const splitDocs = await textSplitter.splitDocuments(docs);

            // Store the chunks in the Chroma vector store
            await Chroma.fromDocuments(splitDocs, embeddings, {
                collectionName: "crawl_rag", // Replace with your desired collection name
                url: "http://localhost:8000",
                collectionMetadata: {
                    "hnsw:space": "cosine",
                },
            });

            console.log(`Processed and stored: ${url}`);
        } catch (error) {
            console.error(`Error processing ${url}:`, error);
        }
    };

    try {
        await Promise.all(url_array.map((url) => processUrl(url)));
        return 'all urls are loaded succesfully'
    } catch (error) {
        return ` error loading the urls : ${error} `
    }
    
};
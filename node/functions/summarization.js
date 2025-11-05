import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { PromptTemplate } from "@langchain/core/prompts";
import { Ollama, OllamaEmbeddings } from "@langchain/ollama";
import { loadSummarizationChain } from "langchain/chains";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import {kmeans} from "ml-kmeans";


export const doc_summarization = async (llm , document)=>{

    const loader = new PDFLoader(document)
    const doc = await loader.load()

    const textSplitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000, 
        chunkOverlap: 200, 
    });

    const docs = await textSplitter.splitDocuments(doc);

    const embeddings = new OllamaEmbeddings({
        model: "nomic-embed-text", 
    });

    const embeddingsList = await embeddings.embedDocuments(
        docs.map((doc) => doc.pageContent)
    );

    const results = kmeans(embeddingsList, 3);
    const clusters = results.clusters

    const clusteredDocs = clusters.reduce((acc, clusterIndex, i) => {
        if (!acc[clusterIndex]) acc[clusterIndex] = [];
        acc[clusterIndex].push(docs[i]);
        return acc;
    }, []);

    const summarizeCluster = async (clusterDocs) => {
        const chain = loadSummarizationChain(llm, {
            type: "stuff", 
        });
    
        const result = await chain.invoke({
            input_documents: clusterDocs,
        });
    
        return result.text;
    };

    const clusterSummaries = await Promise.all( 
        clusteredDocs.map((docs) => summarizeCluster(docs))
    );
    
    const finalSummary = clusterSummaries.join("\n");

    return finalSummary
}
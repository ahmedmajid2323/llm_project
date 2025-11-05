import express from 'express';
import cors from 'cors';
import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";
import multer from 'multer';
import { doc_summarization } from "./functions/summarization.js";
import fs from 'fs/promises';
import path from 'path';
import { store_chroma } from './functions/store_db.js';
import { ChromaClient } from 'chromadb';
import { conversational_rag } from './functions/conversational_rag.js';
import { store_web } from './functions/store_web.js';
import { conversational_web } from './functions/web_conversation.js';
import { conversational_crawl } from './functions/crawl_conv.js';
import { outputparer_function } from './functions/ouputparser.js';
import { ChatGroq } from '@langchain/groq';
import dotenv from 'dotenv'
import { store_crawl } from './functions/store_crawl.js';
import { agent_chat } from './functions/agent.js';
dotenv.config()

const app = express();

app.use(express.json());
app.use(cors());

const storage_summary = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'summary_pdf/'); // Save files in the 'uploads/' directory
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + '.pdf'); // Add .pdf extension
  },
});
const upload_summary = multer({storage: storage_summary });

const llm = new ChatGroq({
    model: "mixtral-8x7b-32768", 
    temperature: 0.5,        
});

app.post('/summarization',upload_summary.single('pdf'), async (req, res) => {
  try {
    const pdfPath = req.file.path;
    const summary = await doc_summarization(llm , pdfPath);
    const formattedSummary = summary.replace(/\n/g, '<br>');  
    res.status(200).json({summary : formattedSummary})
    await fs.unlink(pdfPath);
  } catch (error) {
    console.error('Error summarizing document:', error);
    res.status(500).json({ error: 'Failed to summarize the document' });
  } 
});

const storage_rag = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'conv_rag/'); // Save files in the 'uploads/' directory
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + '.pdf'); // Add .pdf extension
  },
});
const upload_rag = multer({ storage: storage_rag });

const client = new ChromaClient({ path: "http://localhost:8000" });

// middleware to clear what is in the conv_rag/ before storing in it 
const clearDirectory = async (req, res, next) => {
  try {
    const folderPath = 'conv_rag/';
    const files = await fs.readdir(folderPath);

    for (const file of files) {
      const filePath = path.join(folderPath, file);
      await fs.unlink(filePath);
      console.log(`Deleted file: ${filePath}`);
    }

    const collections = await client.listCollections();

    if (collections.includes("conversational_rag_doc")) {
      const collection = await client.getCollection({ name: "conversational_rag_doc" });
      await client.deleteCollection(collection);
      console.log("🗑 Deleted existing ChromaDB collection 'conversational_rag_doc'.");
  }

  await client.createCollection({ name: "conversational_rag_doc" });
  console.log("✅ Created new ChromaDB collection 'conversational_rag_doc'."); 

    next();
  } catch (error) {
    console.error('Error clearing directory:', error);
    res.status(500).json({ error: 'Failed to clear directory' });
  }
};

app.post('/conv_rag_store', clearDirectory , upload_rag.single('pdf'), async (req, res) => {
  try {
    const pdfPath = req.file.path;
    await store_chroma(pdfPath)
    res.status(200).json({ message: 'File uploaded successfully' });
  } catch (error) {
    console.error('Error uploading file for conversational rag document:', error);
    res.status(500).json({ error: 'Failed to store file for conversational rag the document' });
  } 
});

app.post('/conv_rag', async (req, res) => {
  try {
    const  {Input , Chat} = req.body
    const llm_response = await conversational_rag(llm , Chat , Input)
    res.status(200).json({ llm_response });
  } catch (error) {
    console.error('Error sending llm response for rag:', error);
  }
});

const clear_storage_web = async (req , res , next)=>{
  try { 

    const collections = await client.listCollections();

    if (collections.includes("conversational_rag_web")) {
      const collection = await client.getCollection({ name: "conversational_rag_web" });
      await client.deleteCollection(collection);
      console.log("🗑 Deleted existing ChromaDB collection 'conversational_rag_web'.");
    }

    await client.createCollection({ name: "conversational_rag_web" });
    console.log("✅ Created new ChromaDB collection 'conversational_rag_web'.");

    next();
  } catch (error) {
    console.error('Error clearing web storage:', error);
    res.status(500).json({ error: 'Failed to clear web storage' });
  }
}

app.post('/load_html_page', clear_storage_web , async (req, res) => {
  try {
    const { url } = req.body;
    await store_web(url)
    res.status(200).json({message : 'doc stored successfully !!'})
  } catch (error) {
    console.error('Error loading html page:', error);
  }
});

app.post('/conv_web', async (req, res) => {
  try {
    const {Input , Chat} = req.body
    const llm_response = await conversational_web(llm , Chat , Input)
    res.status(200).json({ llm_response });
  } catch (error) {
    console.error('error response in conv_web:', error);
  }
});

const storage_outputparser = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'outputparser/'); // Save files in the 'uploads/' directory
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + '.pdf'); // Add .pdf extension
  },
});

const upload_outputparser = multer({ storage: storage_outputparser });

const clear_storage_parser = async (req , res , next)=>{
  try {
    /* const collection = await client.getCollection({ name: "outputparser" });
    if (collection) {
      const ids = (await collection.get()).ids;
      await collection.delete({ ids });
    } */

    const folderPath = 'outputparser/';
    const files = await fs.readdir(folderPath);

    for (const file of files) {
      const filePath = path.join(folderPath, file);
      await fs.unlink(filePath);
      console.log(`Deleted file: ${filePath}`);
    }

    next();
  } catch (error) {
    console.error('Error clearing parser storage:', error);
    res.status(500).json({ error: 'Failed to clear parser storage' });
  }
}

app.post('/upload_file_parser', clear_storage_parser , upload_outputparser.single('pdf'),  async (req, res) => {
  try {
    const pdfPath = req.file.path;
    const llm_object = await outputparer_function(llm , pdfPath)
    res.status(200).json({llm_response : llm_object})
  } catch (error) {
    console.error('Error returning structured_ouput:', error);
  } 
});

const empty_crawl = async (req , res , next)=>{
  try {
    const collections = await client.listCollections();
    if (collections.includes("crawl_rag")) {
      const collection = await client.getCollection({ name: "crawl_rag" });
      await client.deleteCollection(collection);
      console.log("🗑 Deleted existing ChromaDB collection 'crawl_rag'.");
    }

    await client.createCollection({ name: "crawl_rag" });
    console.log("✅ Created new ChromaDB collection 'crawl_rag'.");
    next()
  
  } catch (error) {
    console.error('Error deleting crawl_rag collection:', error);
    res.status(500).json({ error: 'Failed deleting crawl_rag collection' });
  }
}

app.post('/load_web_crawling', empty_crawl , async (req, res) => {
  const data = req.body.visitedurls;
  const urlsArray = Object.keys(data);
  const filteredArray = urlsArray.filter(url => url.startsWith("https://"));
  const response = await store_crawl(filteredArray)
  console.log(response)
  const collections = await client.listCollections();
  console.log(collections)

  res.status(200).json({message:'eseaved the urls succesfully !!'})  
})

app.post('/conv_crawl', async (req, res) => {
  try {
    const {Input , Chat} = req.body
    const llm_response = await conversational_crawl(llm , Chat , Input)
    res.status(200).json({ llm_response });
  } catch (error) {
    console.error('error response in conv_crawl:', error);
  }
});

app.post('/agent_chat', async (req, res) => {
  try {
    const {Input} = req.body
    const llm_response = await agent_chat(llm , Input)
    res.status(200).json({ llm_response });
  } catch (error) {
    console.error('error response in agent_chat:', error);
  }
});

app.listen(3000, () => {
  console.log(`chat app listening on port 3000`);
});
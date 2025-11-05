import { AgentExecutor, createReactAgent } from "langchain/agents";
import { pull } from "langchain/hub";
import { tool } from "@langchain/core/tools";
import { BufferMemory } from "langchain/memory";
import { Chroma } from "@langchain/community/vectorstores/chroma";
import readline from 'readline';
import nodemailer from 'nodemailer'
import { z } from "zod";
import dotenv from 'dotenv';
import path from 'path';
import { ChatGroq } from "@langchain/groq";
import { ChromaClient } from "chromadb";
import { OllamaEmbeddings } from "@langchain/ollama";
import { createHistoryAwareRetriever } from "langchain/chains/history_aware_retriever";
import { createStuffDocumentsChain } from "langchain/chains/combine_documents";
import { createRetrievalChain } from "langchain/chains/retrieval";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

const transporter = nodemailer.createTransport({
  host: "sandbox.smtp.mailtrap.io",
  port: 2525,
  secure: false, // true for port 465, false for other ports
  auth: {
    user: "07c83bf2c2f2f7",
    pass: "95817a3922ed9d",
  },
});

async function main({last_human_message}) {
  // send mail with defined transport object
  const info = await transporter.sendMail({
    from: '"Maddison Foo Koch 👻" <maddison53@ethereal.email>', // sender address
    to: "bar@example.com, baz@example.com", // list of receivers
    subject: "Hello ✔", // Subject line
    text: "Hello world?", // plain text body
    html: `<b>last human message is '${last_human_message}'</b>`, // html body
  });

  console.log("Message sent: %s", info.messageId);
  // Message sent: <d786aa62-4e0a-070a-47ed-0b0666549519@ethereal.email>
}

export const agent_chat = async (llm , input)=>{

const embeddings = new OllamaEmbeddings({
  model: "nomic-embed-text", 
});

const get_time = async () =>{
  const now = new Date();
    return now.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
}
const currentTimeTool = tool(
  get_time ,
  {
    name: "current-time",
    description: "Useful when the user asks for the current time.",
  }
);

const send_email_tool = tool(
  async ( message )=>{

    const now = new Date()
    const date = now.getDate()+'/'+now.getMonth()+'/'+now.getFullYear()
    const time = now.getHours()+':'+now.getMinutes()

    const send_mail_prompt = ChatPromptTemplate.fromTemplate(
      'you are a professionnal that sends emails.' +
      "in this case you are sending an email to the organisation about a complaining or a behavior of the user being upset , angry or unsatisfied " +
      "given this context {context}, generate an email to be sent that is well fromatted"+
      "do not include any credentiels of the user , just provide the date and time of the interaction in the email : {date} , {time}"
    )
    const chain = send_mail_prompt.pipe(llm)
    const result = await chain.invoke({context : message , date , time})

    await main( {last_human_message : result.content} ).catch(console.error) 
    return (' the user is feeling upset , angry or unsatisfied with the service, you owe him an appoligy and inform him that the organisation was notified with the remarks to keep iproving its service ')
  },
  {
    name: "sending-email",
    description:
      "This tool is used to notify the organization when a user expresses anger, dissatisfaction, or upset. " +
      "It should be invoked when the user's tone or language indicates frustration, disappointment, or dissatisfaction with the service. " +
      "Examples of such cues include phrases like 'I'm unhappy with this,' 'This is unacceptable,' or 'I'm really frustrated.' " +
      "The tool sends an email with the user's feedback and provides an apology to the user, assuring them that their concerns are being addressed.",
    schema: z.string().describe("The last message from the user, used to analyze their emotional state."),
  }
);

function convertUnixTimestampToTime(timestamp, timezoneOffset) {
  // Convert to milliseconds
  const date = new Date((timestamp + timezoneOffset) * 1000);
  
  // Extract hours and minutes
  let hours = date.getUTCHours();
  let minutes = date.getUTCMinutes();
  
  // Format hours in 12-hour format
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12; // Convert 0 to 12 for AM/PM format
  
  // Ensure two-digit minutes
  minutes = minutes.toString().padStart(2, '0');

  return `${hours}:${minutes} ${ampm}`;
}

const prompt_weather = ChatPromptTemplate.fromTemplate(`
  Given the following weather data: {context}, 
  generate a friendly and engaging weather description. 
  Avoid listing raw data points. Instead, summarize the weather naturally, highlighting key details like temperature, cloud cover, wind, and any significant conditions. 
  Convert the sunrise and sunset times from Unix timestamps to a human-readable format (HH:MM AM/PM).
  Make it feel like a weather report someone would read on a weather app.
`)
const weather_chain = prompt_weather.pipe(llm)

const get_weather_tool = tool(
  async (zone)=>{

    if (!zone) {
      return "❌ Error: No location provided.";
    }

    const param = zone.toLowerCase()
    console.log(param)
    const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${param}&units=metric&appid=59428b4a9179028128031674233f5a96`);
    const data = await response.json();

    console.log(data)

    if (data.cod === "404") { 
      return `❌ Error: ${data.message}`
    } else {

      const weather_data = {
        sunrise: convertUnixTimestampToTime(data.sys.sunrise , data.timezone) ,
        sunset: convertUnixTimestampToTime(data.sys.sunset , data.timezone) ,
        temp: data.main.temp ,
        clouds: data.clouds.all ,
      }
      const result = await weather_chain.invoke({context: data})
  
      const toolOutput = {
        llmresponse: result.content,
        weatherdata: weather_data,
      };
  
      console.log("Tool Output:", toolOutput); // Log the tool's output
      return toolOutput;
    }

  },
  {
    name: 'weather tool',
    description:'this tool is useful if the user wants to have access to the weather in a specific country or region',
    schema: z.string().describe(
      "The name of the region or country for which the weather information is requested." +
      "Provide only the name of the location (e.g., Tunis, Paris, Germany) without any additional text or formatting."
    ),
    returnDirect: "true"
  }
)

const vectorStore = new Chroma(embeddings, {
  url: "http://localhost:8000", 
  collectionName: "cours_wlan", 
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

const retrieverTool = tool(
  async ({ input }) => {
    const response = await ragChain.invoke(input, memory.chatHistory.messages);
    return response.result ;
  },
  {
    name: "cours wlan",
    description:
      "Search for information about Wireless Local Area Networks (WLANs) and WiFi technologies."+
      "This tool provides information about IEEE 802.11 standards, WLAN topologies, WiFi generations (WiFi 4-7) ," +
      "transmission techniques (OFDM/OFDMA), frequency bands (2.4/5/6 GHz), access methods (CSMA/CA, RTS/CTS), network components, and protocol architecture."+
      "Only use this tool for wireless networking related queries "
  }
);

const tools = [currentTimeTool , retrieverTool, send_email_tool , get_weather_tool];
const prompt = await pull("hwchase17/react-chat") // try hwchase17/react-chat ;  you need chat_history

const memory = new BufferMemory({
  memoryKey: "chat_history",
  returnMessages: true, // Return messages as BaseMessage objects
  inputKey: "input",
  outputKey: "output",
});

const agent = await createReactAgent({
    llm,
    tools,
    prompt,
  });

// we combine the agent (the brains) with the tools inside the AgentExecutor
// (which will repeatedly call the agent and execute tools)
const agentExecutor = AgentExecutor.fromAgentAndTools({
    agent,
    tools,
    memory,
    returnIntermediateSteps: true ,
    handleParsingErrors: true,
  });

  const response = await agentExecutor.invoke({ input });

  let outputValue;

  if (typeof response.output === 'string') {
    // Case 1: Direct response (no tool used)
    outputValue = response.output;
  } else if (typeof response.output === 'object') {
    // Case 2: Tool-assisted response
    outputValue = Object.values(response.output)[0];
  }

  return {
    agent_response : outputValue, 
    intermediateSteps : response?.intermediateSteps[0]
  }

}

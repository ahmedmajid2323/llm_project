import {createBrowserRouter} from "react-router-dom";
import Summarization from "./screens/summarization";
import Rag from "./screens/Rag";
import WebSraping from "./screens/WebSraping";
import OutputParser from "./screens/OutputParser";
import Agents from "./screens/Agents";

const router = createBrowserRouter([
    {
      path: "/",
      element: <Summarization/>,
    },
    {
      path: "/conversational_rag",
      element: <Rag/>,
    },
    {
      path: "/web_scraping",
      element: <WebSraping/>,
    },
    {
      path: "/agents",
      element: <Agents/>,
    },
    {
      path: "/parser",
      element: <OutputParser/>,
    },
  ]);
  export default router ;
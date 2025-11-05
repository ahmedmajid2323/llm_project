import { useState } from "react"
import TrueFocus from "../reactbits/focus"
import SideBar from "../SideBar"
import { motion, useAnimationControls } from "framer-motion"
import { ThreeCircles } from "react-loader-spinner"
import axios from 'axios';
import { IoSend } from "react-icons/io5"
import { SiLangchain } from "react-icons/si";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { FaEye } from "react-icons/fa";

function WebSraping() {

  const controls_crawl = useAnimationControls()
  const controls_scrap = useAnimationControls()

  const [Url, setUrl] = useState('')
  const [Url_crawl, setUrl_crawl] = useState('')
  const [Input, setInput] = useState('')
  const [Chat, setChat] = useState([])
  const [Loading_crawling, setLoading_crawling] = useState(false)
  const [Loading_scraping, setLoading_scraping] = useState(false)
  const [Scraping_input, setScraping_input] = useState(false)
  const [Crawling_input, setCrawling_input] = useState(false)
  const [Doc_loaded_scrape, setDoc_loaded_scrape] = useState(false)
  const [Doc_loaded_crawl, setDoc_loaded_crawl] = useState(false)
  const [Crawled_urls, setCrawled_urls] = useState([])

  const ScrapingTriggered = ()=>{
    controls_crawl.start('slide') 
    controls_scrap.start('adjust')
    setScraping_input(true)
  }

  const CrawlingTriggered = ()=>{
    controls_crawl.start('adjust')
    controls_scrap.start('slide')
    setCrawling_input(true)
  }

  const SubmitUrl_scraping = (e)=>{
    e.preventDefault(); 
    setLoading_scraping(true)

    axios.post('http://localhost:3000/load_html_page' , {url : Url})
    .then((response)=>{
      setDoc_loaded_scrape(true)
      console.log(response.data)
      setLoading_scraping(false)
    })
    .catch((err)=>{
      console.log(err)
    })
  }

  const SubmitUrl_crawling = (e)=>{
    e.preventDefault(); 
    setLoading_crawling(true)

    axios.post('http://localhost:8080/visited-urls' , {url : Url_crawl})
    .then((response)=>{
      setDoc_loaded_crawl(true)
      setCrawled_urls(Object.keys(response.data.urls))
      setLoading_crawling(false)
    })
    .catch((err)=>{
      console.log(err)
    })
  }

  const handleSubmit_crawl = (e) =>{
    e.preventDefault();
    setChat((prevChat) => [...prevChat, { role: 'user', content: Input }]);
    setInput('')

    axios.post('http://localhost:3000/conv_crawl', {Input , Chat}  ) // just sent the ipuut with the chat history so the model can keep up with your conversation
    .then((response)=>{
      setChat((prevChat) => [...prevChat, { role: 'assistant', content: response.data.llm_response }]);
    })
  }

  const handleSubmit_scrape = (e) =>{
    e.preventDefault();
    setChat((prevChat) => [...prevChat, { role: 'user', content: Input }]);
    setInput('')

    axios.post('http://localhost:3000/conv_web', {Input , Chat}  ) // just sent the ipuut with the chat history so the model can keep up with your conversation
    .then((response)=>{
      setChat((prevChat) => [...prevChat, { role: 'assistant', content: response.data.llm_response }]);
    })
  }

  return (
    <div className=" flex">

    <SideBar/>

    <div className=" w-full h-screen p-5 flex-row justify-center items-center">

      <div className=" p-3 w-full rounded-xl flex items-center justify-center gap-5 text-5xl ">
        <TrueFocus 
        sentence="Crawling Scraping"
        manualMode={false}
        blurAmount={5}
        borderColor="gray"
        animationDuration={1}
        pauseBetweenAnimations={3}
        />
      </div>

      { !(Doc_loaded_scrape || Doc_loaded_crawl) &&
        <div className="flex items-center gap-5 justify-center mt-10">
        <motion.div variants={{initial: { scale: 1 , x: 0 ,y:0 },adjust: { scale: 1.3 ,x:100 ,y:200 , transition: { duration: 0.5, ease:'linear' }} , slide: { opacity:0, transition: { duration: 0}} }} 
        animate={controls_scrap} initial = "initial">
          <div onClick={ScrapingTriggered} 
          className="cursor-pointer bg-gradient-to-b from-primary/90 to-primary hover:bg-slate-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-all duration-300 ease-in-out flex items-center gap-2">
            <span>Scraping a web page</span>
          </div>
          {Scraping_input &&
            <motion.form onSubmit={SubmitUrl_scraping}
            initial={{opacity:0}} whileInView={{opacity:1}} transition={{duration:1}}>
              <input onChange={(e)=>{setUrl(e.target.value)}} value={Url}
              type="text" className=" rounded-md border-2 mt-3 p-2" placeholder="Web page's url ..." />
            </motion.form>
          }
          {Loading_scraping &&
          <div className=" items-center flex justify-center mt-3">
            <ThreeCircles visible={true} height="30" width="30" color="gray" ariaLabel="three-circles-loading" wrapperStyle={{}} wrapperClass="" />
          </div>
          }
        </motion.div>

        <motion.div variants={{initial: { opacity:1 },slide: { opacity:0, transition: { duration: 0}}, adjust: { scale: 1.3 ,x:-100 ,y:200 , transition: { duration: 0.5, ease:'linear' }} }} animate={controls_crawl} initial = "initial" > 
          <div onClick={CrawlingTriggered}
          className="cursor-pointer bg-gradient-to-b from-primary/90 to-primary hover:bg-slate-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-all duration-300 ease-in-out flex items-center gap-2">
            <span>Crawling a website</span>
          </div>
          {Crawling_input &&
            <motion.form onSubmit={SubmitUrl_crawling}
            initial={{opacity:0}} whileInView={{opacity:1}} transition={{duration:1}}>
              <input onChange={(e)=>{setUrl_crawl(e.target.value)}} value={Url_crawl}
              type="text" className=" rounded-md border-2 mt-3 p-2" placeholder="Web page's url ..." />
            </motion.form>
          }
          {Loading_crawling &&
          <div className=" items-center flex justify-center mt-3">
            <ThreeCircles visible={true} height="30" width="30" color="gray" ariaLabel="three-circles-loading" wrapperStyle={{}} wrapperClass="" />
          </div>
          }
        </motion.div>

      </div>
      }

      {
        (Doc_loaded_scrape || Doc_loaded_crawl) &&
        <>
        <div className=" mt-8 p-4 rounded-xl border-2 mx-60 h-[75%] overflow-y-auto">
          {
            Chat.map((item , index)=>{
              if (item.role === 'user') {
                return(
                  <div key={index} className=" flex gap-3 justify-start">
                    <div className=" bg-slate-300 p-3 rounded-xl mb-3 ">
                      {item.content}
                    </div>
                  </div>
                )
              } else {
                return(
                  <div className="flex justify-end" key={index}>
                    <div className=" flex gap-2 items-start text-black p-3 rounded-xl mb-3">
                      <SiLangchain className="flex-shrink-0" size={30} />
                      {item.content}
                    </div> 
                  </div>
                )
              }
            })
          }
        </div>

        <div className="mx-72 mt-4 relative">
          <form onSubmit={Doc_loaded_crawl ? handleSubmit_crawl : handleSubmit_scrape} className="relative">
            <input /* disabled={File_name ? false : true} */
              value={Input}
              onChange={(e) => setInput(e.target.value)}
              className="bg-white shadow-slate-500 shadow-md w-full h-full rounded-full p-4 pr-12 text-black" // Added pr-12 for padding on the right
              type="text"
              placeholder="Write your message here..."
            />
            <div className="absolute right-6 top-1/2 transform -translate-y-1/2 flex items-center gap-5" >
            { Doc_loaded_crawl &&
              <Dialog>
              <DialogTrigger asChild>
                {/* Wrap the FaEye icon with DialogTrigger */}
                <FaEye
                  size={24}
                  className="text-gray-500 hover:text-gray-700 hover:cursor-pointer"
                />
              </DialogTrigger>

              {/* Dialog Content */}
              <DialogContent className="max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Crawled URLs</DialogTitle>
                  <DialogDescription>
                    Here are all the URLs crawled from {Url_crawl}.
                  </DialogDescription>
                </DialogHeader>

                {/* Add your custom content here */}
                <div className="mt-4">
                  <div className="max-h-[60vh] overflow-y-auto border-2 border-slate-500 p-3 rounded-xl">
                    {Crawled_urls.map((elt, index) => (
                      <p key={index} className="py-1">
                        {elt}
                      </p>
                    ))}
                  </div>
                </div>
              </DialogContent>
            </Dialog>}
              <button type="submit">
                <IoSend size={24} className="text-gray-500 hover:text-gray-700" />
              </button>
            </div>
          </form>
        </div>
        </>
      }

    </div>
      
    </div>
  )
}

export default WebSraping

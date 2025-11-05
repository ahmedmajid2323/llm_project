import { useState } from "react"
import SideBar from "../SideBar"
import { IoSend } from "react-icons/io5"
import { SiLangchain } from "react-icons/si";
import { FcDocument } from "react-icons/fc";
import axios from "axios";

function Agents() {

  const [Input , setInput] = useState('')
  const [Chat, setChat] = useState([])

  console.log(Chat)

  const handleSubmit = (e) =>{
    e.preventDefault();
    setChat((prevChat) => [...prevChat, { type: 'user', prompt: Input }]);
    setInput('')

    axios.post('http://localhost:3000/agent_chat', {Input}  ) // just sent the ipuut with the chat history so the model can keep up with your conversation
    .then((response)=>{
      setChat((prevChat) => [...prevChat, 
        { 
        role: 'assistant',
        content: response.data.llm_response.agent_response,
        steps: response.data.llm_response.intermediateSteps  
        }
      ]);
    })
  }

  return (
    <div className=" flex">

    <SideBar/>

    <div className=" w-full h-screen p-4 flex-row justify-center items-center">
      <div className=" w-full rounded-xl flex items-center justify-center gap-5">
        <h1 className="text-4xl p-3 font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-600 via-gray-900 to-black bg-size-200 bg-pos-0 animate-gradient hover:bg-gradient-to-r hover:from-gray-900 hover:via-black hover:to-gray-800 transition-all duration-500">
          Interactive Tool-Using Agent
        </h1>
      </div>

    <div className=" p-3 rounded-xl mx-48 h-[80%] overflow-y-auto mt-2 ">
        {
          Chat.map((item , index)=>{
            if (item.type === 'user') {
              return(
                <div key={index} className=" flex gap-3 justify-start">
                  <div className=" bg-gradient-to-b from-primary/90 to-primary text-white p-3 rounded-xl mb-3 ">
                    {item.prompt}
                  </div>
                </div>
              )
            } else {
              return(
                <div className="flex justify-end" key={index}>
                  <div className=" flex flex-col gap-1 items-start text-black p-3 rounded-xl mb-3">
                    <SiLangchain className="flex-shrink-0" size={40} />
                    { 
                      item.steps?.action?.tool === 'weather tool' ?
                        (<div className=" inline-flex bg-gradient-to-b from-primary/90 to-primary/60 p-2 items-center gap-6 rounded-xl">
                          <div className=" flex-col flex items-center">
                            <h1 className=" text-white">sunrise at :</h1>
                            <img src="../../public/sunrise.png" className=" w-16 h-16" />
                            <h1 className=" text-white">{item.steps.observation.weatherdata.sunrise}</h1>
                          </div>
                          <div className=" flex-col flex items-center">
                            <h1 className=" text-white">sunset at :</h1>
                            <img src="../../public/sunset.png" className=" w-16 h-16" />
                            <h1 className=" text-white">{item.steps.observation.weatherdata.sunset}</h1>
                          </div>
                          <div className=" flex-col flex items-center">
                            <h1 className=" text-white">Cloud % :</h1>
                            <img src="../../public/clouds.png" className=" w-16 h-16" />
                            <h1 className=" text-white">{item.steps.observation.weatherdata.clouds} %</h1>
                          </div>
                          <div className=" flex-col flex items-center">
                            <h1 className=" text-white">Temp °C :</h1>
                            <img src="../../public/temperature.png" className=" w-16 h-16" />
                            <h1 className=" text-white">{item.steps.observation.weatherdata.temp} °C</h1>
                          </div>
                        </div>) : item.steps?.action?.tool === 'current-time' ? (
                          <div className="inline-flex bg-gradient-to-b from-primary/90 to-primary/60 p-2 items-center gap-3 rounded-xl">
                            <img src="../../public/clock.png" className="w-16 h-16" />
                            <div className="text-white font-sans">
                              {item.steps?.action?.log?.split('\n').map((line, index) => (
                                  <span key={index}>
                                    {line}
                                    <br />
                                  </span>
                                ))}
                            </div>
                          </div>
                        ) : item.steps?.action?.tool === 'sending-email' ? (
                          <div className="inline-flex bg-gradient-to-b from-primary/90 to-primary/60 p-2 items-center gap-3 rounded-xl">
                            <img src="../../public/mail.png" className="w-16 h-16" />
                            <div className="text-white font-sans">
                              {item.steps?.action?.log?.split('\n').map((line, index) => (
                                <span key={index}>
                                  {line}
                                  <br />
                                </span>
                              ))}
                            </div>
                          </div>
                        ) : item.steps?.action?.tool === 'cours wlan' ? (
                          <div className=" inline-flex bg-gradient-to-b from-primary/90 to-primary/60 p-2 items-center gap-3 rounded-xl">
                            <FcDocument size={70} />
                            <div className=" text-white font-sans">
                              {item.steps?.action?.log?.split('\n').map((line, index) => (
                                  <span key={index}>
                                    {line}
                                    <br />
                                  </span>
                                ))} 
                            </div>
                          </div>
                        ) : null
                    }
                    <h1 className=" font-medium font-sans">{item.content}</h1>
                  </div> 
                </div>
              )
            }
          })
        }
        
      </div>

        <div className="mx-72 mt-2 relative">
          <form onSubmit={handleSubmit} className="relative">
            <input
              value={Input}
              onChange={(e) => setInput(e.target.value)}
              className="bg-white shadow-slate-500 shadow-md w-full h-full rounded-full p-4 pr-12 text-black" // Added pr-12 for padding on the right
              type="text"
              placeholder="Write your message here..."
            />
            <button type="submit" className="absolute right-6 top-1/2 transform -translate-y-1/2">
              <IoSend size={24} className="text-gray-500 hover:text-gray-700" />
            </button>
          </form>
        </div>
        

      </div>
      
    </div>
  )
}

export default Agents



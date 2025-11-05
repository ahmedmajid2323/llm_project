import { FaFileAlt } from "react-icons/fa"
import SideBar from "../SideBar"
import TrueFocus from "../reactbits/focus"
import { useState } from "react"
import { IoSend } from "react-icons/io5"
import { ThreeCircles } from "react-loader-spinner"
import axios from 'axios';
import { SiLangchain } from "react-icons/si";
import Threads from "@/reactbits/Threads"

function Rag() {

  const [File_name, setFile_name] = useState()
  const [Input, setInput] = useState()
  const [Loading, setLoading] = useState(false)
  const [Chat, setChat] = useState([])
  const [Res, setRes] = useState(false)

  const handleSubmit = (e) =>{
    e.preventDefault();
    setChat((prevChat) => [...prevChat, { role: 'user', content: Input }]);
    setInput('')

    axios.post('http://localhost:3000/conv_rag', {Input , Chat}  ) // just sent the ipuut with the chat history so the model can keep up with your conversation
    .then((response)=>{
      setChat((prevChat) => [...prevChat, { role: 'assistant', content: response.data.llm_response }]);
    })
  }

  const handle_file = ()=>{
    setLoading(true)
    const formData = new FormData();
    formData.append('pdf', File_name);

    axios.post('http://localhost:3000/conv_rag_store', formData ,{ headers: {'Content-Type': 'multipart/form-data'} })
    .then(()=>{
      setLoading(false)
      setRes(true)
    })
  }

  return (
    <div className=" flex">

    <SideBar/>

    <div
    className="z-0"
    style={{
      width: '84.4%',
      height: '600px',
      position: 'absolute',
      right: 0, // Position at the right
      zIndex: 0, // Ensure it's below other elements
    }}
    >
      <Threads amplitude={1} distance={0.3} />
    </div>

    <div
      className="w-full h-screen py-5 flex-row justify-center items-center"
      style={{ position: 'relative', zIndex: 10 }} // Ensure this is above the background
    >

      <div className=" p-3 w-full rounded-xl flex items-center justify-center gap-5 text-5xl ">
        <TrueFocus 
        sentence="Conversational RAG"
        manualMode={false}
        blurAmount={5}
        borderColor="gray"
        animationDuration={1}
        pauseBetweenAnimations={3}/>
      </div>

      <div className={ !Res ? 
      " mt-8 p-4 rounded-xl border-2 bg-white mx-60 h-[75%] overflow-y-auto flex flex-row items-center justify-center "
      : " mt-8 p-4 rounded-xl border-2 bg-white mx-60 h-[75%] overflow-y-auto  " }> 
        { !Res &&
          <div>
          <div className="mb-5">
            <label htmlFor="file-upload"
              className="cursor-pointer bg-gradient-to-b from-primary/90 to-primary text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-all duration-300 ease-in-out flex items-center gap-2">
              <FaFileAlt />
              <span>{File_name ? File_name.name : 'Choose a file' }</span>
            </label>
            <input type="file" className="hidden" id="file-upload"  accept="application/pdf"
            onChange={(e) => { setFile_name(e.target.files[0]) }}/>
          </div>
          {
            File_name &&
            <div onClick={handle_file}
            className="cursor-pointer bg-gradient-to-b from-primary/90 to-primary text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-all duration-300 ease-in-out flex items-center justify-center gap-2">
              <span className=" text-center flex items-center justify-center ">{Loading ?  <ThreeCircles visible={true} height="30" width="30" color="white" ariaLabel="three-circles-loading" wrapperStyle={{}} wrapperClass="" /> : 'Submit' }</span>
            </div>
          }
        </div>}
        
        {Res &&
          Chat.map((item , index)=>{
            if (item.role === 'user') {
              return(
                <div key={index} className=" flex gap-3 justify-start">
                  <div className=" bg-gradient-to-b from-primary/90 to-primary text-white p-3 rounded-xl mb-3 ">
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

      { Res &&
        <div className="mx-72 mt-4 relative">
          <form onSubmit={handleSubmit} className="relative">
            <input /* disabled={File_name ? false : true} */
              value={Input}
              onChange={(e) => setInput(e.target.value)}
              className="bg-white shadow-slate-500 shadow-md w-full h-full rounded-full p-4 pr-12 text-black" // Added pr-12 for padding on the right
              type="text"
              placeholder="Write your message here..."
            />
            {!Loading && 
            <button type="submit" className="absolute right-6 top-1/2 transform -translate-y-1/2">
              <IoSend size={24} className="text-gray-500 hover:text-gray-700" />
            </button>}
          </form>
        </div>
      }

    </div>
      
    </div>
  )
}

export default Rag

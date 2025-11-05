import { useState } from "react";
import SideBar from "../SideBar"
import BlurText from "../reactbits/blur"
import { FaFileAlt } from "react-icons/fa";
import { ThreeCircles } from 'react-loader-spinner'
import axios from 'axios';
import Threads from "@/reactbits/Threads";


function Summarization() {

  const [File_name, setFile_name] = useState()
  const [Loading, setLoading] = useState(false)
  const [Summary, setSummary] = useState('')

  const handle_file_name = (e)=>{
    setFile_name(e.target.files[0])
    setSummary('')
  }

  const handle_file = () =>{
    setLoading(true)

    const formData = new FormData();
    formData.append('pdf', File_name);

    axios.post('http://localhost:3000/summarization', formData ,{ headers: {'Content-Type': 'multipart/form-data'} })
    .then(function (response) {
      console.log(response.data.summary);
      setSummary(response.data.summary)
      setLoading(false)
    })
    .catch(function (error) {
      console.log(error);
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
        <BlurText
        text="Text Summarization"
        delay={150}
        animateBy="words"
        direction="top"
        className="text-5xl mb-8 font-serif font-medium" />
      </div>

      <div className="flex  items-center justify-center">
        <label htmlFor="file-upload"
          className="cursor-pointer bg-gradient-to-b from-primary/90 to-primary text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-all duration-300 ease-in-out flex items-center gap-2">
          <FaFileAlt />
          <span>{File_name ? File_name.name : 'Choose a file' }</span>
        </label>
        <input type="file" className="hidden" id="file-upload"  accept="application/pdf"
        onChange={handle_file_name}/>
      </div>

      <div  className={Summary 
      ? "mt-10 p-4 rounded-xl border-2 mx-60 h-[70%] overflow-y-auto z-10 bg-white " 
      : "mt-10 p-4 rounded-xl border-2 mx-60 h-[70%] overflow-y-auto flex justify-center items-center z-10 bg-white"}>

        { 
          (File_name && !Summary) && 
          <div onClick={handle_file}>
            <label className="cursor-pointer bg-gradient-to-b from-primary/90 to-primary text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-all duration-300 ease-in-out flex items-center gap-2">
              <span>{Loading ?  <ThreeCircles visible={true} height="30" width="30" color="white" ariaLabel="three-circles-loading" wrapperStyle={{}} wrapperClass="" /> : 'Summarize' }</span>
            </label>
          </div>
        }

      <div
        dangerouslySetInnerHTML={{ __html: Summary }}
        style={{ whiteSpace: 'pre-wrap' }} // Optional: Preserve formatting
      />

      </div>

    </div>
      
    </div>
  )
}

export default Summarization

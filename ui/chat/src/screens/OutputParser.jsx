import { useState } from "react"
import SideBar from "../SideBar"
import SplitText from "../reactbits/splittext"
import axios from "axios"
import { FaFileAlt } from "react-icons/fa"
import { ThreeCircles } from "react-loader-spinner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { User, Briefcase, Award, Code, Mail, Phone } from "lucide-react"
import Threads from "@/reactbits/Threads"

function OutputParser() {

  const [File_name, setFile_name] = useState()
  const [Loading, setLoading] = useState(false)
  const [llm_response, setllm_response] = useState('')

  const handle_file_name = (e)=>{
    setFile_name(e.target.files[0])
  }
    
  const handle_file = () =>{
    setLoading(true)

    const formData = new FormData();
    formData.append('pdf', File_name);

    axios.post('http://localhost:3000/upload_file_parser', formData ,{ headers: {'Content-Type': 'multipart/form-data'} })
    .then(function (response) {
      console.log(response.data.llm_response);
      setllm_response(response.data.llm_response)
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
          <SplitText
          text="OutputParser (resume)"
          className="text-5xl font-medium font-serif text-center"
          delay={50}
          animationFrom={{ opacity: 0, transform: 'translate3d(0,50px,0)' }}
          animationTo={{ opacity: 1, transform: 'translate3d(0,0,0)' }}
          easing="easeOutCubic"
          threshold={0.2}
          rootMargin="-50px"
          />
        </div>

        <div className="flex items-center justify-center mt-4">
          <label htmlFor="file-upload"
            className="cursor-pointer bg-gradient-to-b from-primary/90 to-primary text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-all duration-300 ease-in-out flex items-center gap-2">
            <FaFileAlt />
            <span>{File_name ? File_name.name : 'Choose a file' }</span>
          </label>
          <input type="file" className="hidden" id="file-upload"  accept="application/pdf"
          onChange={handle_file_name}/>
        </div>

        <div  className={llm_response 
        ? "mt-10 p-4 rounded-xl border-2 bg-white mx-auto h-[75%] overflow-y-auto max-w-4xl break-words" 
        : "mt-10 p-4 rounded-xl mx-60 h-[70%] overflow-y-auto flex justify-center items-center"}>

          { 
            (File_name && !llm_response) && 
            <div onClick={handle_file}>
              <label className="cursor-pointer bg-gradient-to-b from-primary/90 to-primary text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-all duration-300 ease-in-out flex items-center gap-2">
                <span>{Loading ?  <ThreeCircles visible={true} height="30" width="30" color="white" ariaLabel="three-circles-loading" wrapperStyle={{}} wrapperClass="" /> : 'Get structured output' }</span>
              </label>
            </div>
          }

          { llm_response &&
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Credentials Card */}
            <Card className="shadow-md hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center gap-2 pb-2">
                <User className="h-5 w-5 text-primary" />
                <CardTitle className="text-xl">Credentials</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 mb-4">
                  <Avatar className="h-16 w-16 border-2 border-primary">
                    <AvatarFallback className="bg-primary/10 text-primary text-lg">
                      {llm_response.credentials.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-lg font-semibold">{llm_response.credentials.name}</h3>
                    <div className="flex items-center gap-2 text-muted-foreground mt-1">
                      <Mail className="h-4 w-4" />
                      <span className="text-sm">{llm_response.credentials.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground mt-1">
                      <Phone className="h-4 w-4" />
                      <span className="text-sm">{llm_response.credentials.phone_number}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Skills Card */}
            <Card className="shadow-md hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center gap-2 pb-2">
                <Code className="h-5 w-5 text-primary" />
                <CardTitle className="text-xl">Skills</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="grid grid-cols-2 gap-4"> {/* Two columns with gap */}
                  {llm_response.skills.map((skill, index) => (
                    <li key={index} className="pb-2">
                      <div className="flex flex-col">
                        <Badge variant="outline" className="self-start mb-1 font-medium">
                          {skill.name}
                        </Badge>
                        <p className="text-sm text-muted-foreground">{skill.description}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Projects Card */}
            <Card className="shadow-md hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center gap-2 pb-2">
                <Briefcase className="h-5 w-5 text-primary" />
                <CardTitle className="text-xl">Projects</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {llm_response.projects.map((project, index) => (
                    <li key={index} className="pb-2 border-b last:border-0">
                      <h3 className="font-medium">{project.name}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{project.description}</p>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Certificates Card */}
            <Card className="shadow-md hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center gap-2 pb-2">
                <Award className="h-5 w-5 text-primary" />
                <CardTitle className="text-xl">Certificates</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {llm_response.certificates?.map((certificate, index) => (
                    <li key={index} className="pb-2 border-b last:border-0">
                      <h3 className="font-medium">{certificate.name}</h3>
                      {certificate.description && (
                        <p className="text-sm text-muted-foreground mt-1">{certificate.description}</p>
                      )}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>}

        </div>

      </div>
      
    </div>
  )
}

export default OutputParser

import { useNavigate, useLocation } from "react-router-dom"
import { IoDocumentsSharp } from "react-icons/io5"
import { SiWebauthn } from "react-icons/si"
import { GrDocumentPdf, GrConfigure } from "react-icons/gr"
import { PiTreeStructure } from "react-icons/pi"
import { cn } from "@/lib/utils"

export default function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()

  // Array of links for mapping through the sidebar items
  const sidebarLinks = [
    { path: "/", label: "Summarization", icon: <IoDocumentsSharp className="h-5 w-5" /> },
    { path: "/web_scraping", label: "Crawling/Scraping", icon: <SiWebauthn className="h-5 w-5" /> },
    { path: "/conversational_rag", label: "Conversational RAG", icon: <GrDocumentPdf className="h-5 w-5" /> },
    { path: "/parser", label: "Structured Parser", icon: <PiTreeStructure className="h-5 w-5" /> },
    { path: "/agents", label: "Agents", icon: <GrConfigure className="h-5 w-5" /> },
  ]

  return (
    <div className="w-[18%] h-screen rounded-r-2xl flex flex-col bg-gradient-to-b from-primary/90 to-primary p-5">
      <div className="flex items-center gap-2 px-2">
        <span className="text-xl">🦜️🔗</span>
        <h1 className="text-2xl font-bold text-primary-foreground">LangChain</h1>
      </div>

      <nav className="mt-10 flex flex-col gap-2">
        {sidebarLinks.map((link) => {
          const isActive = location.pathname === link.path

          return (
            <button
              key={link.path}
              onClick={() => navigate(link.path)}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 transition-all duration-200 text-left",
                isActive
                  ? "bg-secondary text-secondary-foreground shadow-sm"
                  : "text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-primary-foreground",
              )}
            >
              <span
                className={cn(
                  "flex items-center justify-center",
                  isActive ? "text-secondary-foreground" : "text-primary-foreground/70",
                )}
              >
                {link.icon}
              </span>
              <span className="font-medium">{link.label}</span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}


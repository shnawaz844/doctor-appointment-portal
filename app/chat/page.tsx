"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ChatInterface } from "@/components/chat/chat-interface"
import { ResponsePanel } from "@/components/chat/response-panel"
import { Button } from "@/components/ui/button"
import { ArrowLeft, PanelLeftClose, PanelLeftOpen } from "lucide-react"

export default function ChatPage() {
  const router = useRouter()
  const [taskResults, setTaskResults] = useState<any>(null)
  const [selectedPatients, setSelectedPatients] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showChatInput, setShowChatInput] = useState(true)

  const handleBackClick = () => {
    router.push("/")
  }

  const handleChatSubmit = async (message: string, files: File[]) => {
    setIsLoading(true)

    try {
      const formData = new FormData()
      formData.append("message", message)
      files.forEach((file, index) => {
        formData.append(`file_${index}`, file)
      })

      const response = await fetch("/api/chat/process", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()
      console.log(data)
      setTaskResults(data)
      setSelectedPatients(data.patients || [])
    } catch (error) {
      console.error("Error processing chat:", error)
      setTaskResults({ error: "Failed to process request" })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="flex flex-col md:flex-row h-[calc(100vh-64px)] md:h-[calc(100vh-0px)] bg-background overflow-hidden">
      {/* Left Side - Chat Interface */}
      {showChatInput && (
        <div className="flex-1 border-r border-border flex flex-col min-h-0">
          <div className="border-b border-border px-6 py-3 flex items-center justify-between flex-shrink-0 bg-background">
            <div>
              <h2 className="text-lg font-bold text-foreground">Medical AI Assistant</h2>
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <Button variant="ghost" size="sm" onClick={handleBackClick} className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowChatInput(false)}
                className="gap-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950"
              >
                <PanelLeftClose className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="flex-1 overflow-hidden">
            <ChatInterface onSubmit={handleChatSubmit} isLoading={isLoading} />
          </div>
        </div>
      )}

      {/* Right Side - Response Panel */}
      <div
        className={`${showChatInput ? "w-full md:w-1/2" : "flex-1"} border-l border-border bg-slate-50 dark:bg-slate-950 overflow-hidden flex flex-col relative min-h-0`}
      >
        {!showChatInput && (
          <div className="border-b border-border px-6 py-3 flex items-center justify-between flex-shrink-0 bg-background">
            <div>
              <h2 className="text-lg font-bold text-foreground">Medical AI Assistant</h2>
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <Button variant="ghost" size="sm" onClick={handleBackClick} className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowChatInput(true)}
                className="gap-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950"
                title="Expand Chat"
              >
                <PanelLeftOpen className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
        <ResponsePanel
          taskResults={taskResults}
          selectedPatients={selectedPatients}
          isLoading={isLoading}
          isMaximized={!showChatInput}
        />
      </div>
    </main>
  )
}

"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Send, Paperclip, X, Mic, MicOff } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"

interface Message {
  id: string
  content: string
  sender: "user" | "assistant"
  timestamp: Date
  files?: File[]
}

const QUICK_ACTIONS = [
  {
    id: "upload",
    icon: "📤",
    title: "Upload Reports",
    description: "Upload medical reports and documents",
  },
  {
    id: "find",
    icon: "🔍",
    title: "Find Patient",
    description: "Search and retrieve patient information",
  },
  {
    id: "insights",
    icon: "📊",
    title: "Get Insights",
    description: "Analyze patient data and trends",
  },
  {
    id: "assistance",
    icon: "🆘",
    title: "Need Assistance",
    description: "Get help with clinical decisions",
  },
]

export function ChatInterface({
  onSubmit,
  isLoading,
}: {
  onSubmit: (message: string, files: File[]) => void
  isLoading: boolean
}) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [files, setFiles] = useState<File[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [showQuickActions, setShowQuickActions] = useState(true)
  const [placeholderIndex, setPlaceholderIndex] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const placeholders = ["Ask about patients...", "Upload Reports...", "Get Insights...", "Ask me anything..."]

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % placeholders.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  // Add type definition for Web Speech API
  const [recognition, setRecognition] = useState<any>(null)

  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).webkitSpeechRecognition) {
      const recognitionInstance = new (window as any).webkitSpeechRecognition()
      recognitionInstance.continuous = true
      recognitionInstance.interimResults = true

      recognitionInstance.onresult = (event: any) => {
        let transcript = ""
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript
        }
        setInput(transcript)
      }

      recognitionInstance.onend = () => {
        setIsRecording(false)
      }

      setRecognition(recognitionInstance)
    }
  }, [])

  const handleStartRecording = () => {
    if (recognition) {
      recognition.start()
      setIsRecording(true)
      setInput("") // Clear previous input
    } else {
      console.error("Speech recognition not supported")
      alert("Speech recognition is not supported in this browser.")
    }
  }

  const handleStopRecording = () => {
    if (recognition) {
      recognition.stop()
      setIsRecording(false)
      // Small delay to ensure state is updated before sending
      setTimeout(() => {
        handleSendMessage()
      }, 500)
    }
  }

  const handleSendMessage = (overrideContent?: string) => {
    const contentToSend = overrideContent !== undefined ? overrideContent : input

    if (contentToSend.trim() || files.length > 0) {
      const userMessage: Message = {
        id: Date.now().toString(),
        content: contentToSend || "File uploaded",
        sender: "user",
        timestamp: new Date(),
        files: files.length > 0 ? [...files] : undefined,
      }

      setMessages((prev) => [...prev, userMessage])
      onSubmit(contentToSend, files)
      setInput("")
      setFiles([])
      setShowQuickActions(false)

      setTimeout(() => {
        const assistantMessage: Message = {
          id: Date.now().toString(),
          content: "Processing your request...",
          sender: "assistant",
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, assistantMessage])
      }, 500)
    }
  }

  const handleQuickAction = (action: (typeof QUICK_ACTIONS)[0]) => {
    const prompts: Record<string, string> = {
      upload: "I want to upload patient medical reports",
      find: "Help me find a patient record",
      insights: "Show me patient insights and analytics",
      assistance: "I need clinical decision support",
    }
    setInput(prompts[action.id])
  }

  const handleFileSelect = (selectedFiles: FileList) => {
    const newFiles = Array.from(selectedFiles)
    setFiles((prev) => [...prev, ...newFiles])
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files) {
      handleFileSelect(e.dataTransfer.files)
    }
  }

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900">
      {/* Messages Area */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${message.sender === "user"
                  ? "bg-primary text-primary-foreground rounded-br-none"
                  : "bg-muted text-muted-foreground rounded-bl-none"
                  }`}
              >
                <p className="text-sm">{message.content}</p>
                {message.files && message.files.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {message.files.map((file, idx) => (
                      <p key={idx} className="text-xs opacity-80">
                        📄 {file.name}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {showQuickActions && (
            <div className="py-2">
              <p className="text-sm font-semibold text-foreground mb-2">How can I help you today?</p>
              <div className="grid grid-cols-2 gap-2">
                {QUICK_ACTIONS.map((action) => (
                  <button
                    key={action.id}
                    onClick={() => handleQuickAction(action)}
                    className="p-2 rounded-lg border border-border hover:border-primary hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-left"
                  >
                    <div className="text-lg mb-0.5">{action.icon}</div>
                    <div className="text-xs font-medium text-foreground leading-tight">{action.title}</div>
                    <div className="text-xs text-muted-foreground leading-tight hidden sm:block">
                      {action.description}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="border-t border-border bg-white dark:bg-slate-900 p-3 flex-shrink-0">
        {/* Selected Files */}
        {files.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {files.map((file, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded-lg text-xs"
              >
                <span className="truncate">{file.name}</span>
                <button onClick={() => removeFile(idx)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Input Field */}
        <div
          className={`flex gap-2 items-end border border-border rounded-lg p-2 transition-colors ${isDragging ? "bg-slate-100 dark:bg-slate-800 border-primary" : ""
            }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
            className="hidden"
            multiple
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="text-muted-foreground hover:text-foreground p-1 transition-colors flex-shrink-0"
            title="Attach file"
          >
            <Paperclip className="h-4 w-4" />
          </button>

          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                handleSendMessage()
              }
            }}
            placeholder={placeholders[placeholderIndex]}
            className="flex-1 resize-none bg-transparent border-none outline-none text-foreground placeholder-muted-foreground max-h-24 text-sm"
            rows={1}
          />

          <button
            onClick={isRecording ? handleStopRecording : handleStartRecording}
            className={`p-1 transition-colors flex-shrink-0 relative ${isRecording ? "text-red-500" : "text-muted-foreground hover:text-foreground"
              }`}
            title={isRecording ? "Stop recording" : "Start recording"}
          >
            {isRecording && (
              <>
                <style>{`
                  @keyframes wave {
                    0% { transform: scale(1); opacity: 1; }
                    100% { transform: scale(1.5); opacity: 0; }
                  }
                  .wave-effect {
                    animation: wave 1.5s infinite;
                  }
                `}</style>
                <div className="absolute inset-0 rounded-full border-2 border-red-500 wave-effect" />
              </>
            )}
            {isRecording ? <Mic className="h-4 w-4 relative z-10" /> : <MicOff className="h-4 w-4" />}
          </button>

          <Button
            onClick={() => handleSendMessage()}
            disabled={isLoading || (!input.trim() && files.length === 0)}
            size="sm"
            className="flex-shrink-0 h-8"
          >
            <Send className="h-3 w-3" />
          </Button>
        </div>

        <p className="text-xs text-muted-foreground mt-1">
          Drag files or click paperclip. Supports PDF, images, and documents.
        </p>
      </div>
    </div>
  )
}

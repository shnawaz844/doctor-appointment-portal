"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MessageCircle, Send, Bot, User } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useRouter } from "next/navigation"

export function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hello Doctor! I'm your AI medical assistant. I can help you with patient information, reports, diagnosis insights, and medical recommendations. How can I assist you today?",
    },
  ])
  const [input, setInput] = useState("")
  const router = useRouter()

  const handleSend = () => {
    if (!input.trim()) return

    const newMessages = [
      ...messages,
      { role: "user", content: input },
      {
        role: "assistant",
        content:
          "I understand your query. In a production environment, this would connect to an AI model to provide detailed medical insights, patient data analysis, and clinical recommendations based on your healthcare database.",
      },
    ]

    setMessages(newMessages)
    setInput("")
  }

  const handleNavigateToChat = () => {
    router.push("/chat")
  }

  return (
    <>
      {/* Floating Chatbot Button */}
      <Button
        onClick={handleNavigateToChat}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-[9999] pointer-events-auto hover:scale-110 transition-transform"
        size="icon"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>

      {/* Chatbot Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl h-[85vh] flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center">
                  <Bot className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <DialogTitle>AI Medical Assistant</DialogTitle>
                  <p className="text-xs text-muted-foreground mt-1">Always here to help with patient care</p>
                </div>
              </div>
            </div>
          </DialogHeader>

          <ScrollArea className="flex-1 px-6 py-4">
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div key={index} className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                  {message.role === "assistant" && (
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Bot className="h-5 w-5 text-primary" />
                    </div>
                  )}
                  <div
                    className={`max-w-[70%] rounded-lg p-3 ${
                      message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                  </div>
                  {message.role === "user" && (
                    <div className="h-8 w-8 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                      <User className="h-5 w-5 text-accent-foreground" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>

          <div className="px-6 py-4 border-t border-border">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSend()}
                placeholder="Ask about patients, reports, or medical advice..."
              />
              <Button onClick={handleSend} size="icon">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

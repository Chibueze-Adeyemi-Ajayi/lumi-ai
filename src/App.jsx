'use client'

import * as React from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { ChevronDown, MessageSquare, PanelLeftClose, Share2, Paperclip, Globe, Settings, Plus, Send } from 'lucide-react'
import { previousTitles, todayTitles } from "./title"

export default function ChatInterface() {
  const [messages, setMessages] = React.useState([
    {
      role: "assistant",
      content: "Good evening oo! What's poppin', blud? How can I help you this fine evening? 😎",
    },
    {
      role: "user",
      content: "I dey oo you know say i new to this frontend development thing",
    },
    {
      role: "assistant",
      content: "Ah, I see! No wahala, blud. Welcome to the frontend gang! HTML, CSS, and JavaScript go be your besties for now. You get any specific thing wey dey confuse you, or you just wan gist about the whole frontend palava? 😊",
    },
  ])

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="w-80 border-r flex flex-col">
        <div className="p-4 border-b">
          <Button variant="outline" className="w-full justify-start gap-2">
            <Plus className="h-4 w-4" />
            New chat
          </Button>
        </div>
        
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            <div className="text-sm font-medium text-muted-foreground">Today</div>
            {todayTitles.map((chat) => (
              <Button
                key={chat}
                variant="ghost"
                className="w-full justify-start text-left font-normal"
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                {chat}
              </Button>
            ))}
            
            <div className="text-sm font-medium text-muted-foreground">My Files</div>
            {previousTitles.map((chat) => (
              <Button
                key={chat}
                variant="ghost"
                className="w-full justify-start text-left font-normal"
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                {chat}
              </Button>
            ))}
          </div>
        </ScrollArea>

        <div className="p-4 border-t">
          <Button variant="ghost" className="w-full justify-start gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <header className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2">
                  LumiAI
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem>Lumi-1.0</DropdownMenuItem>
                <DropdownMenuItem>Lumi-2.0</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon">
              <Share2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon">
              <PanelLeftClose className="h-4 w-4" />
            </Button>
          </div>
        </header>

        <ScrollArea className="flex-1 p-4">
          <div className="max-w-3xl mx-auto space-y-8">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex gap-4 ${
                  message.role === "assistant" ? "items-start" : "items-start justify-end"
                }`}
              >
                <div className={`flex flex-col gap-2 max-w-[80%] ${
                  message.role === "assistant" ? "order-2" : "order-1"
                }`}>
                  <div className="text-sm font-medium">
                    {message.role === "assistant" ? "LumiAI" : "You"}
                  </div>
                  <div className="rounded-lg bg-muted p-4">
                    {message.content}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="p-4 border-t">
          <div className="max-w-3xl mx-auto">
            <div className="relative">
              <Textarea
                placeholder="Message LumiAI..."
                className="pr-24 min-h-[100px] resize-none"
              />
              <div className="absolute right-3 bottom-3 flex gap-2">
                <Button size="icon" variant="ghost">
                  <Paperclip className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost">
                  <Globe className="h-4 w-4" />
                </Button>
                <Button size="icon">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="text-xs text-center mt-2 text-muted-foreground">
              LumiAI can make mistakes. Check important info.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


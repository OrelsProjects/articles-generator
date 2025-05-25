"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { MessageBubble } from "./message-bubble";
import { ChatInput } from "./chat-input";
import { LoadingBubble } from "./loading-bubble";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, MessageSquare } from "lucide-react";
import { AIChat, AIMessage } from "@/types/ai-chat";
import { cn } from "@/lib/utils";

interface ChatInterfaceProps {
  className?: string;
}

export function ChatInterface({ className }: ChatInterfaceProps) {
  const { data: session } = useSession();
  const [chats, setChats] = useState<AIChat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState("");
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Detect if user is manually scrolling
  const handleScroll = useCallback(() => {
    if (scrollAreaRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollAreaRef.current;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
      
      // Clear existing timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      
      // Set user scrolling state
      if (!isAtBottom) {
        setIsUserScrolling(true);
      } else {
        setIsUserScrolling(false);
      }
      
      // Reset user scrolling after 2 seconds of no scroll activity
      scrollTimeoutRef.current = setTimeout(() => {
        if (isAtBottom) {
          setIsUserScrolling(false);
        }
      }, 2000);
    }
  }, []);

  // Intelligent auto-scroll
  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    if (!isUserScrolling && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior, block: "end" });
    }
  }, [isUserScrolling]);

  // Fetch chat history on mount
  useEffect(() => {
    fetchChatHistory();
  }, []);

  // Auto-scroll when streaming or new messages (but respect user scrolling)
  useEffect(() => {
    if (isStreaming || messages.length > 0) {
      scrollToBottom();
    }
  }, [streamingMessage, isStreaming, scrollToBottom]);

  // Scroll to bottom when a new message is added (not during streaming)
  useEffect(() => {
    if (!isStreaming && messages.length > 0) {
      scrollToBottom("auto");
    }
  }, [messages.length, isStreaming, scrollToBottom]);

  const fetchChatHistory = async () => {
    try {
      const response = await fetch("/api/ai-chat/history");
      if (response.ok) {
        const chatHistory = await response.json();
        setChats(chatHistory);

        // Load the most recent chat if exists
        if (chatHistory.length > 0) {
          await loadChat(chatHistory[0].id);
        }
      }
    } catch (error) {
      console.error("Failed to fetch chat history:", error);
    }
  };

  const loadChat = async (chatId: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/ai-chat/history?chatId=${chatId}`);
      if (response.ok) {
        const chat = await response.json();
        setCurrentChatId(chat.id);
        setMessages(chat.messages || []);
      }
    } catch (error) {
      console.error("Failed to load chat:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const createNewChat = () => {
    setCurrentChatId(null);
    setMessages([]);
    setStreamingMessage("");
    setIsUserScrolling(false);
  };

  const sendMessage = async (message: string) => {
    try {
      setIsStreaming(true);
      setIsUserScrolling(false); // Reset user scrolling when sending new message

      // Add user message to UI immediately
      const tempUserMessage: AIMessage = {
        id: "temp-" + Date.now(),
        chatId: currentChatId || "",
        role: "user",
        content: message,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setMessages(prev => [...prev, tempUserMessage]);

      // Prepare request body
      const body = currentChatId
        ? { chatId: currentChatId, message }
        : { message };

      // Send message to API
      const response = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) throw new Error("Failed to send message");

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulatedMessage = "";
      let chatId = currentChatId;

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.chatId) {
                chatId = data.chatId;
                setCurrentChatId(data.chatId);

                // Update the temp user message with correct chatId
                setMessages(prev =>
                  prev.map(msg =>
                    msg.id === tempUserMessage.id
                      ? { ...msg, chatId: data.chatId }
                      : msg,
                  ),
                );
              }

              if (data.token) {
                accumulatedMessage += data.token;
                setStreamingMessage(accumulatedMessage);
              }

              if (data.done) {
                // Add the complete assistant message
                const assistantMessage: AIMessage = {
                  id: "assistant-" + Date.now(),
                  chatId: chatId!,
                  role: "assistant",
                  content: accumulatedMessage,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                };
                
                // Use functional update to avoid re-renders
                setMessages(prev => [...prev, assistantMessage]);
                setStreamingMessage("");

                // Refresh chat list without causing jumps
                requestAnimationFrame(() => {
                  fetchChatHistory();
                });
              }

              if (data.error) {
                console.error("Streaming error:", data.error);
                // Show error in chat
                const errorMessage: AIMessage = {
                  id: "error-" + Date.now(),
                  chatId: chatId || "",
                  role: "assistant",
                  content: `Error: ${data.error}`,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                };
                setMessages(prev => [...prev, errorMessage]);
                setStreamingMessage("");
              }
            } catch (e) {
              console.error("Failed to parse SSE data:", e);
            }
          }
        }
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      // Show error in chat
      const errorMessage: AIMessage = {
        id: "error-" + Date.now(),
        chatId: currentChatId || "",
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsStreaming(false);
      setStreamingMessage("");
    }
  };

  return (
    <div className={cn("flex h-full", className)}>
      {/* Chat History Sidebar */}
      <div className="w-64 border-r flex flex-col">
        <div className="p-4 border-b">
          <Button
            onClick={createNewChat}
            className="w-full gap-2"
            variant="outline"
          >
            <Plus className="h-4 w-4" />
            New Chat
          </Button>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {chats.map(chat => (
              <Button
                key={chat.id}
                onClick={() => loadChat(chat.id)}
                variant={currentChatId === chat.id ? "secondary" : "ghost"}
                className="w-full justify-start text-left truncate"
              >
                <MessageSquare className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="truncate">{chat.title}</span>
              </Button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            WriteStack AI Assistant
          </CardTitle>
        </CardHeader>

        <CardContent className="flex-1 p-0 flex flex-col">
          <ScrollArea 
            className="flex-1" 
            ref={scrollAreaRef}
            onScroll={handleScroll}
          >
            <div className="min-h-full flex flex-col justify-end">
              {isLoading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center text-muted-foreground p-8">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">
                    Start a conversation
                  </p>
                  <p className="text-sm">
                    Ask me anything about your writing, get ideas, or improve
                    your content.
                  </p>
                </div>
              ) : (
                <>
                  {messages.map(message => (
                    <MessageBubble
                      key={message.id}
                      role={message.role as "user" | "assistant"}
                      content={message.content}
                      timestamp={message.createdAt}
                      userImage={session?.user?.image}
                      userName={session?.user?.name}
                    />
                  ))}

                  {streamingMessage && (
                    <MessageBubble
                      role="assistant"
                      content={streamingMessage}
                      userImage={session?.user?.image}
                      userName={session?.user?.name}
                    />
                  )}

                  {isStreaming && !streamingMessage && <LoadingBubble />}
                </>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          <ChatInput onSendMessage={sendMessage} isLoading={isStreaming} />
        </CardContent>
      </div>
    </div>
  );
}

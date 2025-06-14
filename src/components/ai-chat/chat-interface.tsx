"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { MessageBubble } from "./message-bubble";
import { ChatInput } from "./chat-input";
import { LoadingBubble } from "./loading-bubble";
import { StreamingNote } from "./streaming-note";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, MessageSquare, ArrowDown, Menu } from "lucide-react";
import { AIChat, AIMessage } from "@/types/ai-chat";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent } from "@/components/ui/sheet";

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
  const [streamingNotes, setStreamingNotes] = useState<string[]>([]);
  const [isStreamingNote, setIsStreamingNote] = useState(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastMessageCountRef = useRef(0);

  // Check if user is at bottom of scroll
  const isAtBottom = useCallback(() => {
    if (!scrollAreaRef.current) return true;
    const { scrollTop, scrollHeight, clientHeight } = scrollAreaRef.current;
    return scrollHeight - scrollTop - clientHeight < 80;
  }, []);

  // Detect if user is manually scrolling
  const handleScroll = useCallback(() => {
    if (!scrollAreaRef.current) return;
    const atBottom = isAtBottom();

    // Clear existing timeout
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    // Update scroll states
    setIsUserScrolling(!atBottom);
    setShowScrollButton(!atBottom);

    // If user scrolled back to bottom, enable auto-scroll again
    if (atBottom) {
      setIsUserScrolling(false);
    }

    // Reset user scrolling after brief delay if at bottom
    if (atBottom) {
      scrollTimeoutRef.current = setTimeout(() => {
        setIsUserScrolling(false);
      }, 500);
    }
  }, [isAtBottom]);

  // Smooth scroll to bottom
  const scrollToBottom = useCallback(
    (force: boolean = false, behavior: ScrollBehavior = "smooth") => {
      if ((force || !isUserScrolling) && messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior, block: "end" });
        setShowScrollButton(false);
      }
    },
    [isUserScrolling],
  );

  // Manual scroll to bottom (for button click)
  const handleScrollToBottom = useCallback(() => {
    setIsUserScrolling(false);
    scrollToBottom(true, "smooth");
  }, [scrollToBottom]);

  // Fetch chat history on mount
  useEffect(() => {
    fetchChatHistory();
  }, []);

  // Auto-scroll during streaming (only if user hasn't scrolled away)
  useEffect(() => {
    if (isStreaming && streamingMessage && !isUserScrolling) {
      scrollToBottom(false, "auto");
    }
  }, [streamingMessage, isStreaming, isUserScrolling, scrollToBottom]);

  // Auto-scroll when new messages are added (but not during streaming)
  useEffect(() => {
    const currentMessageCount = messages.length;
    const hasNewMessages = currentMessageCount > lastMessageCountRef.current;

    if (hasNewMessages && !isStreaming && !isUserScrolling) {
      // Small delay to ensure DOM is updated
      setTimeout(() => {
        scrollToBottom(false, "smooth");
      }, 100);
    }

    lastMessageCountRef.current = currentMessageCount;
  }, [messages.length, isStreaming, isUserScrolling, scrollToBottom]);

  const fetchChatHistory = async () => {
    try {
      const response = await fetch("/api/ai-chat/history");
      if (response.ok) {
        const chatHistory = await response.json();
        setChats(chatHistory);

        // Load the most recent chat if exists and no current chat
        if (chatHistory.length > 0 && !currentChatId) {
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
        // Reset scroll states when loading new chat
        setIsUserScrolling(false);
        setShowScrollButton(false);
        // Close sidebar on mobile after selecting chat
        setIsSidebarOpen(false);
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
    setStreamingNotes([]);
    setIsStreamingNote(false);
    setIsUserScrolling(false);
    setShowScrollButton(false);
    // Close sidebar on mobile after creating new chat
    setIsSidebarOpen(false);
  };

  const cancelStream = () => {
    // Save any partial content before cancelling
    if (streamingMessage.trim()) {
      const partialMessage: AIMessage = {
        id: "partial-" + Date.now(),
        chatId: currentChatId || "",
        role: "assistant",
        content: streamingMessage,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setMessages(prev => [...prev, partialMessage]);
    }

    if (abortController) {
      abortController.abort();
      setAbortController(null);
    }
    setIsStreaming(false);
    setStreamingMessage("");
    setStreamingNotes([]);
    setIsStreamingNote(false);
  };

  const sendMessage = async (message: string) => {
    let accumulatedMessage = "";
    let chatId = currentChatId;
    let currentStreamingNotes: string[] = [];
    let isCurrentlyStreamingNote = false;

    try {
      setIsStreaming(true);
      setIsUserScrolling(false); // Reset user scrolling when sending new message
      setShowScrollButton(false);
      setTimeout(() => {
        scrollToBottom(true, "smooth");
      }, 100);

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

      // Create abort controller for cancellation
      const controller = new AbortController();
      setAbortController(controller);

      // Prepare request body
      const body = currentChatId
        ? { chatId: currentChatId, message }
        : { message };

      // Send message to API
      const response = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!response.ok) throw new Error("Failed to send message");

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.chatId && !chatId) {
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
                
                // Check if we're streaming a note
                const noteMatches = accumulatedMessage.match(/```note\n([\s\S]*?)(?:\n```|$)/g);
                if (noteMatches) {
                  const noteContents = noteMatches.map(match => {
                    const content = match.match(/```note\n([\s\S]*?)(?:\n```|$)/);
                    return content ? content[1] : '';
                  });
                  currentStreamingNotes = noteContents;
                  setStreamingNotes(currentStreamingNotes);
                  setIsStreamingNote(true);
                  isCurrentlyStreamingNote = true;
                } else if (isCurrentlyStreamingNote) {
                  // Continue updating streaming notes even without complete blocks
                  const partialNoteMatch = accumulatedMessage.match(/```note\n([\s\S]*)$/);
                  if (partialNoteMatch) {
                    const partialContent = partialNoteMatch[1];
                    const updatedNotes = [...currentStreamingNotes];
                    updatedNotes[updatedNotes.length - 1] = partialContent;
                    setStreamingNotes(updatedNotes);
                  }
                }
                
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

                setMessages(prev => [...prev, assistantMessage]);
                setStreamingMessage("");
                setStreamingNotes([]);
                setIsStreamingNote(false);

                // Only refresh chat list if this is a new chat, and do it without affecting scroll
                if (!currentChatId && chatId) {
                  // Delay the history fetch to avoid re-render during scroll
                  setTimeout(() => {
                    fetchChatHistory();
                  }, 1000);
                }
                return; // Exit successfully
              }

              if (data.error) {
                console.error("Streaming error:", data.error);
                // If we have partial content, save it before showing error
                if (accumulatedMessage.trim()) {
                  const partialMessage: AIMessage = {
                    id: "partial-" + Date.now(),
                    chatId: chatId || currentChatId || "",
                    role: "assistant",
                    content: accumulatedMessage,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                  };
                  setMessages(prev => [...prev, partialMessage]);
                }
                
                // Show error as separate message
                const errorMessage: AIMessage = {
                  id: "error-" + Date.now(),
                  chatId: chatId || currentChatId || "",
                  role: "assistant",
                  content: `Error: ${data.error}`,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                };
                setMessages(prev => [...prev, errorMessage]);
                return; // Exit after handling error
              }
            } catch (e) {
              console.error("Failed to parse SSE data:", e);
              // Continue processing other lines
            }
          }
        }
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      
      // Check if it's an abort error (user cancellation)
      if (error instanceof Error && error.name === 'AbortError') {
        console.log("Request was cancelled by user");
        // Don't show error message for user cancellation
      } else {
        // For other errors, save partial content if any, then show error
        if (accumulatedMessage.trim()) {
          const partialMessage: AIMessage = {
            id: "partial-" + Date.now(),
            chatId: chatId || currentChatId || "",
            role: "assistant",
            content: accumulatedMessage,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          setMessages(prev => [...prev, partialMessage]);
        }
        
        // Show error as separate message
        const errorMessage: AIMessage = {
          id: "error-" + Date.now(),
          chatId: chatId || currentChatId || "",
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } finally {
      // Clear streaming states
      setIsStreaming(false);
      setStreamingMessage("");
      setStreamingNotes([]);
      setIsStreamingNote(false);
      setAbortController(null);
    }
  };

  // Sidebar content component
  const SidebarContent = () => (
    <div className="w-full h-full flex flex-col">
      <div className="p-3 md:p-4 border-b">
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
  );

  return (
    <div className={cn("flex h-full", className)}>
      {/* Desktop Sidebar */}
      <div className="hidden md:flex w-64 border-r flex-col">
        <SidebarContent />
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <SidebarContent />
        </SheetContent>
      </Sheet>

      {/* Main Chat Area */}
      <div className="w-full h-full flex flex-col relative">
        {/* Header */}
        <div className="border-b p-3 md:p-4">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <MessageSquare className="h-5 w-5" />
              <span className="hidden sm:inline">WriteStack AI Assistant</span>
              <span className="sm:hidden">AI Assistant</span>
            </h2>
            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="h-full flex-1 flex flex-col">
          {/* Messages */}
          <div
            className="flex-shrink overflow-auto relative"
            ref={scrollAreaRef}
            onScroll={handleScroll}
          >
            <div className="h-full flex flex-col justify-start p-3 md:p-4">
              {isLoading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center text-muted-foreground p-6 md:p-8">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">
                    Start a conversation
                  </p>
                  <p className="text-sm">
                    Ask me anything about your writing, get ideas, improve your
                    content or generate notes based on your latest articles.
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

                  {/* Render streaming notes */}
                  {streamingNotes.map((noteContent, index) => (
                    <StreamingNote
                      key={`streaming-note-${index}`}
                      content={noteContent}
                    />
                  ))}

                  {/* Render regular streaming message if not a note */}
                  {streamingMessage && !isStreamingNote && (
                    <MessageBubble
                      role="assistant"
                      content={streamingMessage}
                      userImage={session?.user?.image}
                      userName={session?.user?.name}
                    />
                  )}

                  {isStreaming && !streamingMessage && !isStreamingNote && <LoadingBubble />}
                </>
              )}
              <div ref={messagesEndRef} />
            </div>
            {/* Scroll to Bottom Button */}
            {showScrollButton && (
              <Button
                onClick={handleScrollToBottom}
                size="sm"
                className="absolute bottom-2 right-4 md:right-6 rounded-full shadow-lg z-10"
                variant="secondary"
              >
                <ArrowDown className="h-4 w-4" />
              </Button>
            )}
          </div>

          <ChatInput
            className="mb-12"
            onSendMessage={sendMessage}
            onCancelStream={cancelStream}
            isLoading={false}
            isStreaming={isStreaming}
          />
        </div>
      </div>
    </div>
  );
}

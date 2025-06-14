import React, { useState, useRef, KeyboardEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  onCancelStream?: () => void;
  isLoading?: boolean;
  isStreaming?: boolean;
  placeholder?: string;
  className?: string;
}

export function ChatInput({ 
  onSendMessage, 
  onCancelStream,
  isLoading = false,
  isStreaming = false,
  placeholder = "Ask WriteStack anything...",
  className 
}: ChatInputProps) {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    if (message.trim() && !isLoading && !isStreaming) {
      onSendMessage(message.trim());
      setMessage('');
      
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleCancel = () => {
    if (onCancelStream && isStreaming) {
      onCancelStream();
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (isStreaming) {
        handleCancel();
      } else {
        handleSend();
      }
    }
  };

  // Auto-resize textarea with mobile/desktop limits
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    
    // Auto-resize with responsive max heights
    const textarea = e.target;
    textarea.style.height = 'auto';
    
    // Mobile: 96px max, Desktop: 232px max
    const isMobile = window.innerWidth < 768;
    const maxHeight = isMobile ? 96 : 232;
    
    const newHeight = Math.min(textarea.scrollHeight, maxHeight);
    textarea.style.height = `${newHeight}px`;
  };

  const buttonIcon = isStreaming ? (
    <X className="h-4 w-4" />
  ) : (
    <Send className="h-4 w-4" />
  );

  const buttonAction = isStreaming ? handleCancel : handleSend;
  const isButtonDisabled = (!message.trim() && !isStreaming) || isLoading;

  return (
    <form onSubmit={(e) => { e.preventDefault(); buttonAction(); }} className={cn("flex gap-2 p-4 border-t", className)}>
      <Textarea
        ref={textareaRef}
        value={message}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={cn(
          "min-h-11 max-h-24 md:max-h-58 resize-none transition-all duration-200",
          "focus:ring-2 focus:ring-primary/20"
        )}
        disabled={isLoading}
        rows={1}
        style={{
          scrollbarWidth: 'thin',
        }}
      />
      <Button
        type="submit"
        onClick={buttonAction}
        disabled={isButtonDisabled}
        size="icon"
        className={cn(
          "h-11 w-11 flex-shrink-0 transition-colors duration-200",
          isStreaming ? "bg-red-500 hover:bg-red-600" : ""
        )}
      >
        {buttonIcon}
      </Button>
    </form>
  );
} 
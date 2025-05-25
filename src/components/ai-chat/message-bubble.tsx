import React from 'react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Bot, User, FileText, Newspaper } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface MessageBubbleProps {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: Date;
  userImage?: string | null;
  userName?: string | null;
}

export function MessageBubble({ 
  role, 
  content, 
  timestamp,
  userImage,
  userName 
}: MessageBubbleProps) {
  const isUser = role === 'user';

  // Detect if content contains a note or article
  const detectContentType = (text: string): 'note' | 'article' | null => {
    const lowerContent = text.toLowerCase();
    if (lowerContent.includes('[generated note]') || lowerContent.includes('## note:')) {
      return 'note';
    }
    if (lowerContent.includes('[generated article]') || lowerContent.includes('## article:')) {
      return 'article';
    }
    return null;
  };

  const contentType = detectContentType(content);

  // Extract the actual content without markers
  const extractContent = (text: string): string => {
    return text
      .replace(/\[generated note\]/i, '')
      .replace(/\[generated article\]/i, '')
      .replace(/## note:/i, '')
      .replace(/## article:/i, '')
      .trim();
  };

  // Simple markdown-like formatting
  const formatContent = (text: string) => {
    return text
      .split('\n')
      .map((line, i) => {
        // Handle headers
        if (line.startsWith('### ')) {
          return <h3 key={i} className="font-bold text-sm mb-1">{line.slice(4)}</h3>;
        }
        if (line.startsWith('## ')) {
          return <h2 key={i} className="font-bold text-base mb-2">{line.slice(3)}</h2>;
        }
        if (line.startsWith('# ')) {
          return <h1 key={i} className="font-bold text-lg mb-2">{line.slice(2)}</h1>;
        }
        
        // Handle lists
        if (line.startsWith('- ')) {
          return <li key={i} className="ml-4 list-disc">{line.slice(2)}</li>;
        }
        if (/^\d+\. /.test(line)) {
          return <li key={i} className="ml-4 list-decimal">{line.replace(/^\d+\. /, '')}</li>;
        }
        
        // Handle code blocks (simple)
        if (line.startsWith('```')) {
          return null; // Skip code fence markers
        }
        
        // Regular paragraph
        return line ? <p key={i} className="mb-2 last:mb-0">{line}</p> : <br key={i} />;
      })
      .filter(Boolean);
  };

  // Render content with special card for notes/articles
  const renderContent = () => {
    if (!isUser && contentType) {
      const cleanContent = extractContent(content);
      const Icon = contentType === 'note' ? FileText : Newspaper;
      const label = contentType === 'note' ? 'Generated Note' : 'Generated Article';
      
      return (
        <Card className="shadow-sm border-muted/50 max-w-full">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Icon className="h-4 w-4" />
              {label}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-sm space-y-1">
              {formatContent(cleanContent)}
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className={cn(
        "rounded-2xl px-4 py-2",
        isUser 
          ? "bg-primary text-primary-foreground" 
          : "bg-muted"
      )}>
        <div className="text-sm">
          {isUser ? (
            <p className="whitespace-pre-wrap">{content}</p>
          ) : (
            <div className="space-y-1">
              {formatContent(content)}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={cn(
      "flex gap-3 p-4",
      isUser ? "flex-row-reverse" : "flex-row"
    )}>
      <Avatar className="h-8 w-8 flex-shrink-0">
        {isUser ? (
          <>
            <AvatarImage src={userImage || undefined} />
            <AvatarFallback>
              {userName ? userName.charAt(0).toUpperCase() : <User className="h-4 w-4" />}
            </AvatarFallback>
          </>
        ) : (
          <AvatarFallback className="bg-primary text-primary-foreground">
            <Bot className="h-4 w-4" />
          </AvatarFallback>
        )}
      </Avatar>
      
      <div className={cn(
        "flex flex-col gap-1 max-w-[70%]",
        isUser ? "items-end" : "items-start"
      )}>
        {renderContent()}
        
        {timestamp && (
          <span className="text-xs text-muted-foreground px-2">
            {new Date(timestamp).toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </span>
        )}
      </div>
    </div>
  );
} 
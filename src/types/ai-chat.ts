export interface AIMessage {
  id: string;
  chatId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  functionCalls?: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface AIChat {
  id: string;
  userId: string;
  title: string;
  lastMessageAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  messages?: AIMessage[];
}

export interface CreateChatRequest {
  message: string;
}

export interface SendMessageRequest {
  chatId: string;
  message: string;
}

export interface ChatResponse {
  chatId: string;
  messageId: string;
}

export interface StreamingChatResponse {
  token?: string;
  done?: boolean;
  error?: string;
} 
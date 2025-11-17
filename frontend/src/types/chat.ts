export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  isStreaming?: boolean;
  isTyping?: boolean;
  moderated?: boolean;
  thinking?: string;
  isThinking?: boolean;
  searching?: boolean;
  searchResults?: string;
}

export interface ChatThread {
  id: string;
  title: string;
  createdAt: string;
  updatedAt?: string;
}

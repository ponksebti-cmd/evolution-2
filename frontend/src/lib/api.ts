import { auth, getIdToken } from "./firebase";

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || "http://localhost:8000";

async function getToken(): Promise<string | null> {
  const user = auth.currentUser;
  if (!user) return null;
  try {
    return await getIdToken(user);
  } catch (e) {
    console.warn("Failed to get ID token:", e);
    return null;
  }
}

export async function apiFetch(path: string, opts: RequestInit = {}) {
  const token = await getToken();
  const headers = new Headers(opts.headers || {});
  headers.set("Content-Type", headers.get("Content-Type") || "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);
  headers.set("ngrok-skip-browser-warning", "true");

  const res = await fetch(API_BASE + path, { ...opts, headers });
  if (!res.ok) {
    const text = await res.text();
    let body = text;
    try { body = JSON.parse(text); } catch {}
    throw new Error(`API error ${res.status}: ${JSON.stringify(body)}`);
  }

  // No Content
  if (res.status === 204) return null;

  // Safely handle JSON or empty bodies
  const contentType = res.headers.get("content-type") || "";
  const text = await res.text();
  if (!text) return null;
  if (contentType.includes("application/json")) {
    try {
      return JSON.parse(text);
    } catch (e) {
      // Fallback: return raw text if JSON parsing fails
      return text;
    }
  }
  return text;
}

export async function backendMe() {
  return apiFetch("/auth/me");
}

export default { apiFetch, backendMe };

// Chat API helpers
export async function createChat(title = "New Chat") {
  const res: any = await apiFetch("/chats/new", {
    method: "POST",
    body: JSON.stringify({ title }),
  });
  // Map backend shape to frontend ChatThread shape
  return {
    id: res.chat_id,
    title: res.title,
    createdAt: res.created_at,
    updatedAt: res.updated_at,
  };
}

export async function getChats() {
  const res: any = await apiFetch("/chats");
  if (!Array.isArray(res)) return [];
  return res.map((c: any) => ({
    id: c.chat_id,
    title: c.title,
    createdAt: c.created_at,
    updatedAt: c.updated_at,
  }));
}

export async function getMessages(chatId: string, limit: number = 50, before?: string) {
  const params = new URLSearchParams();
  params.append('limit', limit.toString());
  if (before) {
    params.append('before', before);
  }
  
  const res: any = await apiFetch(`/chats/${chatId}/messages?${params.toString()}`);
  if (!Array.isArray(res)) return [];
  return res.map((m: any) => ({
    id: m.message_id,
    role: m.role,
    content: m.content,
    timestamp: m.timestamp,
    moderated: m.moderated || false,
  }));
}

export async function sendMessageStream(
  chatId: string, 
  content: string,
  onToken: (token: string, fullContent: string) => void,
  onStart: (messageId: string, userMessageId?: string, moderated?: boolean) => void,
  onDone: (messageId: string, content: string) => void,
  onError: (error: string) => void,
  thinkingMode: boolean = false,
  onThinking?: (thinkingContent: string) => void,
  onThinkingEnd?: () => void,
  searchMode: boolean = false
) {
  const token = await getToken();
  
  const response = await fetch(`${API_BASE}/chats/message/stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'ngrok-skip-browser-warning': 'true'
    },
    body: JSON.stringify({
      chat_id: chatId,
      content: content,
      role: 'user',
      thinking_mode: thinkingMode,
      search_mode: searchMode
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Stream request failed:', response.status, errorText);
    throw new Error(`Failed to send message: ${response.status}`);
  }

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let fullContent = '';
  let thinkingContent = '';

  if (reader) {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      
      // Keep the last incomplete line in the buffer
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            
            if (data.type === 'start') {
              onStart(data.message_id, data.user_message_id, data.moderated);
            } else if (data.type === 'token') {
              fullContent += data.content;
              onToken(data.content, fullContent);
            } else if (data.type === 'thinking_start') {
              thinkingContent = '';
            } else if (data.type === 'thinking') {
              // Thinking is now sent all at once (not streamed)
              thinkingContent = data.content;
              if (onThinking) onThinking(thinkingContent);
            } else if (data.type === 'thinking_end') {
              if (onThinkingEnd) onThinkingEnd();
            } else if (data.type === 'done') {
              onDone(data.message_id, data.content);
            } else if (data.type === 'error') {
              onError(data.content);
            }
          } catch (e) {
            console.error('Failed to parse SSE data:', e);
          }
        }
      }
    }
  }
}

export async function deleteChat(chatId: string) {
  // backend returns 204 No Content on success
  await apiFetch(`/chats/${chatId}`, { method: "DELETE" });
  return true;
}

export async function deleteMessagesAfter(chatId: string, messageId: string) {
  await apiFetch(`/chats/${chatId}/messages/after/${messageId}`, { method: "DELETE" });
  return true;
}

export async function generateChatTitle(chatId: string): Promise<string> {
  const res: any = await apiFetch(`/chats/${chatId}/generate-title`, { method: "POST" });
  return res.title || "New Chat";
}

export async function transcribeAudio(audioBlob: Blob): Promise<string> {
  const token = await getToken();
  
  const formData = new FormData();
  formData.append('audio', audioBlob, 'recording.webm');
  
  const response = await fetch(`${API_BASE}/audio/transcribe`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'ngrok-skip-browser-warning': 'true'
    },
    body: formData
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'فشل في تحويل الصوت إلى نص' }));
    throw new Error(error.detail || 'فشل في تحويل الصوت إلى نص');
  }

  const data = await response.json();
  return data.text;
}

export async function getMemoryStats() {
  // Placeholder for memory stats - can be implemented later
  return { totalMemories: 0, recentMemories: [] };
}

export async function listMemories() {
  // Placeholder for listing memories - can be implemented later
  return [];
}

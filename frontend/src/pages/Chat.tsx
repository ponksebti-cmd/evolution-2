import { useEffect, useState, useRef } from "react";
import ChatSidebar from "@/components/chat/ChatSidebar";
import ChatMessages from "@/components/chat/ChatMessages";
import ChatInput from "@/components/chat/ChatInput";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import ProfileMenu from "@/components/chat/ProfileMenu";
import { ArrowUp, Menu } from "lucide-react";
import { Message, ChatThread } from "@/types/chat";
import api, { createChat, getChats, getMessages, sendMessageStream, deleteChat, deleteMessagesAfter, generateChatTitle, getMemoryStats, listMemories } from "@/lib/api";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import Spinner from "@/components/ui/spinner";
import ErrorState, { ErrorType } from "@/components/ui/error-state";
import { useAuth } from "@/hooks/use-auth";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { useMemoryNotification } from "@/components/MemoryNotification";

const Chat = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [currentThreadId, setCurrentThreadId] = useState<string | null>(null);
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const { user, loading } = useAuth();
  const params = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deletingIds, setDeletingIds] = useState<string[]>([]);
  const backupThreadsRef = useRef<ChatThread[] | null>(null);
  const [isFetchingMessages, setIsFetchingMessages] = useState(false);
  const [isCreatingChat, setIsCreatingChat] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [oldestMessageTimestamp, setOldestMessageTimestamp] = useState<string | null>(null);
  const [error, setError] = useState<{ type: ErrorType; message?: string } | null>(null);
  // Streaming buffer refs to batch token updates and reduce re-renders
  const streamingBuffersRef = useRef<Map<string, string>>(new Map());
  const streamingFlushIntervalRef = useRef<number | null>(null);
  
  // Memory notification hook
  const { showMemorySaved, showMemoryDeleted, showMemoryForgotten, showMemoryIgnored } = useMemoryNotification();

  // Update document title based on current chat
  useEffect(() => {
    if (currentThreadId) {
      const currentThread = threads.find(t => t.id === currentThreadId);
      if (currentThread) {
        document.title = `Hadra - ${currentThread.title}`;
      } else {
        document.title = 'Hadra';
      }
    } else {
      document.title = 'Hadra';
    }
  }, [currentThreadId, threads]);

  // Load chats list for sidebar
  useEffect(() => {
    if (loading) return;
    (async () => {
      try {
        const list = await getChats();
        setThreads(list || []);
      } catch (e: any) {
        console.warn("Failed to load chats", e);
        // Determine error type
        if (e.message?.includes('401') || e.message?.includes('Unauthorized')) {
          toast.error("انتهت الجلسة، يرجى تسجيل الدخول مرة أخرى");
        } else if (e.message?.includes('Failed to fetch') || e.message?.includes('NetworkError')) {
          toast.error("تعذر الاتصال بالخادم، تحقق من اتصالك بالإنترنت");
        }
      }
    })();
  }, [loading]);

  // Sync current thread ID with URL params
  useEffect(() => {
    setCurrentThreadId(params.id || null);
  }, [params.id]);

  // Close mobile sidebar after navigation (so clicks navigate reliably first)
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.innerWidth < 768) {
        // close sidebar on small screens after route change
        setIsSidebarOpen(false);
      }
    } catch (e) {
      // ignore
    }
  }, [location.pathname]);

  // Load messages when thread ID changes
  useEffect(() => {
    if (!currentThreadId) {
      setMessages([]);
      setError(null);
      return;
    }
    
    (async () => {
      try {
        setIsFetchingMessages(true);
        setError(null);
        const msgs = await getMessages(currentThreadId, 50);
        setMessages(msgs || []);
        setHasMoreMessages(msgs && msgs.length === 50);
        setOldestMessageTimestamp(msgs && msgs.length > 0 ? msgs[0].timestamp : null);
      } catch (e: any) {
        console.warn("Failed to load messages", e);
        // Determine error type and show appropriate error
        if (e.message?.includes('404')) {
          setError({ type: "not-found" });
          toast.error("المحادثة غير موجودة");
        } else if (e.message?.includes('401') || e.message?.includes('Unauthorized')) {
          setError({ type: "auth" });
        } else if (e.message?.includes('Failed to fetch') || e.message?.includes('NetworkError')) {
          setError({ type: "network" });
        } else if (e.message?.includes('500') || e.message?.includes('502') || e.message?.includes('503')) {
          setError({ type: "server" });
        } else {
          setError({ type: "generic", message: "فشل تحميل الرسائل" });
        }
        setMessages([]);
        setHasMoreMessages(false);
      } finally {
        setIsFetchingMessages(false);
      }
    })();
  }, [currentThreadId]);

  const loadMoreMessages = async () => {
    if (!currentThreadId || !hasMoreMessages || isLoadingMore) return;
    
    setIsLoadingMore(true);
    try {
      const olderMessages = await getMessages(currentThreadId, 50, oldestMessageTimestamp || undefined);
      
      if (olderMessages && olderMessages.length > 0) {
        setMessages(prev => [...olderMessages, ...prev]);
        setHasMoreMessages(olderMessages.length === 50);
        setOldestMessageTimestamp(olderMessages[0].timestamp);
      } else {
        setHasMoreMessages(false);
      }
    } catch (e) {
      console.error("Failed to load more messages", e);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleSendMessage = async (content: string, thinkMode: boolean = false, searchMode: boolean = false) => {
    if (isSending) return;
    setIsSending(true);

    // If no current thread, create one first
    let chatId = currentThreadId;
    if (!chatId) {
      try {
        setIsCreatingChat(true);
        const created = await createChat("New Chat");
        // Append the created chat locally to avoid an extra full refetch.
        setThreads((prev) => [created, ...(prev || [])]);
        chatId = created.id;
        setCurrentThreadId(chatId);
        navigate(`/chat/${chatId}`, { replace: true });
      } catch (e: any) {
        console.error("Failed to create chat", e);
        if (e.message?.includes('401')) {
          toast.error("انتهت الجلسة، يرجى تسجيل الدخول مرة أخرى");
        } else if (e.message?.includes('Failed to fetch')) {
          toast.error("فشل الاتصال بالخادم");
        } else {
          toast.error("فشل إنشاء المحادثة");
        }
        setIsCreatingChat(false);
        setIsSending(false);
        return;
      } finally {
        setIsCreatingChat(false);
      }
    }

    // Optimistically append user's message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);

    // Create placeholder for assistant message
    const tempAssistantId = `temp-${Date.now()}`;
    const assistantPlaceholder: Message = {
      id: tempAssistantId,
      role: "assistant",
      content: "",
      timestamp: new Date().toISOString(),
      isStreaming: true,
      isThinking: thinkMode, // Show thinking indicator if thinking mode is enabled
      searching: searchMode // Show search indicator if search mode is enabled
    };
    setMessages((prev) => [...prev, assistantPlaceholder]);

    try {
      let actualMessageId = tempAssistantId;
      let hasReceivedFirstToken = false;
      
      // Setup streaming buffers and flush interval to reduce re-renders
      const streamingBuffers = streamingBuffersRef.current;
      const ensureFlush = () => {
        if (streamingFlushIntervalRef.current == null) {
          streamingFlushIntervalRef.current = window.setInterval(() => {
            const buf = streamingBuffers;
            if (!buf || buf.size === 0) return;

            setMessages((prev) => {
              // Only update messages that have buffered content
              let changed = false;
              const next = prev.map((m) => {
                const v = buf.get(m.id);
                if (v !== undefined && m.content !== v) {
                  changed = true;
                  return { ...m, content: v, searching: false }; // Turn off searching when content arrives
                }
                return m;
              });

              // clear buffers that were applied
              buf.forEach((_, k) => buf.delete(k));
              return changed ? next : prev;
            });
          }, 120);
        }
      };

      await sendMessageStream(
        chatId,
        content,
        (token, fullContent) => {
          // onToken
          // Buffer token content and flush on interval to avoid frequent re-renders
          const id = actualMessageId || tempAssistantId;
          streamingBuffers.set(id, fullContent);
          ensureFlush();
          
          // Turn off searching indicator on first token
          if (!hasReceivedFirstToken && fullContent.length > 0) {
            hasReceivedFirstToken = true;
            setMessages(prev => prev.map(msg => 
              msg.id === id ? { ...msg, searching: false } : msg
            ));
          }
        },
        (messageId, userMessageId, moderated) => {
          // onStart
          actualMessageId = messageId;
          setMessages((prev) => prev.map((msg) => {
            // Keep searching indicator, only update the ID
            if (msg.id === tempAssistantId) return { ...msg, id: messageId };
            if (msg.id === userMessage.id && userMessageId) return { ...msg, id: userMessageId, moderated };
            return msg;
          }));
          
          // If moderated, stop sending state immediately
          if (moderated) {
            setIsSending(false);
          }
        },
        async (messageId, finalContent) => {
          // onDone
          // Final flush for this message and mark as complete
          setMessages((prev) => prev.map((msg) => msg.id === messageId ? { ...msg, content: finalContent, isStreaming: false, isThinking: false } : msg));
          // ensure any buffered content for this message is cleared
          streamingBuffersRef.current.delete(messageId);
          // If no buffers remain, clear interval
          if (streamingBuffersRef.current.size === 0 && streamingFlushIntervalRef.current != null) {
            clearInterval(streamingFlushIntervalRef.current);
            streamingFlushIntervalRef.current = null;
          }
          setIsSending(false);
          
          // Check for memory updates after message completes
          // Give the backend a moment to process memory evaluation
          setTimeout(async () => {
            try {
              // Poll the memory stats to detect new memories
              const stats = await getMemoryStats();
              if (stats?.total_memories && stats.total_memories > 0) {
                // Get recent memories to show notification
                const memories = await listMemories('', 1);
                if (memories && memories.length > 0) {
                  const latestMemory = memories[0];
                  // Show notification if it was just created (within last 10 seconds)
                  const createdTime = new Date(latestMemory.created_at).getTime();
                  const now = Date.now();
                  if (now - createdTime < 10000) {
                    showMemorySaved(latestMemory.category, latestMemory.content);
                  }
                }
              }
            } catch (err) {
              // Silently fail - memory checking is optional
              console.debug("Failed to check memory updates:", err);
            }
          }, 500);
          
          // Generate title for the first message automatically
          // Use setTimeout to ensure state has settled
          setTimeout(async () => {
            setThreads(prevThreads => {
              const currentThread = prevThreads.find(t => t.id === chatId);
              
              if (currentThread && currentThread.title === "New Chat") {
                // Generate title in background
                (async () => {
                  // Set temporary "generating" title
                  setThreads(prev => prev.map(t => 
                    t.id === chatId ? { ...t, title: "جاري إنشاء العنوان..." } : t
                  ));
                  
                  try {
                    const newTitle = await generateChatTitle(chatId);
                    setThreads(prev => prev.map(t => 
                      t.id === chatId ? { ...t, title: newTitle } : t
                    ));
                  } catch (e) {
                    console.error("Failed to generate title", e);
                    // Revert to "New Chat" if generation fails
                    setThreads(prev => prev.map(t => 
                      t.id === chatId ? { ...t, title: "New Chat" } : t
                    ));
                  }
                })();
              }
              
              return prevThreads;
            });
          }, 100);
        },
        (error) => {
          // onError
          let errorMessage = "عذراً، حدث خطأ أثناء معالجة طلبك. يرجى المحاولة مرة أخرى.";
          
          if (error.includes('network') || error.includes('Failed to fetch')) {
            errorMessage = "❌ فشل الاتصال بالخادم. تحقق من اتصالك بالإنترنت.";
            toast.error("فشل الاتصال بالخادم");
          } else if (error.includes('401') || error.includes('Unauthorized')) {
            errorMessage = "❌ انتهت الجلسة. يرجى تسجيل الدخول مرة أخرى.";
            toast.error("انتهت الجلسة");
          } else if (error.includes('500') || error.includes('502') || error.includes('503')) {
            errorMessage = "❌ الخادم غير متاح حالياً. يرجى المحاولة بعد قليل.";
            toast.error("الخادم غير متاح");
          } else {
            toast.error("حدث خطأ أثناء إرسال الرسالة");
          }
          
          setMessages((prev) => prev.map((msg) => (msg.id === tempAssistantId || msg.id === actualMessageId) ? { ...msg, content: errorMessage, isStreaming: false } : msg));
          streamingBuffersRef.current.delete(actualMessageId);
          if (streamingFlushIntervalRef.current != null) {
            clearInterval(streamingFlushIntervalRef.current);
            streamingFlushIntervalRef.current = null;
          }
          setIsSending(false);
        },
        thinkMode,
        (thinkingContent) => {
          // onThinking
          setMessages(prev => prev.map(msg =>
            msg.id === tempAssistantId || msg.id === actualMessageId
              ? { ...msg, id: actualMessageId, thinking: thinkingContent, isThinking: true }
              : msg
          ));
        },
        () => {
          // onThinkingEnd
          setMessages(prev => prev.map(msg =>
            msg.id === tempAssistantId || msg.id === actualMessageId
              ? { ...msg, isThinking: false }
              : msg
          ));
        },
        searchMode
      );
    } catch (e) {
      console.error("Failed to send message", e);
      setMessages(prev => prev.filter(msg => msg.id !== tempAssistantId));
      setIsSending(false);
    }
  };

  const handleEditMessage = async (messageId: string, newContent: string) => {
    if (!currentThreadId || isSending) return;
    setIsSending(true);

    try {
      // Delete all messages after and including the edited message
      await deleteMessagesAfter(currentThreadId, messageId);

      // Find the index of the edited message
      const messageIndex = messages.findIndex(m => m.id === messageId);
      
      // Remove all messages from that point forward from local state
      setMessages((prev) => prev.slice(0, messageIndex));

      // Send the edited message as a new message
      const userMessage: Message = {
        id: Date.now().toString(),
        role: "user",
        content: newContent,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMessage]);

      // Create placeholder for streaming assistant message
      const tempAssistantId = `temp-${Date.now()}`;
      const assistantPlaceholder: Message = {
        id: tempAssistantId,
        role: "assistant",
        content: "",
        timestamp: new Date().toISOString(),
        isStreaming: true
      };
      setMessages((prev) => [...prev, assistantPlaceholder]);

      // Stream assistant response
      let actualMessageId = tempAssistantId;
      await sendMessageStream(
        currentThreadId,
        newContent,
        (token, fullContent) => {
          // onToken -> buffer updates to reduce re-renders
          const id = actualMessageId || tempAssistantId;
          streamingBuffersRef.current.set(id, fullContent);
          // start flush interval if needed
          if (streamingFlushIntervalRef.current == null) {
            streamingFlushIntervalRef.current = window.setInterval(() => {
              const buf = streamingBuffersRef.current;
              if (!buf || buf.size === 0) return;

              setMessages((prev) => {
                let changed = false;
                const next = prev.map((m) => {
                  const v = buf.get(m.id);
                  if (v !== undefined && m.content !== v) {
                    changed = true;
                    return { ...m, content: v };
                  }
                  return m;
                });
                buf.forEach((_, k) => buf.delete(k));
                return changed ? next : prev;
              });
            }, 120);
          }
        },
        (messageId, userMessageId, moderated) => {
          // onStart
          actualMessageId = messageId;
          setMessages(prev => {
            // If moderated, remove the assistant placeholder
            if (moderated) {
              return prev.filter(msg => msg.id !== tempAssistantId).map(msg => {
                if (msg.id === userMessage.id && userMessageId) {
                  return { ...msg, id: userMessageId, moderated };
                }
                return msg;
              });
            }
            // Normal flow - update message IDs
            return prev.map(msg => {
              if (msg.id === tempAssistantId) {
                return { ...msg, id: messageId };
              }
              if (msg.id === userMessage.id && userMessageId) {
                return { ...msg, id: userMessageId, moderated };
              }
              return msg;
            });
          });
          
          // If moderated, stop sending state immediately
          if (moderated) {
            setIsSending(false);
          }
        },
        (messageId, finalContent) => {
          // onDone
          setMessages(prev => prev.map(msg => msg.id === messageId ? { ...msg, content: finalContent, isStreaming: false, isThinking: false } : msg));
          streamingBuffersRef.current.delete(messageId);
          if (streamingBuffersRef.current.size === 0 && streamingFlushIntervalRef.current != null) {
            clearInterval(streamingFlushIntervalRef.current);
            streamingFlushIntervalRef.current = null;
          }
          setIsSending(false);
        },
        (error) => {
          // onError
          let errorMessage = "عذراً، حدث خطأ أثناء معالجة طلبك. يرجى المحاولة مرة أخرى.";
          
          if (error.includes('network') || error.includes('Failed to fetch')) {
            errorMessage = "❌ فشل الاتصال بالخادم. تحقق من اتصالك بالإنترنت.";
            toast.error("فشل الاتصال بالخادم");
          } else if (error.includes('401') || error.includes('Unauthorized')) {
            errorMessage = "❌ انتهت الجلسة. يرجى تسجيل الدخول مرة أخرى.";
            toast.error("انتهت الجلسة");
          } else {
            toast.error("حدث خطأ أثناء تحرير الرسالة");
          }
          
          setMessages(prev => prev.map(msg => (msg.id === tempAssistantId || msg.id === actualMessageId) ? { ...msg, content: errorMessage, isStreaming: false } : msg));
          streamingBuffersRef.current.delete(actualMessageId);
          if (streamingFlushIntervalRef.current != null) {
            clearInterval(streamingFlushIntervalRef.current);
            streamingFlushIntervalRef.current = null;
          }
          setIsSending(false);
        },
        false  // thinkMode is false for editing
      );
    } catch (e: any) {
      console.error("Failed to edit message", e);
      toast.error("فشل تحرير الرسالة");
      // Reload messages on error
      try {
        const msgs = await getMessages(currentThreadId);
        setMessages(msgs || []);
      } catch (reloadError) {
        console.error("Failed to reload messages", reloadError);
        toast.error("فشل تحميل الرسائل");
      }
      setIsSending(false);
    }
  };

  // Navigate to empty chat listing (keeps current selection cleared)
  const handleNewChat = () => {
    navigate('/chat', { replace: true });
  };

  // Create a new chat and open it immediately (for tapping the placeholder)
  const handleStartNewChat = async () => {
    if (isCreatingChat) return;
    try {
      setIsCreatingChat(true);
      const created = await createChat("New Chat");
      setThreads((prev) => [created, ...(prev || [])]);
      const chatId = created.id;
      setCurrentThreadId(chatId);
      navigate(`/chat/${chatId}`, { replace: true });
    } catch (e) {
      console.error('Failed to create chat', e);
    } finally {
      setIsCreatingChat(false);
    }
  };

  const handleSelectThread = (id: string) => {
    navigate(`/chat/${id}`);
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <ChatSidebar
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        threads={threads}
        deletingIds={deletingIds}
        currentThreadId={currentThreadId || ""}
        onSelectThread={handleSelectThread}
        onDeleteThread={(id: string) => {
          setDeleteTargetId(id);
          setDeleteDialogOpen(true);
        }}
        onNewChat={handleNewChat}
      />
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={(v) => setDeleteDialogOpen(v)}
        title="حذف المحادثة"
        description="هل أنت متأكد من حذف هذه المحادثة؟ لا يمكن التراجع عن هذا الإجراء."
        confirmLabel="حذف"
        cancelLabel="إلغاء"
        onConfirm={async () => {
          if (!deleteTargetId) return;
          const id = deleteTargetId;

          backupThreadsRef.current = threads;
          setDeletingIds((prev) => [...prev, id]);

          setTimeout(() => {
            setThreads((prev) => prev.filter((t) => t.id !== id));
            if (currentThreadId === id) {
              const remaining = (backupThreadsRef.current || []).filter((t) => t.id !== id);
              if (remaining && remaining.length > 0) {
                const next = remaining[0].id;
                navigate(`/chat/${next}`, { replace: true });
              } else {
                navigate('/chat', { replace: true });
              }
            }
          }, 220);

          setDeleteDialogOpen(false);

          try {
            await deleteChat(id);
            setDeletingIds((prev) => prev.filter((x) => x !== id));
          } catch (e) {
            console.error("Failed to delete chat", e);
            if (backupThreadsRef.current) setThreads(backupThreadsRef.current);
            setDeletingIds((prev) => prev.filter((x) => x !== id));
            window.alert("فشل حذف المحادثة. تم استعادة المحادثة.");
          }
        }}
      />
      
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Mobile menu button: open sidebar as overlay on small screens */}
        <div className="md:hidden absolute z-50" style={{ top: 'max(1rem, env(safe-area-inset-top))', right: 'max(1rem, env(safe-area-inset-right))' }}>
          <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(prev => !prev)} aria-label="فتح القائمة" className="h-11 w-11 touch-manipulation">
            <Menu className="h-5 w-5" />
          </Button>
        </div>
        {!currentThreadId && messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center px-4 pb-40 md:pb-32">
            <div className="w-full max-w-2xl mx-auto text-center">
              {/* Avatar */}
              <div className="mb-6" style={{ animation: 'scaleIn 0.5s ease-out' }}>
                <div 
                  className="w-16 h-16 mx-auto rounded-full bg-foreground text-background flex items-center justify-center cursor-pointer hover:scale-110 transition-transform duration-300"
                  style={{ animation: 'float 3s ease-in-out infinite' }}
                >
                  <span className="text-2xl font-bold">H</span>
                </div>
              </div>

              {/* Prompt */}
              <div className="mb-12" style={{ animation: 'fadeInUp 0.6s ease-out 0.1s both' }}>
                <h1 className="text-2xl font-normal text-muted-foreground mb-2" style={{ letterSpacing: 0, lineHeight: 1.4 }}>
                  اسأل أي شيء...
                </h1>
              </div>

              {/* Suggestion Cards */}
              <div className="grid grid-cols-2 gap-2 mb-8 max-w-xl mx-auto">
                <button 
                  className="p-4 text-center border border-border rounded-lg hover:bg-muted/30 hover:-translate-y-1 hover:shadow-md transition-all duration-300 min-h-[44px] touch-manipulation"
                  style={{ animation: 'fadeInUp 0.5s ease-out 0.2s both' }}
                >
                  <p className="text-sm" style={{ lineHeight: 1.5 }}>كاتب</p>
                </button>
                <button 
                  className="p-4 text-center border border-border rounded-lg hover:bg-muted/30 hover:-translate-y-1 hover:shadow-md transition-all duration-300 min-h-[44px] touch-manipulation"
                  style={{ animation: 'fadeInUp 0.5s ease-out 0.25s both' }}
                >
                  <p className="text-sm" style={{ lineHeight: 1.5 }}>باحث</p>
                </button>
                <button 
                  className="p-4 text-center border border-border rounded-lg hover:bg-muted/30 hover:-translate-y-1 hover:shadow-md transition-all duration-300 min-h-[44px] touch-manipulation"
                  style={{ animation: 'fadeInUp 0.5s ease-out 0.3s both' }}
                >
                  <p className="text-sm" style={{ lineHeight: 1.5 }}>مخطط</p>
                </button>
                <button 
                  className="p-4 text-center border border-border rounded-lg hover:bg-muted/30 hover:-translate-y-1 hover:shadow-md transition-all duration-300 min-h-[44px] touch-manipulation"
                  style={{ animation: 'fadeInUp 0.5s ease-out 0.35s both' }}
                >
                  <p className="text-sm" style={{ lineHeight: 1.5 }}>شارح</p>
                </button>
              </div>

              {/* Input */}
              <div
                className="relative max-w-2xl mx-auto cursor-text"
                style={{ animation: 'fadeInUp 0.6s ease-out 0.4s both' }}
                onClick={(e: any) => {
                  // Don't trigger when clicking action buttons inside the container
                  const el = e.target as HTMLElement;
                  if (el.closest && el.closest('button')) return;
                  handleStartNewChat();
                  const textarea = document.getElementById('new-chat-input') as HTMLTextAreaElement | null;
                  textarea?.focus();
                }}
              >
                <Textarea
                  placeholder="رسالة Hadra"
                  rows={1}
                  id="new-chat-input"
                  className="w-full pl-14 pr-4 py-3 min-h-[52px] max-h-[200px] resize-none rounded-full border border-border bg-background overflow-hidden text-base shadow-sm focus:shadow-lg focus:border-foreground/20 transition-all duration-300 touch-manipulation"
                  style={{ textAlign: 'right', lineHeight: 1.6 }}
                  onKeyDown={(e: any) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      if (isSending) return;
                      const val = (e.target as HTMLTextAreaElement).value.trim();
                      if (val) handleSendMessage(val);
                    }
                  }}
                  onInput={(e: any) => {
                    e.target.style.height = '52px';
                    e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px';
                  }}
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={isSending}
                  className="absolute left-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full disabled:opacity-30 hover:scale-110 active:scale-95 transition-transform duration-200 touch-manipulation"
                  onClick={() => {
                    if (isSending) return;
                    const el = document.getElementById('new-chat-input') as HTMLTextAreaElement | null;
                    const val = el?.value.trim();
                    if (val) {
                      handleSendMessage(val);
                      if (el) {
                        el.value = '';
                        el.style.height = '52px';
                      }
                    }
                  }}
                >
                  <ArrowUp className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ) : error ? (
          <div className="flex-1 flex items-center justify-center">
            <ErrorState 
              type={error.type}
              message={error.message}
              onRetry={() => {
                setError(null);
                window.location.reload();
              }}
              onGoHome={() => {
                setError(null);
                navigate('/chat', { replace: true });
              }}
            />
          </div>
        ) : (
          <>
            <div className="flex-1 min-h-0 relative">
              {isFetchingMessages && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10 transition-opacity">
                  <Spinner size={48} />
                </div>
              )}
              <ChatMessages 
              messages={messages} 
              onEditMessage={handleEditMessage}
              onLoadMore={loadMoreMessages}
              hasMoreMessages={hasMoreMessages}
              isLoadingMore={isLoadingMore}
            />
            </div>
            <div className="relative shrink-0">
              <ChatInput onSendMessage={handleSendMessage} disabled={isSending || isCreatingChat || isFetchingMessages} />
              {isCreatingChat && (
                <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20">
                  <Spinner size={28} />
                </div>
              )}
            </div>
          </>
        )}
      </div>
      <div className="flex gap-2 items-center">
        <ProfileMenu />
      </div>
    </div>
  );
};

export default Chat;

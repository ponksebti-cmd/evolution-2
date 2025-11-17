import { useEffect, useRef, useState } from "react";
import { Message } from "@/types/chat";
import { cn } from "@/lib/utils";
import { Copy, Check, Edit2, X, AlertTriangle } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import MarkdownRenderer from "./MarkdownRenderer";
import AnimatedMessage from "./AnimatedMessage";
import { toast } from "sonner";

interface ChatMessagesProps {
  messages: Message[];
  onEditMessage?: (messageId: string, newContent: string) => void;
  onLoadMore?: () => void;
  hasMoreMessages?: boolean;
  isLoadingMore?: boolean;
}

const ChatMessages = ({ 
  messages, 
  onEditMessage, 
  onLoadMore, 
  hasMoreMessages = false, 
  isLoadingMore = false 
}: ChatMessagesProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const loadMoreTriggerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState<string>("");
  const [showSuccess, setShowSuccess] = useState<string | null>(null);
  const prevMessageCountRef = useRef(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const currentMessageCount = messages.length;
    const isNewMessage = currentMessageCount > prevMessageCountRef.current;
    
    // Only auto-scroll if:
    // 1. A new message was added (not just content update during streaming)
    // 2. User is near the bottom of the scroll area
    if (isNewMessage) {
      const container = scrollContainerRef.current;
      const isNearBottom = container 
        ? (container.scrollHeight - container.scrollTop - container.clientHeight) < 200
        : true; // If we can't determine, scroll anyway
      
      if (isNearBottom) {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }
      
      prevMessageCountRef.current = currentMessageCount;
    } else {
      // For streaming updates (content changes), only scroll if already at bottom
      const container = scrollContainerRef.current;
      if (container) {
        const isAtBottom = (container.scrollHeight - container.scrollTop - container.clientHeight) < 50;
        if (isAtBottom) {
          messagesEndRef.current?.scrollIntoView({ behavior: 'auto', block: 'end' });
        }
      }
    }
  }, [messages]);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!onLoadMore || !hasMoreMessages) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMoreMessages && !isLoadingMore) {
          onLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreTriggerRef.current) {
      observer.observe(loadMoreTriggerRef.current);
    }

    return () => observer.disconnect();
  }, [onLoadMore, hasMoreMessages, isLoadingMore]);

  const handleCopy = async (text: string, id: string) => {
    try {
      // Convert markdown to plain text by removing common markdown syntax
      const plainText = text
        .replace(/```[\s\S]*?```/g, (match) => {
          // Extract code content without language tag
          return match.replace(/```\w*\n?/g, '').trim();
        })
        .replace(/`([^`]+)`/g, '$1') // Remove inline code backticks
        .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove bold
        .replace(/\*([^*]+)\*/g, '$1') // Remove italic
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links, keep text
        .replace(/^#{1,6}\s+/gm, '') // Remove headings
        .trim();
      
      await navigator.clipboard.writeText(plainText);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
      
      // Show success toast
      toast.success("تم نسخ النص بنجاح", {
        duration: 2000,
      });
    } catch (error) {
      console.error("Failed to copy:", error);
      toast.error("فشل نسخ النص");
    }
  };

  const handleEdit = (id: string, content: string) => {
    setEditingId(id);
    setEditContent(content);
  };
  
  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [editContent]);

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditContent("");
  };

  const handleSaveEdit = () => {
    if (editingId && editContent.trim() && onEditMessage) {
      const messageId = editingId;
      setShowSuccess(messageId);
      
      // Delay the actual edit to show success animation
      setTimeout(() => {
        onEditMessage(messageId, editContent.trim());
        setEditingId(null);
        setEditContent("");
        
        // Clear success state
        setTimeout(() => setShowSuccess(null), 1000);
      }, 400);
    }
  };

  return (
    <div ref={scrollContainerRef} className="h-full w-full overflow-y-auto overflow-x-hidden">
      <div className="w-full px-4 py-8" style={{ paddingBottom: 'calc(10rem + env(safe-area-inset-bottom))' }}>
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[60vh] space-y-10 px-4">
            <div className="space-y-3 text-center">
              <h2 className="text-5xl font-bold text-foreground" style={{ letterSpacing: 0, lineHeight: 1.4 }}>
                كيف يمكنني مساعدتك اليوم؟
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl w-full">
              <button className="text-right p-5 rounded-2xl border border-border hover:bg-muted/50 transition-colors group min-h-[72px] touch-manipulation">
                <div className="text-base font-semibold mb-1.5" style={{ lineHeight: 1.6 }}>إنشاء خطة</div>
                <div className="text-sm text-muted-foreground" style={{ lineHeight: 1.7 }}>لعطلة نهاية أسبوع مريحة</div>
              </button>
              <button className="text-right p-5 rounded-2xl border border-border hover:bg-muted/50 transition-colors group min-h-[72px] touch-manipulation">
                <div className="text-base font-semibold mb-1.5" style={{ lineHeight: 1.6 }}>ساعدني في كتابة</div>
                <div className="text-sm text-muted-foreground" style={{ lineHeight: 1.7 }}>بريد إلكتروني احترافي لمديري</div>
              </button>
              <button className="text-right p-5 rounded-2xl border border-border hover:bg-muted/50 transition-colors group min-h-[72px] touch-manipulation">
                <div className="text-base font-semibold mb-1.5" style={{ lineHeight: 1.6 }}>اشرح الحوسبة الكمومية</div>
                <div className="text-sm text-muted-foreground" style={{ lineHeight: 1.7 }}>بمصطلحات بسيطة</div>
              </button>
              <button className="text-right p-5 rounded-2xl border border-border hover:bg-muted/50 transition-colors group min-h-[72px] touch-manipulation">
                <div className="text-base font-semibold mb-1.5" style={{ lineHeight: 1.6 }}>أعطني أفكار</div>
                <div className="text-sm text-muted-foreground" style={{ lineHeight: 1.7 }}>لهدية عيد ميلاد مبدعة</div>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3 max-w-3xl mx-auto">
            {/* Load more trigger */}
            {hasMoreMessages && (
              <div ref={loadMoreTriggerRef} className="flex justify-center py-4">
                {isLoadingMore ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-6 h-6 border-2 border-neutral-400 border-t-transparent rounded-full"
                  />
                ) : (
                  <div className="text-sm text-neutral-500">قم بالتمرير لأعلى لتحميل المزيد...</div>
                )}
              </div>
            )}
            
            {messages.map((message, index) => {
              const isUser = message.role === "user";
              const isFirstInGroup = index === 0 || messages[index - 1]?.role !== message.role;
              const isLastInGroup = index === messages.length - 1 || messages[index + 1]?.role !== message.role;
              
              const isEditing = editingId === message.id;
              const isSaving = showSuccess === message.id;
              const charCount = editContent.length;
              const maxChars = 2000;

              return (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20, scale: 0.92, filter: "blur(8px)" }}
                  animate={{ 
                    opacity: 1, 
                    y: 0, 
                    scale: 1,
                    filter: "blur(0px)",
                    transition: {
                      type: "spring",
                      stiffness: 400,
                      damping: 28,
                      mass: 0.6,
                      opacity: { duration: 0.3 },
                      filter: { duration: 0.4, ease: [0.16, 1, 0.3, 1] }
                    }
                  }}
                  transition={{
                    layout: {
                      type: "spring",
                      stiffness: 350,
                      damping: 28,
                      mass: 0.7
                    }
                  }}
                  style={{ willChange: "transform, opacity, filter" }}
                  className={cn(
                    "flex flex-col w-full gap-1 relative",
                    isUser ? "items-end" : "items-start"
                  )}
                >
                  <AnimatePresence mode="wait">
                    {isEditing ? (
                      <motion.div 
                        key="edit-mode"
                        initial={{ opacity: 0, scale: 0.88, filter: "blur(10px)" }}
                        animate={{ 
                          opacity: 1, 
                          scale: isSaving ? [1, 0.95, 1.05, 1] : 1,
                          rotate: isSaving ? [0, -2, 2, 0] : 0,
                          filter: isSaving ? "blur(0px)" : "blur(0px)",
                          transition: {
                            opacity: { duration: 0.25, ease: [0.16, 1, 0.3, 1] },
                            filter: { duration: 0.35, ease: [0.16, 1, 0.3, 1] },
                            scale: { 
                              duration: isSaving ? 0.6 : 0.35,
                              ease: [0.34, 1.56, 0.64, 1],
                              times: isSaving ? [0, 0.3, 0.6, 1] : undefined
                            },
                            rotate: { 
                              duration: 0.6,
                              ease: [0.34, 1.56, 0.64, 1]
                            }
                          }
                        }}
                        exit={{ 
                          opacity: 0, 
                          scale: 0.93,
                          filter: "blur(6px)",
                          transition: {
                            duration: 0.2,
                            ease: [0.42, 0, 1, 1]
                          }
                        }}
                        transition={{ type: "spring", stiffness: 350, damping: 28, mass: 0.7 }}
                        style={{
                          willChange: "transform, opacity, filter"
                        }}
                        className="min-w-[280px] w-full space-y-2 relative z-10"
                        style={{ maxWidth: 'min(600px, 85vw)' }}
                      >
                        <motion.div className="relative">
                          <Textarea
                            ref={textareaRef}
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="min-h-[100px] resize-none text-base overflow-hidden transition-all duration-200"
                            style={{ height: 'auto', lineHeight: 1.7, textAlign: 'right' }}
                            dir="auto"
                            autoFocus
                            maxLength={maxChars}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleSaveEdit();
                              }
                              if (e.key === "Escape") {
                                handleCancelEdit();
                              }
                            }}
                          />
                          {/* Character counter */}
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ 
                              opacity: charCount > maxChars * 0.8 ? 1 : 0.5, 
                              y: 0,
                              scale: charCount > maxChars * 0.9 ? [1, 1.1, 1] : 1
                            }}
                            transition={{
                              type: "spring",
                              stiffness: 400,
                              damping: 20
                            }}
                            className={cn(
                              "absolute bottom-2 right-2 text-xs px-2 py-1 rounded-full backdrop-blur-sm",
                              charCount > maxChars * 0.9 
                                ? "bg-red-500/20 text-red-600 dark:text-red-400" 
                                : "bg-neutral-200/50 dark:bg-neutral-700/50 text-neutral-500"
                            )}
                          >
                            {charCount}/{maxChars}
                          </motion.div>
                        </motion.div>
                        <div className="flex gap-2 justify-end">
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ 
                              opacity: 1, 
                              y: 0,
                              transition: {
                                delay: 0.1,
                                type: "spring",
                                stiffness: 400,
                                damping: 25
                              }
                            }}
                          >
                            <motion.div
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                            <Button
                            size="sm"
                            variant="outline"
                            onClick={handleCancelEdit}
                            disabled={isSaving}
                            >
                            <X size={14} className="ml-1" />
                            إلغاء
                            </Button>
                            </motion.div>
                            </motion.div>
                            <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ 
                            opacity: 1, 
                            y: 0,
                            transition: {
                            delay: 0.15,
                            type: "spring",
                            stiffness: 400,
                            damping: 25
                            }
                            }}
                            >
                            <motion.div
                            whileHover={{ 
                            scale: editContent.trim() ? 1.05 : 1,
                            transition: { type: "spring", stiffness: 400, damping: 15 }
                            }}
                            whileTap={{ scale: 0.95 }}
                            animate={{
                            scale: editContent.trim() && !isSaving ? [1, 1.02, 1] : 1,
                            }}
                            transition={{
                            scale: { duration: 0.3, repeat: editContent.trim() && !isSaving ? Infinity : 0, repeatDelay: 2 }
                            }}
                            >
                            <Button
                            size="sm"
                            onClick={handleSaveEdit}
                            disabled={!editContent.trim() || isSaving}
                            className="relative"
                            >
                            {isSaving ? (
                            <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="ml-1"
                            >
                            <Check size={14} />
                            </motion.div>
                            ) : null}
                            {isSaving ? "تم الحفظ!" : "حفظ وإرسال"}
                            </Button>
                            </motion.div>
                          </motion.div>
                        </div>
                      </motion.div>
                    ) : (
                        <motion.div key="view-mode"
                        exit={{ 
                          opacity: 0, 
                          scale: 0.93,
                          filter: "blur(6px)",
                          transition: {
                            duration: 0.2,
                            ease: [0.42, 0, 1, 1]
                          }
                        }}
                        transition={{ type: "spring", stiffness: 350, damping: 28, mass: 0.7 }}
                        style={{
                          willChange: "transform, opacity, filter"
                        }}
                        className="flex flex-col gap-1 items-inherit relative z-10"
                      >

                        <motion.div
                          
                          initial={{
                            filter: "brightness(1)",
                            rotateX: 0,
                            rotateY: 0,
                          }}
                          whileHover={isUser ? { 
                            y: -3, 
                            scale: 1.01,
                            rotateX: 1,
                            rotateY: -1,
                            filter: "brightness(1.05)",
                            transition: { 
                              type: "spring",
                              stiffness: 380,
                              damping: 26,
                              mass: 0.5
                            } 
                          } : undefined}
                          whileTap={isUser ? {
                            scale: 0.985,
                            transition: { duration: 0.1 }
                          } : undefined}
                          animate={{
                            filter: showSuccess === message.id ? ["brightness(1)", "brightness(1.3)", "brightness(1)"] : "brightness(1)",
                            rotateX: 0,
                            rotateY: 0,
                          }}
                          transition={{ filter: { duration: 0.6, times: [0, 0.5, 1] }, type: "spring", stiffness: 500, damping: 30, mass: 0.8 }}
                          style={{
                            transformPerspective: 1000,
                            willChange: "transform, filter",
                            maxWidth: 'min(600px, 85vw)',
                            minWidth: '60px',
                            overflow: 'hidden'
                          }}
                          className={cn(
                            "relative inline-block px-5 py-3 break-words",
                            isUser ? [
                              "bg-gradient-to-br from-neutral-800 to-neutral-900",
                              "text-white",
                              "rounded-[24px]",
                              isFirstInGroup && "rounded-tr-[8px]",
                              isLastInGroup && "rounded-br-[8px]",
                            ] : [
                              "bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-800 dark:to-neutral-900",
                              "text-neutral-900 dark:text-neutral-100",
                              "border border-neutral-200 dark:border-neutral-700",
                              "rounded-[24px]",
                              isFirstInGroup && "rounded-tl-[8px]",
                              isLastInGroup && "rounded-bl-[8px]",
                            ]
                          )}
                        >
                          <motion.div className="text-base" style={{ lineHeight: 1.7 }}
                            dir="auto"
                            transition={{
                              duration: 0.15,
                              ease: "easeOut"
                            }}
                          >
                            {message.isTyping ? (
                              <div className="flex gap-1 py-2">
                                <motion.span
                                  animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
                                  transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                                  className="w-2 h-2 rounded-full bg-current"
                                />
                                <motion.span
                                  animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
                                  transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                                  className="w-2 h-2 rounded-full bg-current"
                                />
                                <motion.span
                                  animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
                                  transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                                  className="w-2 h-2 rounded-full bg-current"
                                />
                              </div>
                            ) : (
                              <AnimatedMessage 
                                content={message.content}
                                isStreaming={message.isStreaming}
                                isComplete={!message.isStreaming}
                                thinking={message.thinking}
                                isThinking={message.isThinking}
                                searching={message.searching}
                              />
                            )}
                          </motion.div>
                        </motion.div>
                        
                        {/* Moderation Warning */}
                        {message.moderated && (
                          <motion.div
                            initial={{ opacity: 0, y: -10, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{
                              type: "spring",
                              stiffness: 400,
                              damping: 25
                            }}
                            className="flex items-start gap-2 px-4 py-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200"
                            style={{ maxWidth: 'min(600px, 85vw)' }}
                          >
                            <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                            <p className="text-sm" style={{ lineHeight: 1.6 }}>
                              تم حظر هذه الرسالة بواسطة نظام المراقبة. لا يمكن الرد على هذه الرسالة.
                            </p>
                          </motion.div>
                        )}
                        
                        <motion.div 
                          className="flex gap-1"
                          initial={{ opacity: 0, y: -4, filter: "blur(4px)" }}
                          animate={{ 
                            opacity: 1, 
                            y: 0,
                            filter: "blur(0px)",
                            transition: {
                              delay: 0.1,
                              type: "spring",
                              stiffness: 350,
                              damping: 22,
                              filter: { duration: 0.3 }
                            }
                          }}
                        >
                          {!isUser && (
                            <motion.button
                              whileHover={{ 
                                scale: 1.2, 
                                y: -3,
                                rotate: -5,
                                transition: { 
                                  type: "spring",
                                  stiffness: 400,
                                  damping: 20
                                }
                              }}
                              whileTap={{ 
                                scale: 0.85,
                                rotate: 0,
                                transition: { 
                                  type: "spring",
                                  stiffness: 600,
                                  damping: 25
                                }
                              }}
                              onClick={() => handleCopy(message.content, message.id)}
                              className={cn(
                                "p-1.5 rounded-lg",
                                "hover:bg-neutral-200 dark:hover:bg-neutral-700",
                                "text-neutral-400 hover:text-neutral-900 dark:text-neutral-500 dark:hover:text-neutral-100"
                              )}
                              aria-label="Copy message"
                            >
                              <motion.div
                                animate={copiedId === message.id ? { 
                                  scale: [1, 1.3, 1],
                                  rotate: [0, 360],
                                  transition: { duration: 0.5 }
                                } : {}}
                              >
                                {copiedId === message.id ? (
                                  <Check size={14} />
                                ) : (
                                  <Copy size={14} />
                                )}
                              </motion.div>
                            </motion.button>
                          )}
                          {isUser && (
                            <motion.button
                              whileHover={{ 
                                scale: 1.2, 
                                y: -3,
                                rotate: -5,
                                transition: { 
                                  type: "spring",
                                  stiffness: 400,
                                  damping: 20
                                }
                              }}
                              whileTap={{ 
                                scale: 0.85,
                                rotate: -8,
                                transition: { 
                                  type: "spring",
                                  stiffness: 600,
                                  damping: 25
                                }
                              }}
                              onClick={() => handleEdit(message.id, message.content)}
                              className={cn(
                                "p-1.5 rounded-lg",
                                "hover:bg-neutral-200 dark:hover:bg-neutral-700",
                                "text-neutral-400 hover:text-neutral-900 dark:text-neutral-500 dark:hover:text-neutral-100"
                              )}
                              aria-label="Edit message"
                            >
                              <Edit2 size={14} />
                            </motion.button>
                          )}
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessages;

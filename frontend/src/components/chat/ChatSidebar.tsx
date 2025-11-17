import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, PanelLeftClose, PanelLeft, Trash2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatThread } from "@/types/chat";
import { cn } from "@/lib/utils";
import ProfileMenu from "./ProfileMenu";

interface ChatSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  threads: ChatThread[];
  currentThreadId: string;
  onSelectThread: (id: string) => void;
  onDeleteThread?: (id: string) => void;
  deletingIds?: string[];
  onNewChat: () => void;
}

const ChatSidebar = ({
  isOpen,
  onToggle,
  threads,
  currentThreadId,
  onSelectThread,
  onDeleteThread,
  deletingIds,
  onNewChat,
}: ChatSidebarProps) => {
  return (
    <>
      {/* Desktop sidebar (md and up) */}
      <div
        className={cn(
          "hidden md:flex h-full border-r border-border bg-sidebar transition-all duration-300 ease-in-out flex-col",
          isOpen ? "w-64" : "w-0 opacity-0"
        )}
        style={{ minWidth: isOpen ? '16rem' : '0' }}
      >
        <div className={cn(
          "transition-opacity duration-200",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}>
          {/* Logo/Icon */}
          <div className="p-4 pb-3 flex items-center justify-center">
            <div 
              className="w-10 h-10 rounded-full bg-foreground text-background flex items-center justify-center font-bold text-lg"
              style={{ animation: 'float 3s ease-in-out infinite' }}
            >
              H
            </div>
          </div>

          <div className="px-3 pb-3">
            <button
              onClick={onNewChat}
              className="w-full flex items-center justify-start gap-2 h-11 px-3 rounded-lg bg-muted hover:bg-foreground hover:text-background transition-all duration-300 text-base font-medium group touch-manipulation"
            >
              <Plus className="h-4 w-4 group-hover:rotate-90 transition-transform duration-300" />
              محادثة جديدة
            </button>
          </div>

          <ScrollArea className="flex-1 px-3 py-3">
            {threads.length > 0 && (
              <div className="flex items-center gap-2 px-2 py-2 mb-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">السجل</span>
              </div>
            )}
            <div className="space-y-1 pb-2">
              {threads.map((thread) => {
                const isDeleting = deletingIds?.includes(thread.id);

                // ThreadItem inline component to animate height collapse
                const ThreadItem = () => {
                  const ref = useRef<HTMLDivElement | null>(null);
                  const [maxH, setMaxH] = useState<string | number>("none");
                  const [isHoveringDelete, setIsHoveringDelete] = useState(false);
                  const [isDragging, setIsDragging] = useState(false);

                  useEffect(() => {
                    if (!ref.current) return;
                    const el = ref.current;
                    const height = el.scrollHeight;
                    if (!isDeleting) {
                      setMaxH(height + "px");
                    } else {
                      setMaxH(height + "px");
                      requestAnimationFrame(() => {
                        requestAnimationFrame(() => setMaxH(0));
                      });
                    }
                  }, [isDeleting]);

                  const handleDragStart = (e: React.DragEvent) => {
                    setIsDragging(true);
                    e.dataTransfer.effectAllowed = 'move';
                    e.dataTransfer.setData('threadId', thread.id);
                  };

                  const handleDragEnd = () => {
                    setIsDragging(false);
                  };

                  const handleDragOver = (e: React.DragEvent) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                  };

                  const handleDrop = (e: React.DragEvent) => {
                    e.preventDefault();
                    const draggedId = e.dataTransfer.getData('threadId');
                    if (draggedId !== thread.id) {
                      // Here you would call a function to reorder threads
                      console.log('Reorder:', draggedId, 'to position of', thread.id);
                    }
                  };

                  return (
                    <div
                      ref={ref}
                      draggable
                      onDragStart={handleDragStart}
                      onDragEnd={handleDragEnd}
                      onDragOver={handleDragOver}
                      onDrop={handleDrop}
                      style={{
                        overflow: "hidden",
                        maxHeight: maxH,
                        transition: "max-height 260ms cubic-bezier(.2,.8,.2,1), opacity 200ms, transform 300ms",
                      }}
                      className={cn(
                        "rounded-lg cursor-move",
                        isDragging && "opacity-50 scale-95"
                      )}
                    >
                      <Link
                        to={`/chat/${thread.id}`}
                        onClick={() => onSelectThread(thread.id)}
                        className={cn(
                          "group block w-full text-right px-3 py-2.5 text-base relative rounded-lg overflow-hidden",
                          "hover:bg-muted/80 transition-all duration-200",
                          currentThreadId === thread.id ? "bg-muted font-medium" : "",
                          isDeleting ? "opacity-0 translate-x-6 scale-95" : "",
                          isDragging && "cursor-grabbing"
                        )}
                        style={{ lineHeight: 1.5 }}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="flex-1 min-w-0">
                            <p className="truncate text-sm">{thread.title}</p>
                          </div>
                          <div className="shrink-0 flex items-center gap-1">
                            <button
                              className={cn(
                                "h-7 w-7 rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200",
                                isHoveringDelete 
                                  ? "bg-foreground text-background scale-110" 
                                  : "bg-muted text-foreground hover:bg-foreground/10"
                              )}
                              onMouseEnter={() => setIsHoveringDelete(true)}
                              onMouseLeave={() => setIsHoveringDelete(false)}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                if (onDeleteThread) onDeleteThread(thread.id);
                              }}
                            >
                              <Trash2 
                                className="h-3.5 w-3.5" 
                                style={isHoveringDelete ? { animation: 'wiggle 0.5s ease-in-out' } : {}}
                              />
                            </button>
                          </div>
                        </div>
                      </Link>
                    </div>
                  );
                };

                return <ThreadItem key={thread.id} />;
              })}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Mobile overlay (below md) */}
  <div className={cn(
    "md:hidden fixed inset-0 z-40 transition-all duration-300",
    !isOpen && "pointer-events-none"
  )}>
        {/* Backdrop */}
        <div
          onClick={onToggle}
          className={cn(
            "absolute inset-0 bg-black/40 transition-opacity duration-300",
            isOpen ? "opacity-100" : "opacity-0"
          )}
        />

        {/* Sliding panel */}
        <div
          className={cn(
            "absolute top-0 bottom-0 right-0 w-72 sm:w-80 bg-sidebar shadow-xl transform transition-transform duration-300 ease-in-out flex flex-col",
            isOpen ? "translate-x-0" : "translate-x-full"
          )}
        >
          <div className="p-4 pb-3 flex items-center justify-center">
            <div 
              className="w-10 h-10 rounded-full bg-foreground text-background flex items-center justify-center font-bold text-lg"
              style={{ animation: 'float 3s ease-in-out infinite' }}
            >
              H
            </div>
          </div>

          <div className="px-3 pb-3">
            <button
              onClick={() => { onNewChat(); }}
              className="w-full flex items-center justify-start gap-2 h-11 px-3 rounded-lg bg-muted hover:bg-foreground hover:text-background transition-all duration-300 text-base font-medium group touch-manipulation"
            >
              <Plus className="h-4 w-4 group-hover:rotate-90 transition-transform duration-300" />
              محادثة جديدة
            </button>
          </div>

          <ScrollArea className="flex-1 px-3 py-3">
            {threads.length > 0 && (
              <div className="flex items-center gap-2 px-2 py-2 mb-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">السجل</span>
              </div>
            )}
            <div className="space-y-1 pb-4">
              {threads.map((thread) => (
                <div key={thread.id} className="rounded-lg">
                  <Link
                    to={`/chat/${thread.id}`}
                    onClick={() => { onSelectThread(thread.id); onToggle(); }}
                    className={cn(
                      "group block w-full text-right px-3 py-2.5 text-sm relative rounded-lg overflow-hidden",
                      "hover:bg-muted/80 transition-all duration-200",
                      currentThreadId === thread.id ? "bg-muted font-medium" : ""
                    )}
                    style={{ lineHeight: 1.5 }}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-sm">{thread.title}</p>
                      </div>
                      <div className="shrink-0 flex items-center gap-1">
                        <button
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (onDeleteThread) onDeleteThread(thread.id); }}
                          className="h-7 w-7 rounded-md flex items-center justify-center bg-muted text-foreground hover:bg-foreground/10"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Mobile profile menu at bottom */}
          <div className="border-t border-border pt-3 pb-3 px-3">
            <ProfileMenu isMobile={true} />
          </div>
        </div>
      </div>

      {/* Desktop toggle button */}
      <div className="hidden md:block border-r border-border bg-sidebar p-2 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className="h-9 w-9"
        >
          {isOpen ? (
            <PanelLeftClose className="h-4 w-4" />
          ) : (
            <PanelLeft className="h-4 w-4" />
          )}
        </Button>
      </div>
    </>
  );
};

export default ChatSidebar;

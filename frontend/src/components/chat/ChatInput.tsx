import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowUp, Mic, Square, Sparkles, Brain, Search } from "lucide-react";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import { transcribeAudio } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import VoiceWaveform from "./VoiceWaveform";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSendMessage: (content: string, thinkMode?: boolean, searchMode?: boolean) => void;
  disabled?: boolean;
}

const ChatInput = ({ onSendMessage, disabled = false }: ChatInputProps) => {
  const [input, setInput] = useState("");
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [thinkMode, setThinkMode] = useState(false);
  const [searchMode, setSearchMode] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const {
    isRecording,
    recordingTime,
    startRecording,
    stopRecording,
    cancelRecording,
    error: recordingError,
  } = useAudioRecorder();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (disabled) return;
    if (input.trim()) {
      onSendMessage(input.trim(), thinkMode, searchMode);
      setInput("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  const handleMicClick = async () => {
    if (isRecording) {
      const audioBlob = await stopRecording();
      if (audioBlob) {
        setIsTranscribing(true);
        try {
          const transcribedText = await transcribeAudio(audioBlob);
          setInput((prev) => prev + (prev ? ' ' : '') + transcribedText);
          textareaRef.current?.focus();
        } catch (err) {
          console.error('Transcription failed:', err);
          alert('فشل في تحويل الصوت إلى نص. يرجى المحاولة مرة أخرى.');
        } finally {
          setIsTranscribing(false);
        }
      }
    } else {
      await startRecording();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, 200)}px`;
    }
  }, [input]);

  useEffect(() => {
    if (recordingError) {
      alert(recordingError);
      cancelRecording();
    }
  }, [recordingError, cancelRecording]);

  const isBusy = disabled || isTranscribing;

  return (
    <div className="md:static fixed bottom-0 left-0 w-full md:w-auto z-30 border-t border-border/50 bg-background/80 backdrop-blur-xl touch-manipulation" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="max-w-4xl mx-auto px-4 py-4 md:p-4">
        {/* Recording indicator */}
        <AnimatePresence>
          {isRecording && (
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="mb-3 flex items-center justify-center gap-2.5 bg-red-500/10 dark:bg-red-500/20 border border-red-500/30 px-4 py-2.5 rounded-xl"
            >
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="w-2 h-2 bg-red-500 rounded-full"
              />
              <VoiceWaveform isRecording={isRecording} />
              <span className="font-mono text-sm text-red-600 dark:text-red-400 tabular-nums font-medium">
                {formatTime(recordingTime)}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit}>
          <div className="relative">
            {/* Main input container */}
            <div className={cn(
              "relative rounded-[28px] bg-muted/50 backdrop-blur-sm transition-all duration-200",
              "border-2 border-transparent",
              "hover:bg-muted/70",
              !isBusy && !isRecording && "focus-within:border-foreground/20 focus-within:bg-background/90"
            )}>
              {/* Mode indicators */}
              <AnimatePresence>
                {(thinkMode || searchMode) && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="absolute top-3 right-4 flex items-center gap-2"
                  >
                    {thinkMode && (
                      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-purple-500/10 dark:bg-purple-500/20 border border-purple-500/30 rounded-full">
                        <Brain className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                        <span className="text-xs font-medium text-purple-600 dark:text-purple-400">
                          تفكير
                        </span>
                      </div>
                    )}
                    {searchMode && (
                      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-500/10 dark:bg-blue-500/20 border border-blue-500/30 rounded-full">
                        <Search className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                          بحث
                        </span>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Textarea */}
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isTranscribing ? "جاري تحويل الصوت..." : "اكتب رسالة..."}
                disabled={isBusy || isRecording}
                className={cn(
                  "min-h-[56px] max-h-[200px] resize-none border-0 bg-transparent",
                  "px-5 py-4 text-base leading-relaxed",
                  "focus-visible:ring-0 focus-visible:ring-offset-0",
                  "placeholder:text-muted-foreground/60",
                  "disabled:opacity-60 disabled:cursor-not-allowed",
                  (thinkMode || searchMode) && "pr-32",
                  (thinkMode && searchMode) && "pr-44"
                )}
                style={{ textAlign: 'right', lineHeight: 1.6 }}
                rows={1}
              />

              {/* Bottom action bar */}
              <div className="flex items-center justify-between px-3 pb-3">
                {/* Left side - Action buttons */}
                <div className="flex items-center gap-1.5">
                  {/* Send button */}
                  <motion.div
                    whileHover={{ scale: input.trim() && !isBusy ? 1.05 : 1 }}
                    whileTap={{ scale: input.trim() && !isBusy ? 0.95 : 1 }}
                  >
                    <Button
                      type="submit"
                      size="icon"
                      disabled={isBusy || !input.trim()}
                      className={cn(
                        "h-10 w-10 rounded-full transition-all duration-200 touch-manipulation",
                        input.trim() && !isBusy
                          ? "bg-foreground text-background hover:bg-foreground/90 shadow-lg shadow-foreground/20"
                          : "bg-muted text-muted-foreground hover:bg-muted cursor-not-allowed"
                      )}
                    >
                      <ArrowUp className="h-5 w-5" />
                    </Button>
                  </motion.div>

                  {/* Voice button */}
                  <motion.div
                    whileHover={{ scale: !isBusy ? 1.05 : 1 }}
                    whileTap={{ scale: !isBusy ? 0.95 : 1 }}
                  >
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={handleMicClick}
                      disabled={isBusy}
                      className={cn(
                        "h-10 w-10 rounded-full transition-all duration-200 touch-manipulation",
                        isRecording 
                          ? "bg-red-500 hover:bg-red-600 text-white" 
                          : "hover:bg-muted/80 text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {isTranscribing ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
                        />
                      ) : isRecording ? (
                        <Square className="h-3.5 w-3.5 fill-current" />
                      ) : (
                        <Mic className="h-4 w-4" />
                      )}
                    </Button>
                  </motion.div>
                </div>

                {/* Right side - Mode toggles */}
                <div className="flex items-center gap-1.5">
                  {/* Search mode toggle */}
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => setSearchMode(!searchMode)}
                      className={cn(
                        "h-8 gap-1.5 rounded-full px-3 transition-all duration-200 text-xs font-medium touch-manipulation",
                        searchMode 
                          ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20" 
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
                      )}
                    >
                      <Search className="w-3.5 h-3.5" />
                      <span>بحث</span>
                    </Button>
                  </motion.div>

                  {/* Think mode toggle */}
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => setThinkMode(!thinkMode)}
                      className={cn(
                        "h-8 gap-1.5 rounded-full px-3 transition-all duration-200 text-xs font-medium touch-manipulation",
                        thinkMode 
                          ? "bg-purple-500/10 text-purple-600 dark:text-purple-400 hover:bg-purple-500/20" 
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
                      )}
                    >
                      <Brain className={cn(
                        "w-3.5 h-3.5 transition-transform duration-200",
                        thinkMode && "rotate-12"
                      )} />
                      <span>تفكير</span>
                    </Button>
                  </motion.div>
                </div>
              </div>
            </div>

            {/* Character count for long messages */}
            <AnimatePresence>
              {input.length > 1500 && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="absolute -top-8 left-0 text-xs text-muted-foreground"
                >
                  {input.length} / 2000
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatInput;

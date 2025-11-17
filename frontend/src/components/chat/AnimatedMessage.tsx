import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MarkdownRenderer from './MarkdownRenderer';
import { Brain, ChevronDown, ChevronUp, Search } from 'lucide-react';

interface AnimatedMessageProps {
  content: string;
  isStreaming?: boolean;
  isComplete?: boolean;
  thinking?: string;
  isThinking?: boolean;
  searching?: boolean;
}

export default function AnimatedMessage({ content, isStreaming = false, isComplete = false, thinking, isThinking = false, searching = false }: AnimatedMessageProps) {
  const [displayedWords, setDisplayedWords] = useState<string[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [thinkingExpanded, setThinkingExpanded] = useState(true);
  const previousContentRef = useRef('');
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    if (!isStreaming || isComplete) {
      // Show all content immediately when not streaming or when complete
      setDisplayedWords([content]);
      setCurrentWordIndex(0);
      return;
    }

    // Split content into words (handling markdown, code blocks, etc.)
    const words = content.split(/(\s+)/); // Keep spaces
    
    // Only animate new words
    const previousWords = previousContentRef.current.split(/(\s+)/);
    const newWordsCount = words.length - previousWords.length;

    if (newWordsCount > 0) {
      // Animate word by word with delay
      const startIndex = previousWords.length;
      
      const animateWords = () => {
        setDisplayedWords(words.slice(0, startIndex + currentWordIndex + 1));
        
        if (currentWordIndex < newWordsCount - 1) {
          setCurrentWordIndex(prev => prev + 1);
          // Shorter delay for faster typing effect (30ms per word)
          animationFrameRef.current = window.setTimeout(animateWords, 30);
        } else {
          setCurrentWordIndex(0);
        }
      };

      // Cancel any existing animation
      if (animationFrameRef.current) {
        clearTimeout(animationFrameRef.current);
      }

      animateWords();
    } else {
      setDisplayedWords(words);
    }

    previousContentRef.current = content;

    return () => {
      if (animationFrameRef.current) {
        clearTimeout(animationFrameRef.current);
      }
    };
  }, [content, isStreaming, isComplete, currentWordIndex]);

  const displayContent = isStreaming && !isComplete 
    ? displayedWords.join('') 
    : content;

  return (
    <motion.div 
      layout
      className="relative"
      transition={{
        layout: {
          duration: 0.15,
          ease: "easeOut"
        }
      }}
    >
      {/* Thinking section */}
      {(thinking || isThinking) && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 rounded-lg border border-purple-500/30 bg-purple-500/5 dark:bg-purple-500/10 overflow-hidden"
        >
          <button
            onClick={() => setThinkingExpanded(!thinkingExpanded)}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-purple-700 dark:text-purple-300 hover:bg-purple-500/10 dark:hover:bg-purple-500/15 transition-colors"
          >
            <Brain className="w-4 h-4" />
            <span>التفكير...</span>
            {isThinking && (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-3 h-3 border-2 border-current border-t-transparent rounded-full ml-auto"
              />
            )}
            {!isThinking && (
              thinkingExpanded ? 
                <ChevronUp className="w-4 h-4 ml-auto" /> : 
                <ChevronDown className="w-4 h-4 ml-auto" />
            )}
          </button>
          <AnimatePresence>
            {thinkingExpanded && thinking && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="px-4 pb-3 text-sm text-purple-800 dark:text-purple-200 whitespace-pre-wrap"
              >
                {thinking}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Search indicator */}
      {searching && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 rounded-lg border border-blue-500/30 bg-blue-500/5 dark:bg-blue-500/10 overflow-hidden"
        >
          <div className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-blue-700 dark:text-blue-300">
            <Search className="w-4 h-4" />
            <span>جاري البحث على الإنترنت...</span>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-3 h-3 border-2 border-current border-t-transparent rounded-full ml-auto"
            />
          </div>
        </motion.div>
      )}

      {/* Main content */}
      <MarkdownRenderer content={displayContent} />
      {isStreaming && !isComplete && (
        <motion.span
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
          className="inline-block ml-0.5 w-2 h-4 bg-current"
        />
      )}
    </motion.div>
  );
}

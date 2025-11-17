import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import rehypeHighlight from 'rehype-highlight';
import 'katex/dist/katex.min.css';
import 'highlight.js/styles/github-dark.css';
import { cn } from '@/lib/utils';
import { Copy, Check, ChevronDown, ChevronUp, Maximize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

// Citation reference component
function CitationReference({ citations }: { citations: Map<string, string> }) {
  if (citations.size === 0) return null;

  return (
    <div className="mt-6 pt-4 border-t border-neutral-200 dark:border-neutral-800">
      <div className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-3">📚 Sources:</div>
      <div className="space-y-2 text-sm">
        {Array.from(citations.entries()).map(([index, url]) => (
          <div key={index} className="flex gap-2">
            <span className="text-blue-600 dark:text-blue-400 font-medium min-w-fit">[{index}]</span>
            <a 
              href={url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline decoration-blue-400 dark:decoration-blue-600 underline-offset-2 break-all"
            >
              {url}
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}

// Extract citations from content
function extractCitations(content: string): { cleanContent: string; citations: Map<string, string> } {
  const citations = new Map<string, string>();
  const citationPattern = /\[(\d+)\]\s*\((https?:\/\/[^\)]+)\)/g;
  
  let cleanContent = content;
  let match;
  
  while ((match = citationPattern.exec(content)) !== null) {
    const index = match[1];
    const url = match[2];
    citations.set(index, url);
  }
  
  // Remove the URL part but keep the citation number
  cleanContent = cleanContent.replace(/\[(\d+)\]\s*\((https?:\/\/[^\)]+)\)/g, '[$1]');
  
  return { cleanContent, citations };
}

// Mermaid diagrams - Show as formatted code for now
// TODO: Add mermaid support with proper Vite configuration
function MermaidDiagram({ chart }: { chart: string }) {
  return (
    <div className="my-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-2 border-dashed border-blue-300 dark:border-blue-700 rounded-xl">
      <div className="flex items-center gap-2 mb-2">
        <div className="px-3 py-1 bg-blue-500/20 text-blue-700 dark:text-blue-300 text-xs font-semibold rounded-full border border-blue-500/30">
          مخطط Mermaid
        </div>
      </div>
      <pre className="text-sm text-neutral-700 dark:text-neutral-300 overflow-x-auto font-mono leading-relaxed">
        {chart}
      </pre>
      <p className="text-xs text-muted-foreground mt-3 italic">
        💡 دعم رسم المخططات قريباً
      </p>
    </div>
  );
}

function CodeBlock({ inline, className, children, ...props }: any) {
  const [copied, setCopied] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const match = /language-(\w+)/.exec(className || '');
  const language = match ? match[1] : '';
  const code = String(children).replace(/\n$/, '');
  const lines = code.split('\n');
  const isLong = lines.length > 10;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Check if it's a mermaid diagram
  if (language === 'mermaid') {
    return <MermaidDiagram chart={code} />;
  }

  if (inline) {
    return (
      <code 
        className="bg-neutral-200/60 dark:bg-neutral-800/60 text-neutral-800 dark:text-neutral-200 px-1.5 py-0.5 rounded text-[0.95em] font-mono" 
        {...props}
      >
        {children}
      </code>
    );
  }

  return (
    <div className="relative my-4 group rounded-xl overflow-hidden shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between bg-gradient-to-r from-neutral-800 to-neutral-900 dark:from-neutral-900 dark:to-black px-4 py-2.5 border-b border-neutral-700">
        <div className="flex items-center gap-2">
          {language && (
            <span className="px-2.5 py-0.5 bg-blue-500/20 text-blue-300 text-xs font-semibold rounded-full border border-blue-500/30">
              {language}
            </span>
          )}
          {isLong && (
            <span className="text-xs text-neutral-500">
              {lines.length} lines
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-1">
          {isLong && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1.5 rounded-md hover:bg-neutral-700/50 transition-colors"
              title={isCollapsed ? "Expand" : "Collapse"}
            >
              {isCollapsed ? (
                <ChevronDown className="w-4 h-4 text-neutral-400" />
              ) : (
                <ChevronUp className="w-4 h-4 text-neutral-400" />
              )}
            </motion.button>
          )}
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-md hover:bg-neutral-700/50 transition-colors"
            title="Fullscreen"
          >
            <Maximize2 className="w-4 h-4 text-neutral-400" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleCopy}
            className="p-1.5 rounded-md hover:bg-neutral-700/50 transition-colors"
            title="Copy code"
          >
            <AnimatePresence mode="wait">
              {copied ? (
                <motion.div
                  key="check"
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0, rotate: 180 }}
                >
                  <Check className="w-4 h-4 text-green-400" />
                </motion.div>
              ) : (
                <motion.div
                  key="copy"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                >
                  <Copy className="w-4 h-4 text-neutral-400" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </div>

      {/* Code content */}
      <AnimatePresence mode="wait">
        {!isCollapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={cn(
              "overflow-hidden",
              isExpanded && "fixed inset-4 z-50 bg-neutral-900 rounded-lg"
            )}
          >
            <pre 
              className={cn(
                "m-0 overflow-x-auto bg-neutral-900 text-sm leading-relaxed",
                isExpanded ? "p-6 max-h-[calc(100vh-2rem)]" : "p-4 max-h-[400px]"
              )}
            >
              <code 
                className={cn(
                  "font-mono text-sm",
                  className
                )}
                {...props}
              >
                {children}
              </code>
            </pre>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop for fullscreen */}
      {isExpanded && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40"
          onClick={() => setIsExpanded(false)}
        />
      )}
    </div>
  );
}

// Enhanced table with hover effects
function Table({ node, ...props }: any) {
  return (
    <div className="my-4 overflow-x-auto rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-lg">
      <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-800" {...props} />
    </div>
  );
}

function TableHead({ node, ...props }: any) {
  return (
    <thead className="bg-gradient-to-r from-neutral-100 to-neutral-50 dark:from-neutral-800 dark:to-neutral-900" {...props} />
  );
}

function TableHeader({ node, ...props }: any) {
  return (
    <th 
      className="px-6 py-3 text-right text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider border-b border-neutral-200 dark:border-neutral-700" 
      {...props} 
    />
  );
}

function TableRow({ node, ...props }: any) {
  return (
    <tr 
      className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors" 
      {...props} 
    />
  );
}

function TableCell({ node, ...props }: any) {
  return (
    <td 
      className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900 dark:text-neutral-100 border-b border-neutral-100 dark:border-neutral-800" 
      {...props} 
    />
  );
}

export default function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  const { cleanContent, citations } = extractCitations(content);

  return (
    <div className={cn('markdown-content prose dark:prose-invert max-w-none', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkMath, remarkGfm]}
        rehypePlugins={[rehypeKatex, rehypeHighlight]}
        components={{
          // Headings with enhanced styling
          h1: ({ node, ...props }) => (
            <h1 
              className="text-3xl font-bold mt-6 mb-4 pb-2 border-b-2 border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100" 
              {...props} 
            />
          ),
          h2: ({ node, ...props }) => (
            <h2 
              className="text-2xl font-bold mt-5 mb-3 text-neutral-900 dark:text-neutral-100" 
              {...props} 
            />
          ),
          h3: ({ node, ...props }) => (
            <h3 
              className="text-xl font-bold mt-4 mb-2 text-neutral-900 dark:text-neutral-100" 
              {...props} 
            />
          ),
          h4: ({ node, ...props }) => (
            <h4 
              className="text-lg font-bold mt-3 mb-2 text-neutral-800 dark:text-neutral-200" 
              {...props} 
            />
          ),
          h5: ({ node, ...props }) => (
            <h5 
              className="text-base font-bold mt-2 mb-1 text-neutral-800 dark:text-neutral-200" 
              {...props} 
            />
          ),
          h6: ({ node, ...props }) => (
            <h6 
              className="text-sm font-bold mt-2 mb-1 text-neutral-700 dark:text-neutral-300" 
              {...props} 
            />
          ),
          
          // Paragraphs with better spacing
          p: ({ node, ...props }) => (
            <p 
              className="mb-4 last:mb-0 leading-relaxed text-neutral-800 dark:text-neutral-200 text-base" 
              {...props} 
            />
          ),
          
          // Lists with better styling
          ul: ({ node, ...props }) => (
            <ul 
              className="list-disc list-inside mb-4 space-y-1 ml-2 text-neutral-800 dark:text-neutral-200" 
              {...props} 
            />
          ),
          ol: ({ node, ...props }) => (
            <ol 
              className="list-decimal list-inside mb-4 space-y-1 ml-2 text-neutral-800 dark:text-neutral-200" 
              {...props} 
            />
          ),
          li: ({ node, ...props }) => (
            <li 
              className="mb-1 leading-relaxed" 
              {...props} 
            />
          ),
          
          // Blockquotes with enhanced design
          blockquote: ({ node, ...props }) => (
            <blockquote 
              className="border-l-4 border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20 pl-4 pr-4 py-3 my-4 italic text-neutral-700 dark:text-neutral-300 rounded-r-lg" 
              {...props} 
            />
          ),
          
          // Code blocks
          code: CodeBlock,
          pre: ({ node, ...props }) => <div {...props} />,
          
          // Links with hover effects
          a: ({ node, ...props }) => (
            <a 
              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline decoration-blue-400 dark:decoration-blue-600 underline-offset-2 hover:decoration-2 transition-all" 
              target="_blank" 
              rel="noopener noreferrer" 
              {...props} 
            />
          ),
          
          // Enhanced tables
          table: Table,
          thead: TableHead,
          th: TableHeader,
          tr: TableRow,
          td: TableCell,
          tbody: ({ node, ...props }: any) => (
            <tbody className="bg-white dark:bg-neutral-900 divide-y divide-neutral-100 dark:divide-neutral-800" {...props} />
          ),
          
          // Text formatting
          strong: ({ node, ...props }) => (
            <strong className="font-bold text-neutral-900 dark:text-neutral-100" {...props} />
          ),
          em: ({ node, ...props }) => (
            <em className="italic text-neutral-800 dark:text-neutral-200" {...props} />
          ),
          
          // Horizontal rule
          hr: ({ node, ...props }) => (
            <hr className="my-8 border-t-2 border-neutral-200 dark:border-neutral-800" {...props} />
          ),
        }}
      >
        {cleanContent}
      </ReactMarkdown>
      
      {/* Citation section */}
      <CitationReference citations={citations} />
    </div>
  );
}

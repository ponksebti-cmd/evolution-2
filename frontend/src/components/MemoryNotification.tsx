import { useEffect, useState } from "react";
import { Brain, Trash2, X } from "lucide-react";
import { toast } from "sonner";

export type MemoryActionType = "saved" | "deleted" | "forgotten" | "ignored";

interface MemoryNotificationProps {
  action: MemoryActionType;
  category?: string;
  content?: string;
  autoHide?: boolean;
  duration?: number;
}

/**
 * Displays notifications when memories are added, deleted, or forgotten
 * Shows brain icon with relevant message and category info
 */
export const MemoryNotification = ({
  action,
  category,
  content,
  autoHide = true,
  duration = 4000,
}: MemoryNotificationProps) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (autoHide) {
      const timer = setTimeout(() => setIsVisible(false), duration);
      return () => clearTimeout(timer);
    }
  }, [autoHide, duration]);

  if (!isVisible) return null;

  const getIcon = () => {
    switch (action) {
      case "saved":
        return <Brain className="w-5 h-5 text-blue-500" />;
      case "deleted":
      case "forgotten":
        return <Trash2 className="w-5 h-5 text-red-500" />;
      case "ignored":
        return <X className="w-5 h-5 text-gray-400" />;
      default:
        return <Brain className="w-5 h-5" />;
    }
  };

  const getMessage = () => {
    const categoryLabel = category ? ` (${category})` : "";
    const contentPreview = content ? ` - "${content.slice(0, 40)}..."` : "";

    switch (action) {
      case "saved":
        return `💾 Memory saved${categoryLabel}${contentPreview}`;
      case "deleted":
        return `🗑️ Memory deleted${contentPreview}`;
      case "forgotten":
        return `🧠 Memory removed as requested${contentPreview}`;
      case "ignored":
        return "⏭️ Temporary info (not saved)";
      default:
        return "Memory updated";
    }
  };

  const getBackgroundColor = () => {
    switch (action) {
      case "saved":
        return "bg-blue-50 border-blue-200";
      case "deleted":
      case "forgotten":
        return "bg-red-50 border-red-200";
      case "ignored":
        return "bg-gray-50 border-gray-200";
      default:
        return "bg-gray-50 border-gray-200";
    }
  };

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${getBackgroundColor()} animate-in fade-in slide-in-from-top duration-300`}
    >
      <div className="flex-shrink-0">{getIcon()}</div>
      <div className="flex-1 text-sm font-medium text-gray-700">
        {getMessage()}
      </div>
      <button
        onClick={() => setIsVisible(false)}
        className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

/**
 * Hook to trigger memory notifications
 */
export const useMemoryNotification = () => {
  const showMemorySaved = (category: string, content: string) => {
    toast.success(
      `💾 Memory saved (${category})`,
      {
        description: `"${content.slice(0, 50)}..."`,
        duration: 4000,
      }
    );
  };

  const showMemoryDeleted = (content: string) => {
    toast.error(
      `🗑️ Memory deleted`,
      {
        description: `"${content.slice(0, 50)}..."`,
        duration: 3000,
      }
    );
  };

  const showMemoryForgotten = (content: string) => {
    toast.info(
      `🧠 Memory removed`,
      {
        description: `"${content.slice(0, 50)}..."`,
        duration: 3000,
      }
    );
  };

  const showMemoryIgnored = () => {
    toast.info(
      `⏭️ Temporary info (not saved to memory)`,
      {
        duration: 2000,
      }
    );
  };

  return {
    showMemorySaved,
    showMemoryDeleted,
    showMemoryForgotten,
    showMemoryIgnored,
  };
};

export default MemoryNotification;

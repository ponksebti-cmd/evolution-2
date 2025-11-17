import { AlertCircle, WifiOff, ServerCrash, Lock, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export type ErrorType = "not-found" | "network" | "server" | "auth" | "generic";

interface ErrorStateProps {
  type?: ErrorType;
  title?: string;
  message?: string;
  onRetry?: () => void;
  onGoHome?: () => void;
  showHomeButton?: boolean;
}

const errorConfig: Record<ErrorType, { icon: any; title: string; message: string; color: string }> = {
  "not-found": {
    icon: AlertCircle,
    title: "المحادثة غير موجودة",
    message: "عذراً، لم نتمكن من العثور على هذه المحادثة. ربما تم حذفها أو أن الرابط غير صحيح.",
    color: "text-yellow-500 dark:text-yellow-400"
  },
  "network": {
    icon: WifiOff,
    title: "لا يوجد اتصال بالإنترنت",
    message: "تحقق من اتصالك بالإنترنت وحاول مرة أخرى.",
    color: "text-orange-500 dark:text-orange-400"
  },
  "server": {
    icon: ServerCrash,
    title: "حدث خطأ في الخادم",
    message: "نعتذر، حدثت مشكلة في الخادم. يرجى المحاولة مرة أخرى بعد قليل.",
    color: "text-red-500 dark:text-red-400"
  },
  "auth": {
    icon: Lock,
    title: "خطأ في المصادقة",
    message: "انتهت جلستك أو لا تملك صلاحية الوصول. يرجى تسجيل الدخول مرة أخرى.",
    color: "text-red-500 dark:text-red-400"
  },
  "generic": {
    icon: AlertCircle,
    title: "حدث خطأ ما",
    message: "عذراً، حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.",
    color: "text-red-500 dark:text-red-400"
  }
};

export const ErrorState = ({ 
  type = "generic", 
  title, 
  message, 
  onRetry, 
  onGoHome,
  showHomeButton = true 
}: ErrorStateProps) => {
  const config = errorConfig[type];
  const Icon = config.icon;
  const displayTitle = title || config.title;
  const displayMessage = message || config.message;

  return (
    <div className="flex items-center justify-center min-h-[60vh] px-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-md w-full text-center"
      >
        {/* Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 200, damping: 15 }}
          className="mb-6 flex justify-center"
        >
          <div className={`p-4 rounded-full bg-muted/50 ${config.color}`}>
            <Icon className="w-12 h-12" strokeWidth={1.5} />
          </div>
        </motion.div>

        {/* Title */}
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-2xl font-bold mb-3"
          style={{ lineHeight: 1.4 }}
        >
          {displayTitle}
        </motion.h2>

        {/* Message */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-muted-foreground mb-8"
          style={{ lineHeight: 1.7 }}
        >
          {displayMessage}
        </motion.p>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-3 justify-center"
        >
          {onRetry && (
            <Button
              onClick={onRetry}
              className="gap-2 touch-manipulation min-h-[44px]"
              size="lg"
            >
              <RefreshCw className="w-4 h-4" />
              حاول مرة أخرى
            </Button>
          )}
          
          {showHomeButton && onGoHome && (
            <Button
              onClick={onGoHome}
              variant="outline"
              className="gap-2 touch-manipulation min-h-[44px]"
              size="lg"
            >
              <Home className="w-4 h-4" />
              العودة للرئيسية
            </Button>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
};

export default ErrorState;

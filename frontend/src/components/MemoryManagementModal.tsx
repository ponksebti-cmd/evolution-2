import { useState, useEffect } from "react";
import { Brain, Trash2, Loader } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import { toast } from "sonner";

interface MemoryStats {
  total_memories: number;
  by_category: Record<string, number>;
  average_confidence: number;
  active_memory_limit: number;
}

/**
 * Modal for viewing and managing user memories
 * Allows viewing stats, cleaning up old memories, and clearing all
 */
export const MemoryManagementModal = () => {
  const [open, setOpen] = useState(false);
  const [stats, setStats] = useState<MemoryStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [isCleaningUp, setIsCleaningUp] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (open) {
      fetchStats();
    }
  }, [open]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await api.apiFetch("/memory/stats");
      setStats(response);
    } catch (err) {
      console.error("Failed to fetch stats:", err);
      toast.error("Failed to load memory stats");
    } finally {
      setLoading(false);
    }
  };

  const handleCleanup = async () => {
    try {
      setIsCleaningUp(true);
      await api.apiFetch("/memory/cleanup", { method: "POST" });
      toast.success("✨ Old memories cleaned up");
      await fetchStats();
    } catch (err) {
      console.error("Cleanup failed:", err);
      toast.error("Failed to cleanup memories");
    } finally {
      setIsCleaningUp(false);
    }
  };

  const handleDeleteAll = async () => {
    if (!confirm("Are you sure? This will delete ALL memories (irreversible)")) {
      return;
    }

    try {
      setIsDeleting(true);
      await api.apiFetch("/memory/all", { method: "DELETE" });
      toast.success("🗑️ All memories deleted");
      setStats({
        total_memories: 0,
        by_category: {},
        average_confidence: 0,
        active_memory_limit: 50,
      });
    } catch (err) {
      console.error("Delete failed:", err);
      toast.error("Failed to delete memories");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <Brain className="w-4 h-4" />
          <span className="hidden sm:inline">Memory</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-blue-500" />
            Memory Management
          </DialogTitle>
          <DialogDescription>
            View and manage your conversation memories
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader className="w-6 h-6 animate-spin text-blue-500" />
          </div>
        ) : stats ? (
          <div className="space-y-6">
            {/* Stats Overview */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="text-sm text-gray-600">Total Memories</div>
                <div className="text-2xl font-bold text-blue-600">
                  {stats.total_memories}
                </div>
                <div className="text-xs text-gray-500">
                  of {stats.active_memory_limit} max
                </div>
              </div>

              <div className="bg-purple-50 rounded-lg p-4">
                <div className="text-sm text-gray-600">Avg Confidence</div>
                <div className="text-2xl font-bold text-purple-600">
                  {(stats.average_confidence * 100).toFixed(0)}%
                </div>
                <div className="text-xs text-gray-500">Memory strength</div>
              </div>
            </div>

            {/* Category Breakdown */}
            {Object.keys(stats.by_category).length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-3">
                  Memory Categories
                </h4>
                <div className="space-y-2">
                  {Object.entries(stats.by_category).map(([category, count]) => (
                    <div
                      key={category}
                      className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3"
                    >
                      <span className="capitalize text-gray-700 font-medium">
                        {category.replace(/_/g, " ")}
                      </span>
                      <span className="bg-gray-200 text-gray-900 rounded-full px-3 py-1 text-sm font-semibold">
                        {count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {stats.total_memories === 0 && (
              <div className="text-center py-8 text-gray-500">
                No memories yet. Start a conversation to build your memory profile!
              </div>
            )}

            {/* Actions */}
            <div className="space-y-2 border-t pt-4">
              <Button
                variant="outline"
                className="w-full justify-start gap-2"
                onClick={handleCleanup}
                disabled={isCleaningUp || stats.total_memories === 0}
              >
                {isCleaningUp ? (
                  <Loader className="w-4 h-4 animate-spin" />
                ) : (
                  <Brain className="w-4 h-4" />
                )}
                <span>Cleanup Old Memories</span>
              </Button>

              <Button
                variant="destructive"
                className="w-full justify-start gap-2"
                onClick={handleDeleteAll}
                disabled={isDeleting || stats.total_memories === 0}
              >
                {isDeleting ? (
                  <Loader className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                <span>Delete All Memories</span>
              </Button>
            </div>

            {/* Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-gray-700">
              <strong>ℹ️ How Memory Works:</strong>
              <ul className="list-disc list-inside mt-2 space-y-1 text-xs">
                <li>Preferences and personal details are automatically saved</li>
                <li>Older memories become less relevant over time</li>
                <li>You can clear all memories anytime</li>
              </ul>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};

export default MemoryManagementModal;

import { useEffect, useState } from "react";
import { Brain, Loader } from "lucide-react";
import api from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";

interface MemoryStats {
  total_memories: number;
  by_category: Record<string, number>;
  average_confidence: number;
  active_memory_limit: number;
}

/**
 * Displays user's memory statistics
 * Shows total memories, breakdown by category, and confidence level
 */
export const MemoryStats = () => {
  const [stats, setStats] = useState<MemoryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await api.apiFetch("/memory/stats");
        setStats(response);
        setError(null);
      } catch (err: any) {
        console.error("Failed to fetch memory stats:", err);
        setError("Failed to load memory stats");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    // Refresh stats every 10 seconds
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, [user]);

  if (loading && !stats) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Loader className="w-4 h-4 animate-spin" />
        <span>Loading memory...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-sm text-red-500">
        {error}
      </div>
    );
  }

  if (!stats || stats.total_memories === 0) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Brain className="w-4 h-4 opacity-50" />
        <span>No memories yet</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-blue-500" />
          <span className="font-medium text-gray-700">Memory Stats</span>
        </div>
        <span className="text-sm font-semibold text-blue-600">
          {stats.total_memories}/{stats.active_memory_limit}
        </span>
      </div>

      {/* Memory progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-blue-500 h-2 rounded-full transition-all"
          style={{
            width: `${(stats.total_memories / stats.active_memory_limit) * 100}%`,
          }}
        />
      </div>

      {/* Confidence score */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600">Avg Confidence</span>
        <span className="font-medium">
          {(stats.average_confidence * 100).toFixed(0)}%
        </span>
      </div>

      {/* Category breakdown */}
      {Object.keys(stats.by_category).length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(stats.by_category).map(([category, count]) => (
            <div
              key={category}
              className="bg-gray-50 rounded-lg px-3 py-2 text-sm"
            >
              <div className="text-gray-600 capitalize">{category}</div>
              <div className="font-semibold text-gray-900">{count}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MemoryStats;

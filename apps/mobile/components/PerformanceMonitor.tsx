/**
 * Performance Monitor Component
 * Displays performance metrics in development mode
 */

import { View, Text, StyleSheet } from "react-native";
import { useMobilePerformance } from "../hooks/useMobilePerformance";
import type { MobilePerformanceMetrics, CacheStats, OfflineStatus } from "@magnus-flipper-ai/core/types/mobile";

interface PerformanceMonitorProps {
  enabled?: boolean;
}

/**
 * Performance Monitor - Shows performance metrics (dev mode only)
 */
export function PerformanceMonitor({ enabled = __DEV__ }: PerformanceMonitorProps) {
  const { metrics, cacheStats, offlineStatus, isLoading } = useMobilePerformance({
    enabled,
    interval: 30000, // 30 seconds
  });

  if (!enabled || isLoading || !metrics) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Performance Monitor</Text>

      {/* Render Time */}
      <View style={styles.metric}>
        <Text style={styles.label}>Render Time:</Text>
        <Text style={styles.value}>{metrics.renderTime.toFixed(2)}ms</Text>
      </View>

      {/* Memory Usage */}
      {metrics.memoryUsage && (
        <View style={styles.metric}>
          <Text style={styles.label}>Memory:</Text>
          <Text style={styles.value}>
            {(metrics.memoryUsage.heapUsed / 1024 / 1024).toFixed(2)}MB
          </Text>
        </View>
      )}

      {/* Cache Stats */}
      {cacheStats && (
        <>
          <View style={styles.metric}>
            <Text style={styles.label}>Image Cache:</Text>
            <Text style={styles.value}>
              {cacheStats.imageCache.memoryEntries} entries
            </Text>
          </View>
          <View style={styles.metric}>
            <Text style={styles.label}>Cache Hit Rate:</Text>
            <Text style={styles.value}>
              {(cacheStats.imageCache.hitRate * 100).toFixed(1)}%
            </Text>
          </View>
        </>
      )}

      {/* Offline Status */}
      {offlineStatus && (
        <View style={styles.metric}>
          <Text style={styles.label}>Status:</Text>
          <Text style={[styles.value, offlineStatus.isOnline ? styles.online : styles.offline]}>
            {offlineStatus.isOnline ? "Online" : "Offline"}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 50,
    right: 10,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    padding: 8,
    borderRadius: 4,
    minWidth: 150,
    zIndex: 9999,
  },
  title: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 4,
  },
  metric: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  label: {
    color: "#ccc",
    fontSize: 10,
  },
  value: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "600",
  },
  online: {
    color: "#4ade80",
  },
  offline: {
    color: "#f87171",
  },
});

import { HealthCheckResult, NodeMetrics, NodeHistoryEntry } from '@/app/types';
import { getMonitoringConfig, validateMonitoringConfig } from './config';

export class SuiRPCClient {
  private history: Map<string, NodeHistoryEntry[]> = new Map();
  private readonly config;

  constructor() {
    this.config = validateMonitoringConfig(getMonitoringConfig());
  }

  async testNode(nodeId: string, url: string): Promise<NodeMetrics> {
    const startTime = Date.now();
    let isHealthy = false;
    let error: string | undefined;

    try {
      const result = await this.getNodeInfo(url);
      isHealthy = result.success;
      error = result.error;
    } catch (e) {
      isHealthy = false;
      error = e instanceof Error ? e.message : 'Unknown error';
    }

    const responseTime = Date.now() - startTime;
    
    // Update history
    this.updateHistory(nodeId, {
      timestamp: Date.now(),
      responseTime,
      isHealthy,
    });

    const history = this.history.get(nodeId) || [];
    const errorCount = history.filter(h => !h.isHealthy).length;
    const successCount = history.filter(h => h.isHealthy).length;
    const errorRate = history.length > 0 ? (errorCount / history.length) * 100 : 0;
    const stabilityScore = this.calculateStabilityScore(history);

    return {
      nodeId,
      timestamp: Date.now(),
      responseTime,
      isHealthy,
      errorRate,
      stabilityScore,
      lastError: error,
      successCount,
      errorCount,
    };
  }

  async getNodeInfo(url: string): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    // Try multiple methods in order of preference
    const methods = [
      'sui_getRpcApiVersion',
      'sui_getLatestSuiSystemState', 
      'sui_getChainIdentifier',
      'sui_getTotalTransactionBlocks'
    ];

    for (const method of methods) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.requestTimeout);

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method,
            params: [],
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        const responseTime = Date.now() - startTime;

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.error) {
          // If method not found, try next method
          if (data.error.code === -32601) {
            continue;
          }
          return {
            success: false,
            responseTime,
            error: data.error.message,
          };
        }

        return {
          success: true,
          responseTime,
          data: data.result,
        };
      } catch (error) {
        // If it's the last method, return the error
        if (method === methods[methods.length - 1]) {
          return {
            success: false,
            responseTime: Date.now() - startTime,
            error: error instanceof Error ? error.message : 'Unknown error',
          };
        }
        // Otherwise continue to next method
        continue;
      }
    }

    return {
      success: false,
      responseTime: Date.now() - startTime,
      error: 'No supported RPC methods found',
    };
  }

  async measureLatency(url: string): Promise<number> {
    const iterations = this.config.latencyTestIterations;
    let totalTime = 0;

    for (let i = 0; i < iterations; i++) {
      const start = Date.now();
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.requestTimeout);

        await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'sui_getRpcApiVersion',
            params: [],
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        totalTime += Date.now() - start;
      } catch {
        // If request fails, use a high latency value
        totalTime += 5000;
      }
    }

    return Math.round(totalTime / iterations);
  }

  calculateStabilityScore(history: NodeHistoryEntry[]): number {
    if (history.length === 0) return 0;

    // Weight recent entries more heavily
    let weightedSum = 0;
    let totalWeight = 0;

    history.forEach((entry, index) => {
      const weight = (index + 1) / history.length; // More recent = higher weight
      weightedSum += entry.isHealthy ? weight : 0;
      totalWeight += weight;
    });

    return totalWeight > 0 ? Math.round((weightedSum / totalWeight) * 100) : 0;
  }

  private updateHistory(nodeId: string, entry: NodeHistoryEntry) {
    const history = this.history.get(nodeId) || [];
    history.push(entry);

    // Keep only recent history
    if (history.length > this.config.stabilityHistorySize) {
      history.shift();
    }

    this.history.set(nodeId, history);
  }

  clearHistory() {
    this.history.clear();
  }
}
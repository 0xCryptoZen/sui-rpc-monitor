import { RPCNode, MonitoringResult, NodeMetrics } from '@/app/types';
import { SuiRPCClient } from './rpc-client';
import { getRPCNodes, getMonitoringConfig, validateMonitoringConfig } from './config';

export class NodeMonitor {
  private interval: NodeJS.Timeout | null = null;
  private rpcClient: SuiRPCClient;
  private latestResults: Map<string, MonitoringResult> = new Map();
  private listeners: Set<(results: MonitoringResult[]) => void> = new Set();
  private config;

  constructor() {
    this.config = validateMonitoringConfig(getMonitoringConfig());
    this.rpcClient = new SuiRPCClient();
  }

  startMonitoring(nodes?: RPCNode[], intervalMs?: number): void {
    const configuredNodes = nodes || getRPCNodes();
    const configuredInterval = intervalMs || this.config.interval;
    if (this.interval) {
      this.stopMonitoring();
    }

    // Initial check
    this.checkAllNodes(configuredNodes);

    // Set up interval
    this.interval = setInterval(() => {
      this.checkAllNodes(configuredNodes);
    }, configuredInterval);
  }

  stopMonitoring(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  private async checkAllNodes(nodes: RPCNode[]): Promise<void> {
    const promises = nodes.map(node => this.runHealthCheck(node));
    const results = await Promise.all(promises);
    
    // Update latest results
    results.forEach(result => {
      this.latestResults.set(result.node.id, result);
    });

    // Calculate rankings
    const rankedResults = this.rankNodes(results);

    // Notify listeners
    this.notifyListeners(rankedResults);
  }

  private async runHealthCheck(node: RPCNode): Promise<MonitoringResult> {
    const metrics = await this.rpcClient.testNode(node.id, node.url);
    
    return {
      node,
      metrics,
      isBest: false, // Will be set by rankNodes
      rank: 0, // Will be set by rankNodes
    };
  }

  private rankNodes(results: MonitoringResult[]): MonitoringResult[] {
    // Sort by multiple criteria
    const sorted = [...results].sort((a, b) => {
      // First priority: Health status
      if (a.metrics.isHealthy !== b.metrics.isHealthy) {
        return a.metrics.isHealthy ? -1 : 1;
      }

      // Second priority: Stability score
      if (a.metrics.stabilityScore !== b.metrics.stabilityScore) {
        return b.metrics.stabilityScore - a.metrics.stabilityScore;
      }

      // Third priority: Response time
      return a.metrics.responseTime - b.metrics.responseTime;
    });

    // Assign rankings
    return sorted.map((result, index) => ({
      ...result,
      rank: index + 1,
      isBest: index === 0 && result.metrics.isHealthy,
    }));
  }

  getBestNode(results: MonitoringResult[]): RPCNode | null {
    const healthyNodes = results.filter(r => r.metrics.isHealthy);
    if (healthyNodes.length === 0) return null;

    // Find the node with the best combined score
    const best = healthyNodes.reduce((prev, current) => {
      const prevScore = this.calculateNodeScore(prev.metrics);
      const currentScore = this.calculateNodeScore(current.metrics);
      return currentScore > prevScore ? current : prev;
    });

    return best.node;
  }

  private calculateNodeScore(metrics: NodeMetrics): number {
    // Weighted scoring: stability is most important, then response time
    const stabilityWeight = 0.6;
    const responseTimeWeight = 0.4;

    // Normalize response time to 0-100 scale (lower is better)
    const normalizedResponseTime = Math.max(0, 100 - (metrics.responseTime / 10));

    return (
      metrics.stabilityScore * stabilityWeight +
      normalizedResponseTime * responseTimeWeight
    );
  }

  getLatestResults(): MonitoringResult[] {
    return Array.from(this.latestResults.values());
  }

  subscribe(callback: (results: MonitoringResult[]) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notifyListeners(results: MonitoringResult[]): void {
    this.listeners.forEach(callback => callback(results));
  }

  clearHistory(): void {
    this.rpcClient.clearHistory();
    this.latestResults.clear();
  }
}
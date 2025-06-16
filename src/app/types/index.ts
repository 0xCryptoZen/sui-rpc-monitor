export interface RPCNode {
  id: string;
  name: string;
  url: string;
  region: string;
  provider: string;
}

export interface NodeMetrics {
  nodeId: string;
  timestamp: number;
  responseTime: number;
  isHealthy: boolean;
  errorRate: number;
  stabilityScore: number;
  lastError?: string;
  successCount: number;
  errorCount: number;
}

export interface MonitoringResult {
  node: RPCNode;
  metrics: NodeMetrics;
  isBest: boolean;
  rank: number;
}

export interface HealthCheckResult {
  success: boolean;
  responseTime: number;
  error?: string;
  data?: any;
}

export interface NodeHistoryEntry {
  timestamp: number;
  responseTime: number;
  isHealthy: boolean;
}
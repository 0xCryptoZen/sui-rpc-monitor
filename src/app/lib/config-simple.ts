import { RPCNode } from '@/app/types';
import { DEFAULT_RPC_NODES } from './nodes-config';

export interface MonitoringConfig {
  interval: number;
  requestTimeout: number;
  latencyTestIterations: number;
  stabilityHistorySize: number;
}

/**
 * Parse custom RPC node from environment variable
 * Format: "id|name|url|region|provider"
 */
function parseCustomRPCNode(nodeString: string): RPCNode | null {
  const parts = nodeString.split('|');
  if (parts.length !== 5) {
    console.warn(`Invalid RPC node format: ${nodeString}. Expected format: "id|name|url|region|provider"`);
    return null;
  }

  const [id, name, url, region, provider] = parts;
  
  // Validate required fields
  if (!id || !name || !url || !region || !provider) {
    console.warn(`Invalid RPC node: missing required fields in ${nodeString}`);
    return null;
  }

  // Basic URL validation
  try {
    new URL(url);
  } catch {
    console.warn(`Invalid URL in RPC node: ${url}`);
    return null;
  }

  return {
    id: id.trim(),
    name: name.trim(),
    url: url.trim(),
    region: region.trim(),
    provider: provider.trim(),
  };
}

/**
 * Load custom RPC nodes from environment variables
 */
function loadCustomRPCNodes(): RPCNode[] {
  const customNodes: RPCNode[] = [];
  
  // Check for up to 10 custom nodes
  for (let i = 1; i <= 10; i++) {
    const nodeEnvVar = process.env[`CUSTOM_RPC_NODE_${i}`];
    if (nodeEnvVar) {
      const node = parseCustomRPCNode(nodeEnvVar);
      if (node) {
        customNodes.push(node);
      }
    }
  }

  return customNodes;
}

/**
 * Get RPC nodes configuration (static version for builds)
 * Returns custom nodes if USE_CUSTOM_RPC_NODES is true, otherwise returns default nodes
 */
export function getRPCNodesStatic(): RPCNode[] {
  const useCustomNodes = process.env.USE_CUSTOM_RPC_NODES === 'true';
  
  if (useCustomNodes) {
    const customNodes = loadCustomRPCNodes();
    if (customNodes.length === 0) {
      console.warn('USE_CUSTOM_RPC_NODES is true but no valid custom nodes found. Using default nodes.');
      return DEFAULT_RPC_NODES;
    }
    console.log(`Using ${customNodes.length} custom RPC nodes from environment`);
    return customNodes;
  }

  return DEFAULT_RPC_NODES;
}

/**
 * Get monitoring configuration from environment variables
 */
export function getMonitoringConfig(): MonitoringConfig {
  return {
    interval: parseInt(process.env.MONITORING_INTERVAL || '500', 10),
    requestTimeout: parseInt(process.env.RPC_REQUEST_TIMEOUT || '5000', 10),
    latencyTestIterations: parseInt(process.env.LATENCY_TEST_ITERATIONS || '3', 10),
    stabilityHistorySize: parseInt(process.env.STABILITY_HISTORY_SIZE || '120', 10),
  };
}

/**
 * Validate monitoring configuration
 */
export function validateMonitoringConfig(config: MonitoringConfig): MonitoringConfig {
  const validated = { ...config };

  // Ensure reasonable bounds
  if (validated.interval < 100) {
    console.warn('Monitoring interval too low, setting to 100ms');
    validated.interval = 100;
  }
  if (validated.interval > 10000) {
    console.warn('Monitoring interval too high, setting to 10000ms');
    validated.interval = 10000;
  }

  if (validated.requestTimeout < 1000) {
    console.warn('Request timeout too low, setting to 1000ms');
    validated.requestTimeout = 1000;
  }
  if (validated.requestTimeout > 30000) {
    console.warn('Request timeout too high, setting to 30000ms');
    validated.requestTimeout = 30000;
  }

  if (validated.latencyTestIterations < 1) {
    console.warn('Latency test iterations too low, setting to 1');
    validated.latencyTestIterations = 1;
  }
  if (validated.latencyTestIterations > 10) {
    console.warn('Latency test iterations too high, setting to 10');
    validated.latencyTestIterations = 10;
  }

  if (validated.stabilityHistorySize < 10) {
    console.warn('Stability history size too low, setting to 10');
    validated.stabilityHistorySize = 10;
  }
  if (validated.stabilityHistorySize > 1000) {
    console.warn('Stability history size too high, setting to 1000');
    validated.stabilityHistorySize = 1000;
  }

  return validated;
}
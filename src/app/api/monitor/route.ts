import { NextRequest } from 'next/server';
import { SuiRPCClient } from '@/app/lib/rpc-client';
import { getRPCNodes, getMonitoringConfig, validateMonitoringConfig } from '@/app/lib/config';
import { MonitoringResult, RPCNode, NodeMetrics } from '@/app/types';
import { SuiNodeService } from '@/app/lib/sui-nodes';
import { isCacheStale } from '@/app/lib/cache';

export const runtime = 'nodejs';

// Helper function to calculate node score
function calculateNodeScore(metrics: NodeMetrics): number {
  const stabilityWeight = 0.6;
  const responseTimeWeight = 0.4;
  const normalizedResponseTime = Math.max(0, 100 - (metrics.responseTime / 10));
  
  return (
    metrics.stabilityScore * stabilityWeight +
    normalizedResponseTime * responseTimeWeight
  );
}

// Helper function to rank nodes
function rankNodes(results: MonitoringResult[]): MonitoringResult[] {
  const sorted = [...results].sort((a, b) => {
    if (a.metrics.isHealthy !== b.metrics.isHealthy) {
      return a.metrics.isHealthy ? -1 : 1;
    }
    if (a.metrics.stabilityScore !== b.metrics.stabilityScore) {
      return b.metrics.stabilityScore - a.metrics.stabilityScore;
    }
    return a.metrics.responseTime - b.metrics.responseTime;
  });

  return sorted.map((result, index) => ({
    ...result,
    rank: index + 1,
    isBest: index === 0 && result.metrics.isHealthy,
  }));
}

export async function GET(request: NextRequest) {
  const encoder = new TextEncoder();
  const config = validateMonitoringConfig(getMonitoringConfig());
  
  let intervalId: ReturnType<typeof setInterval> | null = null;
  let isConnected = true;
  let cachedNodes: RPCNode[] = [];
  let lastNodesFetch = 0;

  const stream = new ReadableStream({
    start(controller) {
      const rpcClient = new SuiRPCClient();
      
      // Function to perform health checks and send updates
      const checkAndSend = async () => {
        try {
          // Check if connection is still alive
          if (!isConnected) {
            return;
          }

          // Get fresh nodes from database if cache is stale or empty
          let nodes = cachedNodes;
          if (nodes.length === 0 || isCacheStale(lastNodesFetch, 5000)) {
            nodes = await getRPCNodes();
            cachedNodes = nodes;
            lastNodesFetch = Date.now();
            console.log(`🔄 Refreshed nodes cache: ${nodes.length} nodes`);
          }
          
          const promises = nodes.map(async (node): Promise<MonitoringResult> => {
            const metrics = await rpcClient.testNode(node.id, node.url);
            
            // Store metrics in database (non-blocking)
            try {
              await SuiNodeService.storeMetrics(node.id, metrics);
            } catch (dbError) {
              console.warn(`Failed to store metrics for node ${node.id}:`, dbError);
            }
            
            return {
              node,
              metrics,
              isBest: false,
              rank: 0,
            };
          });
          
          const results = await Promise.all(promises);
          const rankedResults = rankNodes(results);
          
          // Check if controller is still valid before sending
          if (isConnected) {
            try {
              const data = `data: ${JSON.stringify({ results: rankedResults, timestamp: Date.now() })}\n\n`;
              controller.enqueue(encoder.encode(data));
            } catch (enqueueError) {
              console.log('Client disconnected, stopping monitoring');
              isConnected = false;
              if (intervalId) {
                clearInterval(intervalId);
                intervalId = null;
              }
            }
          }
        } catch (error) {
          console.error('Monitoring error:', error);
        }
      };

      // Perform initial check
      checkAndSend().then(() => {
        console.log('Initial monitoring check completed');
      });

      // Set up interval for continuous monitoring
      intervalId = setInterval(checkAndSend, config.interval);

      // Clean up on close/abort
      const cleanup = () => {
        isConnected = false;
        if (intervalId) {
          clearInterval(intervalId);
          intervalId = null;
        }
        try {
          controller.close();
        } catch (error) {
          // Controller might already be closed
        }
      };

      request.signal.addEventListener('abort', cleanup);
      
      // Additional cleanup for when the request ends
      request.signal.addEventListener('close', cleanup);
    },
    
    cancel() {
      isConnected = false;
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
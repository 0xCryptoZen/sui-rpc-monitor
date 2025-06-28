import { NextRequest } from 'next/server';
import { SuiRPCClient } from '@/app/lib/rpc-client';
import { getRPCNodes, getMonitoringConfig, validateMonitoringConfig } from '@/app/lib/config';
import { MonitoringResult, RPCNode, NodeMetrics } from '@/app/types';
import { SuiNodeService } from '@/app/lib/sui-nodes';

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
  const nodes = await getRPCNodes();
  
  let intervalId: ReturnType<typeof setInterval> | null = null;

  const stream = new ReadableStream({
    start(controller) {
      const rpcClient = new SuiRPCClient();
      
      // Function to perform health checks and send updates
      const checkAndSend = async () => {
        try {
          const promises = nodes.map(async (node): Promise<MonitoringResult> => {
            const metrics = await rpcClient.testNode(node.id, node.url);
            
            // Store metrics in database (non-blocking)
            try {
              await SuiNodeService.storeMetrics(node.id, metrics);
            } catch (dbError) {
              console.warn('Failed to store metrics for node', node.id, dbError);
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
          
          const data = `data: ${JSON.stringify({ results: rankedResults, timestamp: Date.now() })}\n\n`;
          controller.enqueue(encoder.encode(data));
        } catch (error) {
          console.error('Monitoring error:', error);
        }
      };

      // Perform initial check
      checkAndSend();

      // Set up interval for continuous monitoring
      intervalId = setInterval(checkAndSend, config.interval);

      // Clean up on close
      request.signal.addEventListener('abort', () => {
        if (intervalId) {
          clearInterval(intervalId);
        }
        controller.close();
      });
    },
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
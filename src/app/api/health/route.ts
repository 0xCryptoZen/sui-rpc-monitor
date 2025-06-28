import { NextResponse } from 'next/server';
import { SuiRPCClient } from '@/app/lib/rpc-client';
import { getRPCNodesStatic } from '@/app/lib/config-simple';
import { MonitoringResult, RPCNode, NodeMetrics } from '@/app/types';

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

// Helper function to get best node
function getBestNode(results: MonitoringResult[]): RPCNode | null {
  const healthyNodes = results.filter(r => r.metrics.isHealthy);
  if (healthyNodes.length === 0) return null;

  const best = healthyNodes.reduce((prev, current) => {
    const prevScore = calculateNodeScore(prev.metrics);
    const currentScore = calculateNodeScore(current.metrics);
    return currentScore > prevScore ? current : prev;
  });

  return best.node;
}

export async function GET() {
  try {
    const nodes = getRPCNodesStatic();
    const rpcClient = new SuiRPCClient();
    
    // Perform health checks on all nodes
    const promises = nodes.map(async (node): Promise<MonitoringResult> => {
      const metrics = await rpcClient.testNode(node.id, node.url);
      return {
        node,
        metrics,
        isBest: false,
        rank: 0,
      };
    });
    
    const results = await Promise.all(promises);
    const rankedResults = rankNodes(results);
    const bestNode = getBestNode(rankedResults);

    return NextResponse.json({
      results: rankedResults,
      bestNode,
      timestamp: Date.now(),
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json(
      { error: 'Failed to check node health' },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      }
    );
  }
}
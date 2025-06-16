import { NextResponse } from 'next/server';
import { NodeMonitor } from '@/app/lib/monitoring';

const monitor = new NodeMonitor();

export async function GET() {
  try {
    // Get latest results or perform a one-time check
    const results = monitor.getLatestResults();
    
    if (results.length === 0) {
      // If no results yet, perform a single check
      await new Promise<void>((resolve) => {
        const unsubscribe = monitor.subscribe((newResults) => {
          if (newResults.length > 0) {
            unsubscribe();
            resolve();
          }
        });
        
        monitor.startMonitoring(); // Uses configuration from environment
        
        // Timeout after 10 seconds
        setTimeout(() => {
          unsubscribe();
          resolve();
        }, 10000);
      });
    }

    const finalResults = monitor.getLatestResults();
    const bestNode = monitor.getBestNode(finalResults);

    return NextResponse.json({
      results: finalResults,
      bestNode,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json(
      { error: 'Failed to check node health' },
      { status: 500 }
    );
  }
}
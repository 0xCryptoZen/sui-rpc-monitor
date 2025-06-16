import { NextRequest } from 'next/server';
import { NodeMonitor } from '@/app/lib/monitoring';

// Create a global monitor instance
let monitor: NodeMonitor | null = null;

export async function GET(request: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Initialize monitor if not already done
      if (!monitor) {
        monitor = new NodeMonitor();
        monitor.startMonitoring(); // Uses configuration from environment
      }

      // Send initial data
      const sendUpdate = (results: any) => {
        const data = `data: ${JSON.stringify({ results, timestamp: Date.now() })}\n\n`;
        controller.enqueue(encoder.encode(data));
      };

      // Subscribe to updates
      const unsubscribe = monitor.subscribe((results) => {
        sendUpdate(results);
      });

      // Send initial results
      const initialResults = monitor.getLatestResults();
      if (initialResults.length > 0) {
        sendUpdate(initialResults);
      }

      // Clean up on close
      request.signal.addEventListener('abort', () => {
        unsubscribe();
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
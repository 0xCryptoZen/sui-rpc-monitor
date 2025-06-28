'use client';

import { useEffect, useState } from 'react';
import { MonitoringResult, RPCNode } from '@/app/types';
import { StatusGrid } from '@/app/components/StatusGrid';

export default function Dashboard() {
  const [nodeResults, setNodeResults] = useState<MonitoringResult[]>([]);
  const [bestNode, setBestNode] = useState<RPCNode | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    const eventSource = new EventSource('/api/monitor');

    eventSource.onopen = () => {
      setIsConnected(true);
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const results = data.results as MonitoringResult[];
        
        setNodeResults(results);
        setLastUpdate(new Date());

        // Find best node
        const best = results.find(r => r.isBest);
        setBestNode(best?.node || null);
      } catch (error) {
        console.error('Failed to parse SSE data:', error);
      }
    };

    eventSource.onerror = () => {
      setIsConnected(false);
      console.error('SSE connection error');
    };

    return () => {
      eventSource.close();
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto p-6">
        <header className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-sui-dark dark:text-white mb-2">
                Sui RPC Monitor
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Real-time monitoring of Sui blockchain RPC nodes
              </p>
            </div>
            <a
              href="/admin"
              className="px-4 py-2 bg-sui-blue text-white rounded-lg hover:bg-sui-teal transition-colors"
            >
              Admin Dashboard
            </a>
          </div>
          
          <div className="mt-4 flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-status-healthy' : 'bg-status-error'} animate-pulse-fast`}></div>
              <span className="text-gray-600 dark:text-gray-400">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            
            {lastUpdate && (
              <div className="text-gray-600 dark:text-gray-400">
                Last update: {lastUpdate.toLocaleTimeString()}
              </div>
            )}
            
            {bestNode && (
              <div className="text-gray-600 dark:text-gray-400">
                Best node: <span className="font-medium text-status-healthy">{bestNode.name}</span>
              </div>
            )}
          </div>
        </header>

        <main>
          <StatusGrid results={nodeResults} bestNode={bestNode} />
        </main>

        <footer className="mt-16 py-6 border-t border-gray-200 dark:border-gray-700">
          <p className="text-center text-sm text-gray-600 dark:text-gray-400">
            Monitoring {nodeResults.length} RPC nodes • Updates every 500ms
          </p>
        </footer>
      </div>
    </div>
  );
}
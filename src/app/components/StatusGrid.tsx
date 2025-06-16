'use client';

import { MonitoringResult, RPCNode } from '@/app/types';
import { NodeCard } from './NodeCard';

interface StatusGridProps {
  results: MonitoringResult[];
  bestNode: RPCNode | null;
}

export function StatusGrid({ results, bestNode }: StatusGridProps) {
  if (results.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sui-blue mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading node status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {results.map(result => (
        <NodeCard 
          key={result.node.id} 
          result={result} 
          isBest={result.node.id === bestNode?.id}
        />
      ))}
    </div>
  );
}
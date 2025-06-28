'use client';

import { MonitoringResult } from '@/app/types';
import { BestNodeBadge } from './BestNodeBadge';

interface NodeCardProps {
  result: MonitoringResult;
  isBest: boolean;
}

export function NodeCard({ result, isBest }: NodeCardProps) {
  const { node, metrics } = result;
  
  const getStatusColor = () => {
    if (!metrics.isHealthy) return 'border-status-error bg-status-error/10';
    if (metrics.errorRate > 10) return 'border-status-warning bg-status-warning/10';
    return 'border-status-healthy bg-status-healthy/10';
  };

  const getStatusText = () => {
    if (!metrics.isHealthy) return 'Offline';
    if (metrics.errorRate > 10) return 'Degraded';
    return 'Healthy';
  };

  const getStatusTextColor = () => {
    if (!metrics.isHealthy) return 'text-status-error';
    if (metrics.errorRate > 10) return 'text-status-warning';
    return 'text-status-healthy';
  };

  return (
    <div className={`relative rounded-lg border-2 p-6 transition-all duration-300 hover:shadow-lg ${getStatusColor()}`}>
      {isBest && <BestNodeBadge />}
      
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-sui-dark dark:text-white">{node.name}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">{node.provider}</p>
        <p className="text-xs text-gray-500 dark:text-gray-500">{node.region}</p>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600 dark:text-gray-400">Status</span>
          <span className={`text-sm font-medium ${getStatusTextColor()}`}>
            {getStatusText()}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600 dark:text-gray-400">Response Time</span>
          <span className="text-sm font-medium">
            {metrics.responseTime}ms
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600 dark:text-gray-400">Stability</span>
          <span className="text-sm font-medium">
            {metrics.stabilityScore}%
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600 dark:text-gray-400">Error Rate</span>
          <span className="text-sm font-medium">
            {metrics.errorRate.toFixed(1)}%
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600 dark:text-gray-400">Success/Error</span>
          <span className="text-sm font-medium">
            {metrics.successCount}/{metrics.errorCount}
          </span>
        </div>
      </div>

      {metrics.lastError && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-status-error truncate">
            Last error: {metrics.lastError}
          </p>
        </div>
      )}
    </div>
  );
}
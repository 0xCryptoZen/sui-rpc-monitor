// Simple cache invalidation system for monitoring
let nodesCacheTimestamp = 0;

export function invalidateNodesCache() {
  nodesCacheTimestamp = Date.now();
  console.log('🔄 Nodes cache invalidated');
}

export function getNodesCacheTimestamp(): number {
  return nodesCacheTimestamp;
}

export function isCacheStale(lastFetch: number, maxAge: number = 30000): boolean {
  return Date.now() - lastFetch > maxAge || lastFetch < nodesCacheTimestamp;
}
import { query, queryOne, transaction } from './database';
import { RPCNode, NodeMetrics } from '@/app/types';

export interface DatabaseSuiNode extends RPCNode {
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CreateSuiNodeData {
  id: string;
  name: string;
  url: string;
  region: string;
  provider: string;
}

export interface UpdateSuiNodeData {
  name?: string;
  url?: string;
  region?: string;
  provider?: string;
  is_active?: boolean;
}

export class SuiNodeService {
  // Get all active nodes
  static async getAllActiveNodes(): Promise<RPCNode[]> {
    const nodes = await query<DatabaseSuiNode>(
      'SELECT id, name, url, region, provider, is_active, created_at, updated_at FROM sui_nodes WHERE is_active = true ORDER BY created_at ASC'
    );
    
    return nodes.map(node => ({
      id: node.id,
      name: node.name,
      url: node.url,
      region: node.region,
      provider: node.provider,
    }));
  }

  // Get all nodes (including inactive)
  static async getAllNodes(): Promise<DatabaseSuiNode[]> {
    return query<DatabaseSuiNode>(
      'SELECT id, name, url, region, provider, is_active, created_at, updated_at FROM sui_nodes ORDER BY created_at ASC'
    );
  }

  // Get node by ID
  static async getNodeById(id: string): Promise<DatabaseSuiNode | null> {
    return queryOne<DatabaseSuiNode>(
      'SELECT id, name, url, region, provider, is_active, created_at, updated_at FROM sui_nodes WHERE id = $1',
      [id]
    );
  }

  // Create new node
  static async createNode(data: CreateSuiNodeData): Promise<DatabaseSuiNode> {
    const nodes = await query<DatabaseSuiNode>(
      `INSERT INTO sui_nodes (id, name, url, region, provider) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING id, name, url, region, provider, is_active, created_at, updated_at`,
      [data.id, data.name, data.url, data.region, data.provider]
    );
    
    if (nodes.length === 0) {
      throw new Error('Failed to create node');
    }
    
    return nodes[0];
  }

  // Update node
  static async updateNode(id: string, data: UpdateSuiNodeData): Promise<DatabaseSuiNode | null> {
    const updates: string[] = [];
    const values: any[] = [];
    let valueIndex = 1;

    if (data.name !== undefined) {
      updates.push(`name = $${valueIndex++}`);
      values.push(data.name);
    }
    if (data.url !== undefined) {
      updates.push(`url = $${valueIndex++}`);
      values.push(data.url);
    }
    if (data.region !== undefined) {
      updates.push(`region = $${valueIndex++}`);
      values.push(data.region);
    }
    if (data.provider !== undefined) {
      updates.push(`provider = $${valueIndex++}`);
      values.push(data.provider);
    }
    if (data.is_active !== undefined) {
      updates.push(`is_active = $${valueIndex++}`);
      values.push(data.is_active);
    }

    if (updates.length === 0) {
      return this.getNodeById(id);
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const nodes = await query<DatabaseSuiNode>(
      `UPDATE sui_nodes SET ${updates.join(', ')} WHERE id = $${valueIndex} 
       RETURNING id, name, url, region, provider, is_active, created_at, updated_at`,
      values
    );

    return nodes.length > 0 ? nodes[0] : null;
  }

  // Delete node
  static async deleteNode(id: string): Promise<boolean> {
    return transaction(async (client) => {
      // First delete related metrics
      await client.query('DELETE FROM node_metrics WHERE node_id = $1', [id]);
      
      // Then delete the node
      const result = await client.query('DELETE FROM sui_nodes WHERE id = $1', [id]);
      
      return (result.rowCount ?? 0) > 0;
    });
  }

  // Soft delete (deactivate) node
  static async deactivateNode(id: string): Promise<boolean> {
    const result = await query(
      'UPDATE sui_nodes SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [id]
    );
    
    return result.length > 0;
  }

  // Activate node
  static async activateNode(id: string): Promise<boolean> {
    const result = await query(
      'UPDATE sui_nodes SET is_active = true, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING id',
      [id]
    );
    
    return result.length > 0;
  }

  // Check if node ID exists
  static async nodeExists(id: string): Promise<boolean> {
    const result = await queryOne<{ count: string }>(
      'SELECT COUNT(*) as count FROM sui_nodes WHERE id = $1',
      [id]
    );
    
    return parseInt(result?.count || '0') > 0;
  }

  // Validate node URL format
  static validateNodeUrl(url: string): boolean {
    try {
      const parsedUrl = new URL(url);
      return parsedUrl.protocol === 'https:' || parsedUrl.protocol === 'http:';
    } catch {
      return false;
    }
  }

  // Store node metrics with node existence check
  static async storeMetrics(nodeId: string, metrics: NodeMetrics): Promise<void> {
    try {
      await query(
        `INSERT INTO node_metrics (node_id, timestamp, response_time, is_healthy, error_rate, stability_score, last_error, success_count, error_count)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          nodeId,
          new Date(metrics.timestamp),
          metrics.responseTime,
          metrics.isHealthy,
          metrics.errorRate,
          metrics.stabilityScore,
          metrics.lastError || null,
          metrics.successCount,
          metrics.errorCount,
        ]
      );
    } catch (error: any) {
      // If foreign key constraint error, node doesn't exist - skip metrics storage
      if (error.code === '23503') {
        console.warn(`Node ${nodeId} not found in database, skipping metrics storage`);
        return;
      }
      throw error;
    }
  }

  // Get historical metrics for a node
  static async getNodeMetrics(nodeId: string, limit: number = 100): Promise<NodeMetrics[]> {
    const metrics = await query<any>(
      `SELECT node_id, EXTRACT(EPOCH FROM timestamp) * 1000 as timestamp, response_time, is_healthy, 
              error_rate, stability_score, last_error, success_count, error_count
       FROM node_metrics 
       WHERE node_id = $1 
       ORDER BY timestamp DESC 
       LIMIT $2`,
      [nodeId, limit]
    );

    return metrics.map(m => ({
      nodeId: m.node_id,
      timestamp: parseInt(m.timestamp),
      responseTime: m.response_time,
      isHealthy: m.is_healthy,
      errorRate: parseFloat(m.error_rate),
      stabilityScore: parseFloat(m.stability_score),
      lastError: m.last_error,
      successCount: m.success_count,
      errorCount: m.error_count,
    }));
  }

  // Clean old metrics (keep last 24 hours)
  static async cleanOldMetrics(): Promise<void> {
    await query(
      'DELETE FROM node_metrics WHERE timestamp < NOW() - INTERVAL \'24 hours\''
    );
  }

  // Sync nodes from configuration to database (only add missing ones, don't restore deleted)
  static async syncNodesToDatabase(nodes: RPCNode[]): Promise<void> {
    for (const node of nodes) {
      try {
        const exists = await this.nodeExists(node.id);
        if (!exists) {
          await this.createNode({
            id: node.id,
            name: node.name,
            url: node.url,
            region: node.region,
            provider: node.provider,
          });
          console.log(`✓ Created missing node in database: ${node.id}`);
        }
      } catch (error) {
        console.error(`✗ Failed to sync node ${node.id} to database:`, error);
      }
    }
  }

  // Force sync all default nodes (used for initial setup)
  static async forceInitializeDefaultNodes(nodes: RPCNode[]): Promise<void> {
    console.log('Force initializing default nodes...');
    for (const node of nodes) {
      try {
        const exists = await this.nodeExists(node.id);
        if (!exists) {
          await this.createNode({
            id: node.id,
            name: node.name,
            url: node.url,
            region: node.region,
            provider: node.provider,
          });
          console.log(`✓ Force created node: ${node.id}`);
        } else {
          console.log(`✓ Node already exists: ${node.id}`);
        }
      } catch (error) {
        console.error(`✗ Failed to force create node ${node.id}:`, error);
      }
    }
  }
}
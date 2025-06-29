import { NextRequest, NextResponse } from 'next/server';
import { SuiNodeService } from '@/app/lib/sui-nodes';
import { DEFAULT_RPC_NODES } from '@/app/lib/nodes-config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Only add default nodes that don't already exist (respects deletions)
    let addedCount = 0;
    for (const node of DEFAULT_RPC_NODES) {
      const exists = await SuiNodeService.nodeExists(node.id);
      if (!exists) {
        await SuiNodeService.createNode({
          id: node.id,
          name: node.name,
          url: node.url,
          region: node.region,
          provider: node.provider,
        });
        addedCount++;
        console.log(`➕ Added missing default node: ${node.id}`);
      } else {
        console.log(`✓ Default node already exists: ${node.id}`);
      }
    }
    
    // Get current nodes count
    const nodes = await SuiNodeService.getAllNodes();
    
    return NextResponse.json({
      success: true,
      message: `Added ${addedCount} missing default nodes (${DEFAULT_RPC_NODES.length - addedCount} already existed)`,
      addedNodes: addedCount,
      totalNodesInDatabase: nodes.length,
      activeNodes: nodes.filter(n => n.is_active).length,
    });
  } catch (error) {
    console.error('Failed to sync nodes:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to sync nodes to database',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const nodes = await SuiNodeService.getAllNodes();
    
    return NextResponse.json({
      success: true,
      nodes: nodes,
      totalNodes: nodes.length,
      activeNodes: nodes.filter(n => n.is_active).length,
    });
  } catch (error) {
    console.error('Failed to get nodes:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get nodes from database',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { SuiNodeService } from '@/app/lib/sui-nodes';
import { getRPCNodes } from '@/app/lib/config';

export async function GET(request: NextRequest) {
  try {
    // Get nodes from different sources
    const [dbNodes, activeNodes, configNodes] = await Promise.all([
      SuiNodeService.getAllNodes(),
      SuiNodeService.getAllActiveNodes(),
      getRPCNodes()
    ]);

    return NextResponse.json({
      success: true,
      data: {
        databaseNodes: {
          total: dbNodes.length,
          active: dbNodes.filter(n => n.is_active).length,
          inactive: dbNodes.filter(n => !n.is_active).length,
          nodes: dbNodes
        },
        activeNodesFromService: {
          count: activeNodes.length,
          nodes: activeNodes
        },
        configNodes: {
          count: configNodes.length,
          nodes: configNodes
        }
      }
    });
  } catch (error) {
    console.error('Debug nodes error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get debug information',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
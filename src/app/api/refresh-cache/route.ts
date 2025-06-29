import { NextRequest, NextResponse } from 'next/server';
import { invalidateNodesCache } from '@/app/lib/cache';
import { getRPCNodes } from '@/app/lib/config';

export async function POST(request: NextRequest) {
  try {
    // Force invalidate cache
    invalidateNodesCache();
    
    // Get fresh nodes to verify
    const nodes = await getRPCNodes();
    
    return NextResponse.json({
      success: true,
      message: 'Cache refreshed successfully',
      nodeCount: nodes.length,
      nodes: nodes.map(n => ({ id: n.id, name: n.name }))
    });
  } catch (error) {
    console.error('Failed to refresh cache:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to refresh cache',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
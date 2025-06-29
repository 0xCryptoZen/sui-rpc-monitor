import { NextRequest, NextResponse } from 'next/server';
import { SuiNodeService, UpdateSuiNodeData } from '@/app/lib/sui-nodes';
import { invalidateNodesCache } from '@/app/lib/cache';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const node = await SuiNodeService.getNodeById(params.id);
    
    if (!node) {
      return NextResponse.json(
        { error: 'Node not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(node);
  } catch (error) {
    console.error('Failed to fetch node:', error);
    return NextResponse.json(
      { error: 'Failed to fetch node' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data: UpdateSuiNodeData = await request.json();

    // Validate URL if provided
    if (data.url && !SuiNodeService.validateNodeUrl(data.url)) {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    const node = await SuiNodeService.updateNode(params.id, data);
    
    if (!node) {
      return NextResponse.json(
        { error: 'Node not found' },
        { status: 404 }
      );
    }
    
    // Invalidate cache so monitoring picks up changes
    invalidateNodesCache();
    
    return NextResponse.json(node);
  } catch (error) {
    console.error('Failed to update node:', error);
    return NextResponse.json(
      { error: 'Failed to update node' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const success = await SuiNodeService.deleteNode(params.id);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Node not found' },
        { status: 404 }
      );
    }
    
    // Invalidate cache so monitoring stops tracking deleted node
    invalidateNodesCache();
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete node:', error);
    return NextResponse.json(
      { error: 'Failed to delete node' },
      { status: 500 }
    );
  }
}
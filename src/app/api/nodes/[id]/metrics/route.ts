import { NextRequest, NextResponse } from 'next/server';
import { SuiNodeService } from '@/app/lib/sui-nodes';

export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    
    // Validate limit
    if (limit < 1 || limit > 1000) {
      return NextResponse.json(
        { error: 'Limit must be between 1 and 1000' },
        { status: 400 }
      );
    }

    const metrics = await SuiNodeService.getNodeMetrics(params.id, limit);
    
    return NextResponse.json({
      nodeId: params.id,
      metrics,
      count: metrics.length,
    });
  } catch (error) {
    console.error('Failed to fetch node metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch node metrics' },
      { status: 500 }
    );
  }
}
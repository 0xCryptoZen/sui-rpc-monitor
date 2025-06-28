import { NextRequest, NextResponse } from 'next/server';
import { getRPCNodesStatic } from '@/app/lib/config-simple';

export async function GET() {
  try {
    const nodes = getRPCNodesStatic();
    return NextResponse.json(nodes, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  } catch (error) {
    console.error('Failed to fetch nodes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch nodes' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return NextResponse.json(
    { error: 'Database features not available in static build' },
    { status: 501 }
  );
}
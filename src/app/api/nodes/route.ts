import { NextRequest, NextResponse } from 'next/server';
import { SuiNodeService, CreateSuiNodeData, UpdateSuiNodeData } from '@/app/lib/sui-nodes';

export async function GET() {
  try {
    const nodes = await SuiNodeService.getAllNodes();
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
  try {
    const data: CreateSuiNodeData = await request.json();

    // Validate required fields
    if (!data.id || !data.name || !data.url || !data.region || !data.provider) {
      return NextResponse.json(
        { error: 'Missing required fields: id, name, url, region, provider' },
        { status: 400 }
      );
    }

    // Validate URL format
    if (!SuiNodeService.validateNodeUrl(data.url)) {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    // Check if node ID already exists
    const exists = await SuiNodeService.nodeExists(data.id);
    if (exists) {
      return NextResponse.json(
        { error: 'Node ID already exists' },
        { status: 409 }
      );
    }

    const node = await SuiNodeService.createNode(data);
    return NextResponse.json(node, { status: 201 });
  } catch (error) {
    console.error('Failed to create node:', error);
    return NextResponse.json(
      { error: 'Failed to create node' },
      { status: 500 }
    );
  }
}
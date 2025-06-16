import { NextResponse } from 'next/server';
import { getRPCNodes } from '@/app/lib/config';

export const runtime = 'edge';

export async function GET() {
  return NextResponse.json(getRPCNodes(), {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
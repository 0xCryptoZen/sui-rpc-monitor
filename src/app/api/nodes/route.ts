import { NextResponse } from 'next/server';
import { getRPCNodes } from '@/app/lib/config';

export async function GET() {
  return NextResponse.json(getRPCNodes());
}
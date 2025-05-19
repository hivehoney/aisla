import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Try to query something simple from the database
    await prisma.$queryRaw`SELECT 1`;
    
    return NextResponse.json({ 
      status: 'connected',
      message: 'Database is connected'
    });
  } catch (error) {
    console.error('Database connection error:', error);
    
    return NextResponse.json({ 
      status: 'error',
      message: 'Database connection failed',
      error: error.message
    }, { status: 503 });
  }
} 
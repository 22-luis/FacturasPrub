
import prisma from '@/lib/prisma';
import { NextResponse, type NextRequest } from 'next/server';
import type { Client } from '@prisma/client';

// GET all clients
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const clients = await prisma.client.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        branches: true, // Include branches if you want to return them
      }
    });
    return NextResponse.json(clients);
  } catch (error) {
    console.error('Failed to fetch clients:', error);
    return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 });
  }
}

// POST create a new client
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const data = await request.json();
    const { name, phone, mainAddress } = data;

    if (!name) {
      return NextResponse.json({ error: 'Client name is required' }, { status: 400 });
    }

    const newClient = await prisma.client.create({
      data: {
        name,
        phone,
        mainAddress,
        // branches: If you handle branch creation here, you'd use a nested write.
        // For simplicity, branches might be managed via a separate endpoint or client-side logic.
      },
    });
    return NextResponse.json(newClient, { status: 201 });
  } catch (error: any) {
    console.error('Failed to create client:', error);
    if (error.code === 'P2002' && error.meta?.target?.includes('name')) {
        return NextResponse.json({ error: 'A client with this name already exists.' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to create client' }, { status: 500 });
  }
}

    
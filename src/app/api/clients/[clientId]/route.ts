
import prisma from '@/lib/prisma';
import { NextResponse, type NextRequest } from 'next/server';
import type { Client } from '@prisma/client';

type RouteContext = { params: { clientId: string } };

// GET a single client by ID
export async function GET(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  const { clientId } = context.params;
  try {
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      include: {
        branches: true,
      },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }
    return NextResponse.json(client);
  } catch (error) {
    console.error(`Failed to fetch client ${clientId}:`, error);
    return NextResponse.json({ error: 'Failed to fetch client' }, { status: 500 });
  }
}

// PUT update a client by ID
export async function PUT(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  const { clientId } = context.params;
  try {
    const data = await request.json();
    const { name, phone, mainAddress } = data; // branches are not updated here for simplicity

    if (!name) {
        return NextResponse.json({ error: 'Client name is required' }, { status: 400 });
    }

    const updatedClient = await prisma.client.update({
      where: { id: clientId },
      data: {
        name,
        phone,
        mainAddress,
      },
    });
    return NextResponse.json(updatedClient);
  } catch (error: any) {
    console.error(`Failed to update client ${clientId}:`, error);
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }
    if (error.code === 'P2002' && error.meta?.target?.includes('name')) {
        // Check if the name conflict is with another client
        const existingClient = await prisma.client.findFirst({ where: { name, id: { not: clientId } } });
        if (existingClient) {
            return NextResponse.json({ error: 'Another client with this name already exists.' }, { status: 409 });
        }
    }
    return NextResponse.json({ error: 'Failed to update client' }, { status: 500 });
  }
}

// DELETE a client by ID
export async function DELETE(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  const { clientId } = context.params;
  try {
    // Before deleting a client, you might need to handle related records (e.g., invoices, branches)
    // Option 1: Disassociate (set clientId to null on related invoices, delete branches)
    // Option 2: Cascade delete (if your Prisma schema is set up for it)
    // Option 3: Prevent deletion if related records exist

    // For simplicity, we'll disassociate invoices and delete branches manually for now.
    await prisma.invoice.updateMany({
        where: { clientId: clientId },
        data: { clientId: null }
    });
    // If Branch model has a relation to Client, Prisma might handle cascade delete or you need to delete them first.
    // await prisma.branch.deleteMany({ where: { clientId: clientId }}); // If you have a Branch model

    await prisma.client.delete({
      where: { id: clientId },
    });
    return NextResponse.json({ message: 'Client deleted successfully' }, { status: 200 });
  } catch (error: any) {
    console.error(`Failed to delete client ${clientId}:`, error);
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }
    // Handle other potential errors, e.g., foreign key constraints if not handled above
    return NextResponse.json({ error: 'Failed to delete client' }, { status: 500 });
  }
}

    
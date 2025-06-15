import prisma from '@/lib/prisma';
import { NextResponse, type NextRequest } from 'next/server';
import type { InvoiceStatus } from '@prisma/client';

type RouteContext = { params: Promise<{ invoiceId: string }> };

// GET a single invoice by ID
export async function GET(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  const params = await context.params;
  const invoiceId = params.invoiceId;

  if (!invoiceId) {
    return NextResponse.json({ error: 'Missing invoiceId' }, { status: 400 });
  }

  try {
    const invoiceFromDb = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!invoiceFromDb) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    return NextResponse.json({
      ...invoiceFromDb,
      totalAmount: Number(invoiceFromDb.totalAmount),
    });
  } catch (error) {
    console.error(`Failed to fetch invoice ${invoiceId}:`, error);
    return NextResponse.json({ error: 'Failed to fetch invoice' }, { status: 500 });
  }
}

// PUT update an invoice by ID
export async function PUT(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  const params = await context.params;
  const invoiceId = params.invoiceId;

  if (!invoiceId) {
    return NextResponse.json({ error: 'Missing invoiceId' }, { status: 400 });
  }

  try {
    const data = await request.json();
    const {
      invoiceNumber,
      date,
      totalAmount,
      supplierName,
      uniqueCode,
      address,
      status,
      cancellationReason,
      assigneeId,
    } = data;

    const updateData: Partial<typeof data> = {};
    if (invoiceNumber) updateData.invoiceNumber = invoiceNumber;
    if (date) updateData.date = new Date(date);
    if (totalAmount !== undefined) updateData.totalAmount = totalAmount;
    if (supplierName) updateData.supplierName = supplierName;
    if (uniqueCode) updateData.uniqueCode = uniqueCode;
    if (address) updateData.address = address;
    if (status) {
      if (!['PENDIENTE', 'ENTREGADA', 'CANCELADA'].includes(status)) {
        return NextResponse.json({ error: 'Invalid invoice status' }, { status: 400 });
      }
      updateData.status = status as InvoiceStatus;
    }
    if (cancellationReason) updateData.cancellationReason = cancellationReason;
    if (assigneeId) updateData.assigneeId = assigneeId;

    const updatedInvoiceFromDb = await prisma.invoice.update({
      where: { id: invoiceId },
      data: updateData,
    });

    return NextResponse.json({
      ...updatedInvoiceFromDb,
      totalAmount: Number(updatedInvoiceFromDb.totalAmount),
    });
  } catch (error: any) {
    console.error(`Failed to update invoice ${invoiceId}:`, error);
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }
    if (error.code === 'P2002') {
      const field = error.meta?.target?.join(', ') ?? 'field';
      return NextResponse.json({ error: `Invoice with this ${field} already exists.` }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to update invoice' }, { status: 500 });
  }
}

// DELETE an invoice by ID
export async function DELETE(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  const params = await context.params;
  const invoiceId = params.invoiceId;

  if (!invoiceId) {
    return NextResponse.json({ error: 'Missing invoiceId' }, { status: 400 });
  }

  try {
    await prisma.invoice.delete({ where: { id: invoiceId } });
    return NextResponse.json({ message: 'Invoice deleted successfully' }, { status: 200 });
  } catch (error: any) {
    console.error(`Failed to delete invoice ${invoiceId}:`, error);
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to delete invoice' }, { status: 500 });
  }
}

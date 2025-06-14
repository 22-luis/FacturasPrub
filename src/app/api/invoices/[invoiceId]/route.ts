
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import type { InvoiceStatus } from '@prisma/client';

// GET a single invoice by ID
export async function GET(
  request: Request,
  { params }: { params: { invoiceId: string } }
): Promise<NextResponse> {
  try {
    const { invoiceId } = params;
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
    const invoice = {
      ...invoiceFromDb,
      totalAmount: Number(invoiceFromDb.totalAmount), // Convert Decimal to Number
    };
    return NextResponse.json(invoice);
  } catch (error) {
    console.error(`Failed to fetch invoice ${params.invoiceId}:`, error);
    return NextResponse.json({ error: 'Failed to fetch invoice' }, { status: 500 });
  }
}

// PUT update an invoice by ID
export async function PUT(
  request: Request,
  { params }: { params: { invoiceId: string } }
): Promise<NextResponse> {
  try {
    const { invoiceId } = params;
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

    const updateData: any = {};
    if (invoiceNumber !== undefined) updateData.invoiceNumber = invoiceNumber;
    if (date !== undefined) updateData.date = new Date(date);
    if (totalAmount !== undefined) updateData.totalAmount = totalAmount;
    if (supplierName !== undefined) updateData.supplierName = supplierName;
    if (uniqueCode !== undefined) updateData.uniqueCode = uniqueCode;
    if (address !== undefined) updateData.address = address;
    if (status !== undefined) {
        if (!['PENDIENTE', 'ENTREGADA', 'CANCELADA'].includes(status)) {
            return NextResponse.json({ error: 'Invalid invoice status' }, { status: 400 });
        }
        updateData.status = status as InvoiceStatus;
    }
    if (cancellationReason !== undefined) updateData.cancellationReason = cancellationReason;
    if (assigneeId !== undefined) updateData.assigneeId = assigneeId;


    const updatedInvoiceFromDb = await prisma.invoice.update({
      where: { id: invoiceId },
      data: updateData,
    });

    const updatedInvoice = {
      ...updatedInvoiceFromDb,
      totalAmount: Number(updatedInvoiceFromDb.totalAmount), // Convert Decimal to Number
    };

    return NextResponse.json(updatedInvoice);
  } catch (error: any) {
    console.error(`Failed to update invoice ${params.invoiceId}:`, error);
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }
    if (error.code === 'P2002') {
      return NextResponse.json({ error: `Invoice with this ${error.meta?.target?.join(', ')} already exists.` }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to update invoice' }, { status: 500 });
  }
}

// DELETE an invoice by ID
export async function DELETE(
  request: Request,
  { params }: { params: { invoiceId: string } }
): Promise<NextResponse> {
  try {
    const { invoiceId } = params;
    await prisma.invoice.delete({
      where: { id: invoiceId },
    });
    return NextResponse.json({ message: 'Invoice deleted successfully' }, { status: 200 });
  } catch (error: any) {
    console.error(`Failed to delete invoice ${params.invoiceId}:`, error);
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to delete invoice' }, { status: 500 });
  }
}

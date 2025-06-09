
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import type { InvoiceStatus } from '@prisma/client';

// GET all invoices
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as InvoiceStatus | null;
    const assigneeId = searchParams.get('assigneeId');

    const whereClause: any = {};
    if (status) {
      whereClause.status = status;
    }
    if (assigneeId) {
      whereClause.assigneeId = assigneeId;
    }
    // Add more filters like date range, supplierName, etc. as needed

    const invoicesFromDb = await prisma.invoice.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
    const invoices = invoicesFromDb.map(invoice => ({
      ...invoice,
      totalAmount: Number(invoice.totalAmount), // Convert Decimal to Number
    }));
    return NextResponse.json(invoices);
  } catch (error) {
    console.error('Failed to fetch invoices:', error);
    return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 });
  }
}

// POST create a new invoice
export async function POST(request: Request) {
  try {
    const data = await request.json();
    const {
      invoiceNumber,
      date, // Expected as ISO string (YYYY-MM-DD or full ISO 8601)
      totalAmount, // Expected as number
      supplierName,
      uniqueCode,
      address,
      status, // Expected as 'PENDIENTE', 'ENTREGADA', 'CANCELADA'
      cancellationReason,
      assigneeId,
    } = data;

    if (!invoiceNumber || !date || totalAmount === undefined || !supplierName || !uniqueCode || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (status && !['PENDIENTE', 'ENTREGADA', 'CANCELADA'].includes(status)) {
        return NextResponse.json({ error: 'Invalid invoice status' }, { status: 400 });
    }
    
    const newInvoiceFromDb = await prisma.invoice.create({
      data: {
        invoiceNumber,
        date: new Date(date), // Prisma expects DateTime
        totalAmount, // Prisma will handle Decimal conversion from number
        supplierName,
        uniqueCode,
        address,
        status: status as InvoiceStatus,
        cancellationReason,
        assigneeId: assigneeId || null, // Ensure it's null if undefined/empty
      },
    });
    const newInvoice = {
      ...newInvoiceFromDb,
      totalAmount: Number(newInvoiceFromDb.totalAmount), // Convert Decimal to Number
    };
    return NextResponse.json(newInvoice, { status: 201 });
  } catch (error: any) {
    console.error('Failed to create invoice:', error);
    if (error.code === 'P2002') { // Prisma unique constraint violation
      return NextResponse.json({ error: `Invoice with this ${error.meta?.target?.join(', ')} already exists.` }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 });
  }
}


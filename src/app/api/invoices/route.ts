
import prisma from '@/lib/prisma';
import { NextResponse, type NextRequest } from 'next/server';
import type { InvoiceStatus } from '@prisma/client';

// GET all invoices
export async function GET(request: NextRequest): Promise<NextResponse> {
  const requestUrl = request.nextUrl.pathname + request.nextUrl.search;
  console.log(`API Route Handler: GET ${requestUrl}`);

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
      totalAmount: Number(invoice.totalAmount),
    }));
    console.log(`API Route Success: GET ${requestUrl} - Fetched ${invoices.length} invoices.`);
    return NextResponse.json(invoices);
  } catch (error) {
    console.error(`API Route Handler ERROR: GET ${requestUrl}`, error);
    return NextResponse.json({ error: 'Failed to fetch invoices due to an unexpected error' }, { status: 500 });
  }
}

// POST create a new invoice
export async function POST(request: NextRequest): Promise<NextResponse> {
  const requestUrl = request.nextUrl.pathname + request.nextUrl.search;
  let requestBodyForLog: any = "Could not clone or parse body";

  try {
    const tempRequest = request.clone();
    requestBodyForLog = await tempRequest.json().catch(() => "Non-JSON or empty body");
  } catch (e) {
    // Silently ignore
  }
  console.log(`API Route Handler: POST ${requestUrl}`, { body: requestBodyForLog });

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

    if (!invoiceNumber || !date || totalAmount === undefined || !supplierName || !uniqueCode || !status) {
      console.warn(`API Route Validation: POST ${requestUrl} - Missing required fields.`);
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (status && !['PENDIENTE', 'ENTREGADA', 'CANCELADA'].includes(status)) {
        console.warn(`API Route Validation: POST ${requestUrl} - Invalid invoice status: ${status}`);
        return NextResponse.json({ error: 'Invalid invoice status' }, { status: 400 });
    }
    
    const newInvoiceFromDb = await prisma.invoice.create({
      data: {
        invoiceNumber,
        date: new Date(date),
        totalAmount,
        supplierName,
        uniqueCode,
        address,
        status: status as InvoiceStatus,
        cancellationReason,
        assigneeId: assigneeId || null,
      },
    });
    const newInvoice = {
      ...newInvoiceFromDb,
      totalAmount: Number(newInvoiceFromDb.totalAmount),
    };
    console.log(`API Route Success: POST ${requestUrl} - Created invoice with ID: ${newInvoice.id}`);
    return NextResponse.json(newInvoice, { status: 201 });
  } catch (error: any) {
    console.error(`API Route Handler ERROR: POST ${requestUrl}`, error);
    if (error.code === 'P2002') {
      console.warn(`API Route DB: POST ${requestUrl} - Unique constraint violation.`, error.meta);
      return NextResponse.json({ error: `Invoice with this ${error.meta?.target?.join(', ')} already exists.` }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to create invoice due to an unexpected error' }, { status: 500 });
  }
}

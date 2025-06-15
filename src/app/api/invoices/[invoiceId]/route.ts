
import prisma from '@/lib/prisma';
import { NextResponse, type NextRequest } from 'next/server';
import type { InvoiceStatus } from '@prisma/client';
import type { ApiRouteContext } from '@/lib/types';

// Define the specific context type for this route
type InvoiceIdRouteContext = ApiRouteContext<{ invoiceId: string }>;

// GET a single invoice by ID
export async function GET(
  request: NextRequest,
  context: InvoiceIdRouteContext
): Promise<NextResponse> {
  const requestUrl = request.nextUrl.pathname + request.nextUrl.search;
  const { invoiceId } = context.params;
  console.log(`API Route Handler: GET ${requestUrl}`, { params: context.params });

  try {
    if (!invoiceId) {
      console.warn(`API Route Validation: GET ${requestUrl} - invoiceId parameter is missing.`);
      return NextResponse.json({ error: 'Invoice ID is required' }, { status: 400 });
    }

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
      console.warn(`API Route DB: GET ${requestUrl} - Invoice not found: ${invoiceId}`);
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }
    const invoice = {
      ...invoiceFromDb,
      totalAmount: Number(invoiceFromDb.totalAmount),
    };
    console.log(`API Route Success: GET ${requestUrl} - Fetched invoice: ${invoiceId}`);
    return NextResponse.json(invoice);
  } catch (error) {
    console.error(`API Route Handler ERROR: GET ${requestUrl} (params: ${JSON.stringify(context.params)})`, error);
    return NextResponse.json({ error: 'Failed to fetch invoice due to an unexpected error' }, { status: 500 });
  }
}

// PUT update an invoice by ID
export async function PUT(
  request: NextRequest,
  context: InvoiceIdRouteContext
): Promise<NextResponse> {
  const requestUrl = request.nextUrl.pathname + request.nextUrl.search;
  const { invoiceId } = context.params;
  let requestBodyForLog: any = "Could not clone or parse body";

  try {
    const tempRequest = request.clone();
    requestBodyForLog = await tempRequest.json().catch(() => "Non-JSON or empty body");
  } catch (e) {
    // Silently ignore
  }
  console.log(`API Route Handler: PUT ${requestUrl}`, { params: context.params, body: requestBodyForLog });

  try {
    if (!invoiceId) { // This check is technically redundant if routing works as expected
      console.warn(`API Route Validation: PUT ${requestUrl} - invoiceId parameter is missing.`);
      return NextResponse.json({ error: 'Invoice ID is required' }, { status: 400 });
    }
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
            console.warn(`API Route Validation: PUT ${requestUrl} - Invalid invoice status: ${status}`);
            return NextResponse.json({ error: 'Invalid invoice status' }, { status: 400 });
        }
        updateData.status = status as InvoiceStatus;
    }
    if (cancellationReason !== undefined) updateData.cancellationReason = cancellationReason;
    
    // Handle assigneeId: allow setting to null for unassignment, or a valid string ID
    if (assigneeId !== undefined) {
        updateData.assigneeId = assigneeId === null || assigneeId === '' ? null : assigneeId;
    }


    const updatedInvoiceFromDb = await prisma.invoice.update({
      where: { id: invoiceId },
      data: updateData,
    });

    const updatedInvoice = {
      ...updatedInvoiceFromDb,
      totalAmount: Number(updatedInvoiceFromDb.totalAmount),
    };
    console.log(`API Route Success: PUT ${requestUrl} - Updated invoice: ${invoiceId}`);
    return NextResponse.json(updatedInvoice);
  } catch (error: any) {
    console.error(`API Route Handler ERROR: PUT ${requestUrl} (params: ${JSON.stringify(context.params)})`, error);
    if (error.code === 'P2025') {
      console.warn(`API Route DB: PUT ${requestUrl} - Invoice not found for update: ${invoiceId}`);
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }
    if (error.code === 'P2002') {
      console.warn(`API Route DB: PUT ${requestUrl} - Unique constraint violation for invoice: ${invoiceId}`, error.meta);
      return NextResponse.json({ error: `Invoice with this ${error.meta?.target?.join(', ')} already exists.` }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to update invoice due to an unexpected error' }, { status: 500 });
  }
}

// DELETE an invoice by ID
export async function DELETE(
  request: NextRequest,
  context: InvoiceIdRouteContext
): Promise<NextResponse> {
  const requestUrl = request.nextUrl.pathname + request.nextUrl.search;
  const { invoiceId } = context.params;
  console.log(`API Route Handler: DELETE ${requestUrl}`, { params: context.params });
  try {
    if (!invoiceId) { // This check is technically redundant
      console.warn(`API Route Validation: DELETE ${requestUrl} - invoiceId parameter is missing.`);
      return NextResponse.json({ error: 'Invoice ID is required' }, { status: 400 });
    }
    await prisma.invoice.delete({
      where: { id: invoiceId },
    });
    console.log(`API Route Success: DELETE ${requestUrl} - Deleted invoice: ${invoiceId}`);
    return NextResponse.json({ message: 'Invoice deleted successfully' }, { status: 200 });
  } catch (error: any) {
    console.error(`API Route Handler ERROR: DELETE ${requestUrl} (params: ${JSON.stringify(context.params)})`, error);
    if (error.code === 'P2025') {
      console.warn(`API Route DB: DELETE ${requestUrl} - Invoice not found for deletion: ${invoiceId}`);
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to delete invoice due to an unexpected error' }, { status: 500 });
  }
}

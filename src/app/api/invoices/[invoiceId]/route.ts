import prisma from '@/lib/prisma';
import { NextResponse, type NextRequest } from 'next/server';
import type { InvoiceStatus } from '@prisma/client';
import type { ApiRouteContext } from '@/lib/types';

// Define the specific context type for this route
type InvoiceIdRouteContext = ApiRouteContext<{ invoiceId: string }>;

type RouteContext = { params: Promise<{ invoiceId: string }> };

// GET a single invoice by ID
export async function GET(
  request: NextRequest,
<<<<<<< HEAD
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

=======
  context: RouteContext
): Promise<NextResponse> {
  const params = await context.params;
  const invoiceId = params.invoiceId;

  if (!invoiceId) {
    return NextResponse.json({ error: 'Missing invoiceId' }, { status: 400 });
  }

  try {
>>>>>>> b680365fc645e4daa952198f33a43750003cf941
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

    return NextResponse.json({
      ...invoiceFromDb,
      totalAmount: Number(invoiceFromDb.totalAmount),
<<<<<<< HEAD
    };
    console.log(`API Route Success: GET ${requestUrl} - Fetched invoice: ${invoiceId}`);
    return NextResponse.json(invoice);
  } catch (error) {
    console.error(`API Route Handler ERROR: GET ${requestUrl} (params: ${JSON.stringify(context.params)})`, error);
    return NextResponse.json({ error: 'Failed to fetch invoice due to an unexpected error' }, { status: 500 });
=======
    });
  } catch (error) {
    console.error(`Failed to fetch invoice ${invoiceId}:`, error);
    return NextResponse.json({ error: 'Failed to fetch invoice' }, { status: 500 });
>>>>>>> b680365fc645e4daa952198f33a43750003cf941
  }
}

// PUT update an invoice by ID
export async function PUT(
  request: NextRequest,
<<<<<<< HEAD
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
=======
  context: RouteContext
): Promise<NextResponse> {
  const params = await context.params;
  const invoiceId = params.invoiceId;

  if (!invoiceId) {
    return NextResponse.json({ error: 'Missing invoiceId' }, { status: 400 });
  }

  try {
>>>>>>> b680365fc645e4daa952198f33a43750003cf941
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
<<<<<<< HEAD
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

=======
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
>>>>>>> b680365fc645e4daa952198f33a43750003cf941

    const updatedInvoiceFromDb = await prisma.invoice.update({
      where: { id: invoiceId },
      data: updateData,
    });

    return NextResponse.json({
      ...updatedInvoiceFromDb,
      totalAmount: Number(updatedInvoiceFromDb.totalAmount),
<<<<<<< HEAD
    };
    console.log(`API Route Success: PUT ${requestUrl} - Updated invoice: ${invoiceId}`);
    return NextResponse.json(updatedInvoice);
  } catch (error: any) {
    console.error(`API Route Handler ERROR: PUT ${requestUrl} (params: ${JSON.stringify(context.params)})`, error);
=======
    });
  } catch (error: any) {
    console.error(`Failed to update invoice ${invoiceId}:`, error);
>>>>>>> b680365fc645e4daa952198f33a43750003cf941
    if (error.code === 'P2025') {
      console.warn(`API Route DB: PUT ${requestUrl} - Invoice not found for update: ${invoiceId}`);
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }
    if (error.code === 'P2002') {
<<<<<<< HEAD
      console.warn(`API Route DB: PUT ${requestUrl} - Unique constraint violation for invoice: ${invoiceId}`, error.meta);
      return NextResponse.json({ error: `Invoice with this ${error.meta?.target?.join(', ')} already exists.` }, { status: 409 });
=======
      const field = error.meta?.target?.join(', ') ?? 'field';
      return NextResponse.json({ error: `Invoice with this ${field} already exists.` }, { status: 409 });
>>>>>>> b680365fc645e4daa952198f33a43750003cf941
    }
    return NextResponse.json({ error: 'Failed to update invoice due to an unexpected error' }, { status: 500 });
  }
}

// DELETE an invoice by ID
export async function DELETE(
  request: NextRequest,
<<<<<<< HEAD
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
=======
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
>>>>>>> b680365fc645e4daa952198f33a43750003cf941
    if (error.code === 'P2025') {
      console.warn(`API Route DB: DELETE ${requestUrl} - Invoice not found for deletion: ${invoiceId}`);
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to delete invoice due to an unexpected error' }, { status: 500 });
  }
}

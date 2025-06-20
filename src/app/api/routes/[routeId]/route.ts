
import prisma from '@/lib/prisma';
import { NextResponse, type NextRequest } from 'next/server';
import type { Route as PrismaRoute, RouteStatus as PrismaRouteStatus } from '@prisma/client';

type RouteContext = { params: { routeId: string } };

// GET a single route by ID
export async function GET(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  const { routeId } = context.params;
  try {
    const route = await prisma.route.findUnique({
      where: { id: routeId },
      include: {
        repartidor: { select: { id: true, name: true }},
        // invoices: true, // If you have a direct relation in Prisma
      }
    });

    if (!route) {
      return NextResponse.json({ error: 'Route not found' }, { status: 404 });
    }
    return NextResponse.json(route);
  } catch (error) {
    console.error(`Failed to fetch route ${routeId}:`, error);
    return NextResponse.json({ error: 'Failed to fetch route' }, { status: 500 });
  }
}

// PUT update a route by ID
export async function PUT(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  const { routeId } = context.params;
  try {
    const data = await request.json();
    const { date, repartidorId, invoiceIds, status } = data;

    const updateData: any = {};
    if (date) updateData.date = new Date(date);
    if (repartidorId) updateData.repartidorId = repartidorId;
    if (invoiceIds && Array.isArray(invoiceIds)) updateData.invoiceIds = invoiceIds;
    if (status) {
        const validStatuses = ['PLANNED', 'IN_PROGRESS', 'COMPLETED'];
        if (!validStatuses.includes(status.toUpperCase())) {
            return NextResponse.json({ error: 'Invalid route status' }, { status: 400 });
        }
        updateData.status = status.toUpperCase() as PrismaRouteStatus;
    }
    
    // Get current route's invoice IDs to find differences
    const currentRoute = await prisma.route.findUnique({ where: { id: routeId }, select: { invoiceIds: true }});
    if (!currentRoute) {
      return NextResponse.json({ error: 'Route not found for update' }, { status: 404 });
    }

    const updatedRoute = await prisma.route.update({
      where: { id: routeId },
      data: updateData,
    });

    // Logic to update invoice routeIds based on changes
    if (invoiceIds && Array.isArray(invoiceIds)) {
        const oldInvoiceIds = new Set(currentRoute.invoiceIds);
        const newInvoiceIds = new Set(invoiceIds as string[]);

        const invoicesToAddRoute = (invoiceIds as string[]).filter(id => !oldInvoiceIds.has(id));
        const invoicesToRemoveRoute = currentRoute.invoiceIds.filter(id => !newInvoiceIds.has(id));

        if (invoicesToAddRoute.length > 0) {
            await prisma.invoice.updateMany({
                where: { id: { in: invoicesToAddRoute } },
                data: { routeId: updatedRoute.id }
            });
        }
        if (invoicesToRemoveRoute.length > 0) {
            await prisma.invoice.updateMany({
                where: { id: { in: invoicesToRemoveRoute }, routeId: routeId }, // ensure we only unassign from this route
                data: { routeId: null }
            });
        }
    }


    return NextResponse.json(updatedRoute);
  } catch (error: any) {
    console.error(`Failed to update route ${routeId}:`, error);
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Route not found' }, { status: 404 });
    }
    if (error.code === 'P2003') { // Foreign key constraint failed
        return NextResponse.json({ error: 'Invalid repartidorId or other foreign key constraint failed.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to update route' }, { status: 500 });
  }
}

// DELETE a route by ID
export async function DELETE(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  const { routeId } = context.params;
  try {
    // Before deleting a route, disassociate invoices linked to it
    await prisma.invoice.updateMany({
      where: { routeId: routeId },
      data: { routeId: null },
    });

    await prisma.route.delete({
      where: { id: routeId },
    });
    return NextResponse.json({ message: 'Route deleted successfully' }, { status: 200 });
  } catch (error: any) {
    console.error(`Failed to delete route ${routeId}:`, error);
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Route not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to delete route' }, { status: 500 });
  }
}

    
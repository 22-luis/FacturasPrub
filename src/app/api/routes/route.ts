
import prisma from '@/lib/prisma';
import { NextResponse, type NextRequest } from 'next/server';
import type { Route as PrismaRoute, RouteStatus as PrismaRouteStatus } from '@prisma/client'; // Assuming RouteStatus is an enum in Prisma

// GET all routes
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const repartidorId = searchParams.get('repartidorId');

    const whereClause: any = {};
    if (date) {
        // Ensure date is handled correctly, Prisma expects DateTime
        try {
            whereClause.date = new Date(date);
        } catch (e) {
            return NextResponse.json({ error: 'Invalid date format for query' }, { status: 400 });
        }
    }
    if (repartidorId) {
      whereClause.repartidorId = repartidorId;
    }

    const routes = await prisma.route.findMany({
      where: whereClause,
      orderBy: {
        date: 'desc', 
      },
      include: { // Optional: include related data if needed directly from API
        repartidor: {
            select: { id: true, name: true }
        },
        // If invoices relation is direct (not just IDs)
        // invoices: { select: { id: true, invoiceNumber: true }} 
      }
    });
    return NextResponse.json(routes);
  } catch (error) {
    console.error('Failed to fetch routes:', error);
    return NextResponse.json({ error: 'Failed to fetch routes' }, { status: 500 });
  }
}

// POST create a new route
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const data = await request.json();
    const { date, repartidorId, invoiceIds, status } = data;

    if (!date || !repartidorId || !invoiceIds || !Array.isArray(invoiceIds)) {
      return NextResponse.json({ error: 'Missing required fields: date, repartidorId, invoiceIds (array)' }, { status: 400 });
    }
    
    // Basic validation for RouteStatus if it's an enum
    const validStatuses = ['PLANNED', 'IN_PROGRESS', 'COMPLETED'];
    if (status && !validStatuses.includes(status.toUpperCase())) {
        return NextResponse.json({ error: 'Invalid route status' }, { status: 400 });
    }


    const newRoute = await prisma.route.create({
      data: {
        date: new Date(date),
        repartidorId,
        invoiceIds, // Assumes invoiceIds is String[] in Prisma schema
        status: status ? status.toUpperCase() as PrismaRouteStatus : 'PLANNED' as PrismaRouteStatus,
      },
    });

    // Update invoices to link them to this new route
    if (newRoute && invoiceIds.length > 0) {
        await prisma.invoice.updateMany({
            where: { id: { in: invoiceIds } },
            data: { routeId: newRoute.id }
        });
    }

    return NextResponse.json(newRoute, { status: 201 });
  } catch (error: any) {
    console.error('Failed to create route:', error);
    // Handle potential Prisma errors (e.g., foreign key constraint if repartidorId is invalid)
    if (error.code === 'P2003') { // Foreign key constraint failed
        return NextResponse.json({ error: 'Invalid repartidorId or other foreign key constraint failed.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create route' }, { status: 500 });
  }
}

    
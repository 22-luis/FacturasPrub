
import prisma from '@/lib/prisma';
import { NextResponse, type NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import type { UserRole as PrismaUserRole } from '@prisma/client';
import type { UserRole } from '@/lib/types';

// GET a single user by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
): Promise<NextResponse> {
  const requestUrl = request.nextUrl.pathname + request.nextUrl.search;
  console.log(`API Route Handler: GET ${requestUrl}`, { params });

  try {
    const { userId } = params;
    if (!userId) {
      console.warn(`API Route Validation: GET ${requestUrl} - userId parameter is missing.`);
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }
    const userFromDb = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!userFromDb) {
      console.warn(`API Route DB: GET ${requestUrl} - User not found: ${userId}`);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    const userToReturn = {
      ...userFromDb,
      role: userFromDb.role.toLowerCase() as UserRole,
    };
    console.log(`API Route Success: GET ${requestUrl} - Fetched user: ${userId}`);
    return NextResponse.json(userToReturn);
  } catch (error) {
    console.error(`API Route Handler ERROR: GET ${requestUrl} (params: ${JSON.stringify(params)})`, error);
    return NextResponse.json({ error: 'Failed to fetch user due to an unexpected error' }, { status: 500 });
  }
}

// PUT update a user by ID
export async function PUT(
  request: NextRequest,
  { params }: { params: { userId: string } }
): Promise<NextResponse> {
  const requestUrl = request.nextUrl.pathname + request.nextUrl.search;
  let requestBodyForLog: any = "Could not clone or parse body";

  try {
    const tempRequest = request.clone();
    requestBodyForLog = await tempRequest.json().catch(() => "Non-JSON or empty body");
  } catch (e) {
    // Silently ignore
  }
  console.log(`API Route Handler: PUT ${requestUrl}`, { params, body: requestBodyForLog });
  
  try {
    const { userId } = params;
    if (!userId) {
      console.warn(`API Route Validation: PUT ${requestUrl} - userId parameter is missing.`);
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }
    const { name, role, password } = await request.json();

    const updateData: { name?: string; role?: PrismaUserRole; password?: string } = {};

    if (name) updateData.name = name;
    if (role) {
      const lowerCaseRole = role.toLowerCase();
      if (!['repartidor', 'supervisor', 'administrador'].includes(lowerCaseRole)) {
          console.warn(`API Route Validation: PUT ${requestUrl} - Invalid user role: ${role}`);
          return NextResponse.json({ error: 'Invalid user role' }, { status: 400 });
      }
      updateData.role = lowerCaseRole.toUpperCase() as PrismaUserRole;
    }
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    if (name) {
        const existingUserWithSameName = await prisma.user.findFirst({
            where: {
                name: name,
                id: { not: userId }
            }
        });
        if (existingUserWithSameName) {
            console.warn(`API Route DB: PUT ${requestUrl} - User name already exists: ${name}`);
            return NextResponse.json({ error: 'Another user with this name already exists' }, { status: 409 });
        }
    }

    const updatedUserFromDb = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const userToReturn = {
      ...updatedUserFromDb,
      role: updatedUserFromDb.role.toLowerCase() as UserRole,
    };
    console.log(`API Route Success: PUT ${requestUrl} - Updated user: ${userId}`);
    return NextResponse.json(userToReturn);
  } catch (error: any) {
    console.error(`API Route Handler ERROR: PUT ${requestUrl} (params: ${JSON.stringify(params)})`, error);
    if (error.code === 'P2025') {
      console.warn(`API Route DB: PUT ${requestUrl} - User not found for update: ${params.userId}`);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to update user due to an unexpected error' }, { status: 500 });
  }
}

// DELETE a user by ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: { userId: string } }
): Promise<NextResponse> {
  const requestUrl = request.nextUrl.pathname + request.nextUrl.search;
  console.log(`API Route Handler: DELETE ${requestUrl}`, { params });

  try {
    const { userId } = params;
    if (!userId) {
      console.warn(`API Route Validation: DELETE ${requestUrl} - userId parameter is missing.`);
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }
    await prisma.user.delete({
      where: { id: userId },
    });
    console.log(`API Route Success: DELETE ${requestUrl} - Deleted user: ${userId}`);
    return NextResponse.json({ message: 'User deleted successfully' }, { status: 200 });
  } catch (error: any) {
    console.error(`API Route Handler ERROR: DELETE ${requestUrl} (params: ${JSON.stringify(params)})`, error);
    if (error.code === 'P2025') {
      console.warn(`API Route DB: DELETE ${requestUrl} - User not found for deletion: ${params.userId}`);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to delete user due to an unexpected error' }, { status: 500 });
  }
}

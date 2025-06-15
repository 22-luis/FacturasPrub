
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import type { UserRole as PrismaUserRole } from '@prisma/client'; // Prisma's uppercase enum
import type { UserRole } from '@/lib/types'; // Frontend's lowercase type

interface Params {
  params: Promise<{ userId: string }>;
}

export async function GET(request: Request, { params }: Params) {
  const awaitedParams = await params;
  try {
    const userFromDb = await prisma.user.findUnique({
      where: { id: awaitedParams.userId },
      select: {
        id: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!userFromDb) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    // Convert role to lowercase for frontend consistency
    const userToReturn = {
      ...userFromDb,
      role: userFromDb.role.toLowerCase() as UserRole,
    };
    return NextResponse.json(userToReturn);
  } catch (error) {
    console.error(`Failed to fetch user ${awaitedParams.userId}:`, error);
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: Params) {
  const awaitedParams = await params;
  try {
    const { name, role, password } = await request.json(); // 'role' from client is lowercase

    // Define Prisma's UserRole enum type if not already globally available
    // type PrismaUserRole = 'REPARTIDOR' | 'SUPERVISOR' | 'ADMINISTRADOR';

    const updateData: { name?: string; role?: PrismaUserRole; password?: string } = {};

    if (name) updateData.name = name;
    if (role) {
      const lowerCaseRole = role.toLowerCase();
      if (!['repartidor', 'supervisor', 'administrador'].includes(lowerCaseRole)) {
          return NextResponse.json({ error: 'Invalid user role' }, { status: 400 });
      }
      updateData.role = lowerCaseRole.toUpperCase() as PrismaUserRole; // Store as uppercase
    }
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    if (name) {
        const existingUserWithSameName = await prisma.user.findFirst({
            where: {
                name: name,
                id: { not: awaitedParams.userId }
            }
        });
        if (existingUserWithSameName) {
            return NextResponse.json({ error: 'Another user with this name already exists' }, { status: 409 });
        }
    }

    const updatedUserFromDb = await prisma.user.update({
      where: { id: awaitedParams.userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Convert role to lowercase for response
    const userToReturn = {
      ...updatedUserFromDb,
      role: updatedUserFromDb.role.toLowerCase() as UserRole,
    };

    return NextResponse.json(userToReturn);
  } catch (error: any) {
    console.error(`Failed to update user ${awaitedParams.userId}:`, error);
    if (error.code === 'P2025') { // Prisma error code for record not found
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: Params) {
  const awaitedParams = await params;
  try {
    // onDelete: SetNull in schema handles unassigning invoices automatically
    await prisma.user.delete({
      where: { id: awaitedParams.userId },
    });
    return NextResponse.json({ message: 'User deleted successfully' }, { status: 200 });
  } catch (error: any) {
    console.error(`Failed to delete user ${awaitedParams.userId}:`, error);
    if (error.code === 'P2025') { // Prisma error code for record not found
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}

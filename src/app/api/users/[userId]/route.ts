
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import type { UserRole } from '@prisma/client';

interface Params {
  params: { userId: string };
}

// GET a single user by ID
export async function GET(request: Request, { params }: Params) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: params.userId },
      select: {
        id: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    return NextResponse.json(user);
  } catch (error) {
    console.error(`Failed to fetch user ${params.userId}:`, error);
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
  }
}

// PUT update a user by ID
export async function PUT(request: Request, { params }: Params) {
  try {
    const { name, role, password } = await request.json();

    if (role && !['repartidor', 'supervisor', 'administrador'].includes(role)) {
        return NextResponse.json({ error: 'Invalid user role' }, { status: 400 });
    }
    
    const updateData: { name?: string; role?: UserRole; password?: string } = {};
    if (name) updateData.name = name;
    if (role) updateData.role = role as UserRole;
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    if (name) {
        const existingUserWithSameName = await prisma.user.findFirst({
            where: {
                name: name,
                id: { not: params.userId }
            }
        });
        if (existingUserWithSameName) {
            return NextResponse.json({ error: 'Another user with this name already exists' }, { status: 409 });
        }
    }


    const updatedUser = await prisma.user.update({
      where: { id: params.userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error: any) {
    console.error(`Failed to update user ${params.userId}:`, error);
    if (error.code === 'P2025') { // Prisma error code for record not found
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

// DELETE a user by ID
export async function DELETE(request: Request, { params }: Params) {
  try {
    // onDelete: SetNull in schema handles unassigning invoices automatically
    await prisma.user.delete({
      where: { id: params.userId },
    });
    return NextResponse.json({ message: 'User deleted successfully' }, { status: 200 });
  } catch (error: any) {
    console.error(`Failed to delete user ${params.userId}:`, error);
    if (error.code === 'P2025') { // Prisma error code for record not found
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}

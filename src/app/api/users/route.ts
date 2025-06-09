
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import type { UserRole } from '@prisma/client';

// GET all users
export async function GET() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return NextResponse.json(users);
  } catch (error) {
    console.error('Failed to fetch users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

// POST create a new user
export async function POST(request: Request) {
  try {
    const { name, role, password } = await request.json();

    if (!name || !role || !password) {
      return NextResponse.json({ error: 'Missing required fields: name, role, password' }, { status: 400 });
    }

    if (!['REPARTIDOR', 'SUPERVISOR', 'ADMINISTRADOR'].includes(role)) {
        return NextResponse.json({ error: 'Invalid user role' }, { status: 400 });
    }

    const existingUser = await prisma.user.findFirst({ where: { name } });
    if (existingUser) {
      return NextResponse.json({ error: 'User with this name already exists' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        name,
        role: role as UserRole,
        password: hashedPassword,
      },
      select: {
        id: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    console.error('Failed to create user:', error);
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}

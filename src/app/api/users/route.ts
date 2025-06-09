
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import type { UserRole as PrismaUserRole } from '@prisma/client'; // Prisma's uppercase enum
import type { UserRole } from '@/lib/types'; // Frontend's lowercase type

// GET all users
export async function GET() {
  try {
    const usersFromDb = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    // Convert roles to lowercase for frontend consistency
    const usersToReturn = usersFromDb.map(u => ({
      ...u,
      role: u.role.toLowerCase() as UserRole,
    }));
    return NextResponse.json(usersToReturn);
  } catch (error) {
    console.error('Failed to fetch users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

// POST create a new user
export async function POST(request: Request) {
  try {
    const { name, role, password } = await request.json(); // 'role' from client is lowercase

    if (!name || !role || !password) {
      return NextResponse.json({ error: 'Missing required fields: name, role, password' }, { status: 400 });
    }

    const lowerCaseRole = role.toLowerCase();
    // Validate lowercase role
    if (!['repartidor', 'supervisor', 'administrador'].includes(lowerCaseRole)) {
        return NextResponse.json({ error: 'Invalid user role' }, { status: 400 });
    }

    const existingUser = await prisma.user.findFirst({ where: { name } });
    if (existingUser) {
      return NextResponse.json({ error: 'User with this name already exists' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUserFromDb = await prisma.user.create({
      data: {
        name,
        role: lowerCaseRole.toUpperCase() as PrismaUserRole, // Store as uppercase
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

    // Convert role to lowercase for response
    const userToReturn = {
      ...newUserFromDb,
      role: newUserFromDb.role.toLowerCase() as UserRole,
    };

    return NextResponse.json(userToReturn, { status: 201 });
  } catch (error) {
    console.error('Failed to create user:', error);
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}

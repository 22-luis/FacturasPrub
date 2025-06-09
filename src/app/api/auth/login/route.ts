
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import type { UserRole } from '@/lib/types';

export async function POST(request: Request) {
  try {
    const { name, password } = await request.json();

    if (!name || !password) {
      return NextResponse.json({ error: 'Name and password are required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { name },
    });

    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Exclude password from the returned user object and convert role to lowercase
    const { password: _, ...userFromDb } = user;
    const userToReturn = {
      ...userFromDb,
      role: userFromDb.role.toLowerCase() as UserRole,
    };

    return NextResponse.json(userToReturn);
  } catch (error) {
    console.error('Login failed:', error);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}

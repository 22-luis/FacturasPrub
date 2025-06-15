
import prisma from '@/lib/prisma';
import { NextResponse, type NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import type { UserRole as PrismaUserRole } from '@prisma/client';
import type { UserRole } from '@/lib/types';

// GET all users
export async function GET(request: NextRequest): Promise<NextResponse> {
  const requestUrl = request.nextUrl.pathname + request.nextUrl.search;
  console.log(`API Route Handler: GET ${requestUrl}`);

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
    const usersToReturn = usersFromDb.map(u => ({
      ...u,
      role: u.role.toLowerCase() as UserRole,
    }));
    console.log(`API Route Success: GET ${requestUrl} - Fetched ${usersToReturn.length} users.`);
    return NextResponse.json(usersToReturn);
  } catch (error) {
    console.error(`API Route Handler ERROR: GET ${requestUrl}`, error);
    return NextResponse.json({ error: 'Failed to fetch users due to an unexpected error' }, { status: 500 });
  }
}

// POST create a new user
export async function POST(request: NextRequest): Promise<NextResponse> {
  const requestUrl = request.nextUrl.pathname + request.nextUrl.search;
  let requestBodyForLog: any = "Could not clone or parse body";

  try {
    const tempRequest = request.clone();
    requestBodyForLog = await tempRequest.json().catch(() => "Non-JSON or empty body");
  } catch (e) {
    // Silently ignore
  }
  console.log(`API Route Handler: POST ${requestUrl}`, { body: requestBodyForLog });

  try {
    const { name, role, password } = await request.json();

    if (!name || !role || !password) {
      console.warn(`API Route Validation: POST ${requestUrl} - Missing required fields.`);
      return NextResponse.json({ error: 'Missing required fields: name, role, password' }, { status: 400 });
    }

    const lowerCaseRole = role.toLowerCase();
    if (!['repartidor', 'supervisor', 'administrador'].includes(lowerCaseRole)) {
        console.warn(`API Route Validation: POST ${requestUrl} - Invalid user role: ${role}`);
        return NextResponse.json({ error: 'Invalid user role' }, { status: 400 });
    }

    const existingUser = await prisma.user.findFirst({ where: { name } });
    if (existingUser) {
      console.warn(`API Route DB: POST ${requestUrl} - User name already exists: ${name}`);
      return NextResponse.json({ error: 'User with this name already exists' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUserFromDb = await prisma.user.create({
      data: {
        name,
        role: lowerCaseRole.toUpperCase() as PrismaUserRole,
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

    const userToReturn = {
      ...newUserFromDb,
      role: newUserFromDb.role.toLowerCase() as UserRole,
    };
    console.log(`API Route Success: POST ${requestUrl} - Created user with ID: ${userToReturn.id}`);
    return NextResponse.json(userToReturn, { status: 201 });
  } catch (error) {
    console.error(`API Route Handler ERROR: POST ${requestUrl}`, error);
    return NextResponse.json({ error: 'Failed to create user due to an unexpected error' }, { status: 500 });
  }
}

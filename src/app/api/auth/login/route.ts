
import prisma from '@/lib/prisma';
import { NextResponse, type NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import type { UserRole } from '@/lib/types';

export async function POST(request: NextRequest): Promise<NextResponse> {
  const requestUrl = request.nextUrl.pathname + request.nextUrl.search;
  let requestBodyForLog: any = "Could not clone or parse body";

  try {
    const tempRequest = request.clone();
    requestBodyForLog = await tempRequest.json().catch(() => "Non-JSON or empty body");
  } catch (e) {
    // Silently ignore if cloning/parsing for logging fails
  }
  console.log(`API Route Handler: POST ${requestUrl}`, { body: requestBodyForLog });

  try {
    const { name, password } = await request.json();

    if (!name || !password) {
      console.warn(`API Route Validation: POST ${requestUrl} - Name and password are required.`);
      return NextResponse.json({ error: 'Name and password are required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { name },
    });

    if (!user) {
      console.warn(`API Route Auth: POST ${requestUrl} - User not found: ${name}`);
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      console.warn(`API Route Auth: POST ${requestUrl} - Invalid password for user: ${name}`);
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const { password: _, ...userFromDb } = user;
    const userToReturn = {
      ...userFromDb,
      role: userFromDb.role.toLowerCase() as UserRole,
    };
    console.log(`API Route Success: POST ${requestUrl} - Login successful for user: ${name}`);
    return NextResponse.json(userToReturn);
  } catch (error) {
    console.error(`API Route Handler ERROR: POST ${requestUrl}`, error);
    return NextResponse.json({ error: 'Login failed due to an unexpected error' }, { status: 500 });
  }
}

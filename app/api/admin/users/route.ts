import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      closer: {
        select: { id: true, name: true },
      },
      setters: {
        select: { id: true, name: true },
      },
      _count: {
        select: { setters: true },
      },
    },
  });

  return NextResponse.json(users);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { name, email, password, role, closerId, phone, ssn, dateOfBirth, bankName, routingNumber, zelle, address, profilePhoto } = body;

  if (!name || !email || !password || !role) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Email already exists" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: passwordHash,
      role,
      phone,
      closerId: role === "SETTER" && closerId ? parseInt(closerId) : null,
      profile: {
        create: {
          ssn: ssn || null,
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
          bankName: bankName || null,
          routingNumber: routingNumber || null,
          zelle: zelle || null,
          address: address || null,
          profilePhoto: profilePhoto || null,
        },
      },
    },
    include: { profile: true },
  });

  return NextResponse.json(user, { status: 201 });
}

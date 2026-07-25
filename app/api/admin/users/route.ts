import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { encrypt } from "@/lib/encryption";
import { generateOnboardingToken, buildSetupLink } from "@/lib/onboarding-token";
import { emailTemplates } from "@/lib/email-templates";
import { sendEmail } from "@/lib/email";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const roleFilter = searchParams.get("role");

  const whereClause: Record<string, unknown> = {};
  if (roleFilter) {
    whereClause.role = roleFilter;
  }

  const users = await prisma.user.findMany({
    where: whereClause,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      phone: true,
      isActive: true,
      locationValidationEnabled: true,
      closerId: true,
      avatarUrl: true,
      createdAt: true,
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
  const { name, email, password, role, closerId, phone, ssn, dateOfBirth, bankName, routingNumber, zelle, accountNumber, address, profilePhoto, sendOnboarding } = body;

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
      closerId: (role === "SETTER" || role === "SETTER_JR") && closerId ? parseInt(closerId) : null,
      profile: {
        create: {
          ssn: ssn ? encrypt(ssn) : null,
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth + "T12:00:00") : null,
          bankName: bankName || null,
          routingNumber: routingNumber ? encrypt(routingNumber) : null,
          zelle: zelle || null,
          accountNumber: accountNumber || null,
          address: address || null,
          profilePhoto: profilePhoto || null,
        },
      },
    },
    include: { profile: true },
  });

  if (sendOnboarding) {
    const token = generateOnboardingToken();
    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        onboardingToken: token,
        onboardingTokenExpires: expires,
      },
    });

    const link = buildSetupLink(token);
    try {
      await sendEmail({
        to: email,
        subject: "Configura tu cuenta - One Solutions",
        html: emailTemplates.onboarding(name, link),
      });
    } catch {
      // silently ignore email failures
    }
  }

  return NextResponse.json(user, { status: 201 });
}

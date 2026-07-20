import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { encrypt } from "@/lib/encryption";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
export const dynamic = 'force-dynamic';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const { name, email, role, closerId, phone, isActive, locationValidationEnabled, password, ssn, dateOfBirth, bankName, routingNumber, zelle, accountNumber, address, profilePhoto } = body;

  const data: Record<string, unknown> = {
    name,
    email,
    role,
    phone,
    isActive,
  };

  if (locationValidationEnabled !== undefined) {
    data.locationValidationEnabled = locationValidationEnabled;
  }

  if (password) {
    data.password = await bcrypt.hash(password, 10);
  }

  if (role === "SETTER" || role === "SETTER_JR") {
    data.closerId = closerId ? parseInt(closerId) : null;
  } else {
    data.closerId = null;
  }

  try {
    const user = await prisma.user.update({
      where: { id: parseInt(id) },
      data,
    });

    if (ssn !== undefined || dateOfBirth !== undefined || bankName !== undefined || routingNumber !== undefined || zelle !== undefined || accountNumber !== undefined || address !== undefined || profilePhoto !== undefined) {
      const profileData: Record<string, unknown> = {};
      if (ssn !== undefined) profileData.ssn = ssn ? encrypt(ssn) : null;
      if (dateOfBirth !== undefined) profileData.dateOfBirth = dateOfBirth ? new Date(dateOfBirth + "T12:00:00") : null;
      if (bankName !== undefined) profileData.bankName = bankName;
      if (routingNumber !== undefined) profileData.routingNumber = routingNumber ? encrypt(routingNumber) : null;
      if (zelle !== undefined) profileData.zelle = zelle;
      if (accountNumber !== undefined) profileData.accountNumber = accountNumber;
      if (address !== undefined) profileData.address = address;
      if (profilePhoto !== undefined) profileData.profilePhoto = profilePhoto;

      await prisma.userProfile.upsert({
        where: { userId: parseInt(id) },
        create: { userId: parseInt(id), ...profileData },
        update: profileData,
      });
    }

    return NextResponse.json(user);
  } catch {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    await prisma.user.delete({
      where: { id: parseInt(id) },
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
}

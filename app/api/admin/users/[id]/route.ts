import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

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
  const { name, email, role, closerId, phone, isActive, password, ssn, dateOfBirth, bankName, routingNumber, zelle, address, profilePhoto } = body;

  const data: Record<string, unknown> = {
    name,
    email,
    role,
    phone,
    isActive,
  };

  if (password) {
    data.password = await bcrypt.hash(password, 10);
  }

  if (role === "SETTER") {
    data.closerId = closerId ? parseInt(closerId) : null;
  } else {
    data.closerId = null;
  }

  try {
    const user = await prisma.user.update({
      where: { id: parseInt(id) },
      data,
    });

    // Update profile if any profile fields are provided
    if (ssn !== undefined || dateOfBirth !== undefined || bankName !== undefined || routingNumber !== undefined || zelle !== undefined || address !== undefined || profilePhoto !== undefined) {
      const profileData: Record<string, unknown> = {};
      if (ssn !== undefined) profileData.ssn = ssn;
      if (dateOfBirth !== undefined) profileData.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null;
      if (bankName !== undefined) profileData.bankName = bankName;
      if (routingNumber !== undefined) profileData.routingNumber = routingNumber;
      if (zelle !== undefined) profileData.zelle = zelle;
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
  request: Request,
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

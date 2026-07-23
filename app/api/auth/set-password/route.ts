import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json(
        { error: "Token y contraseña son requeridos" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "La contraseña debe tener al menos 6 caracteres" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findFirst({
      where: { onboardingToken: token },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Token inválido o ya utilizado" },
        { status: 400 }
      );
    }

    if (!user.onboardingTokenExpires || user.onboardingTokenExpires < new Date()) {
      return NextResponse.json(
        { error: "El token ha expirado. Solicita uno nuevo a tu administrador" },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: passwordHash,
        onboardingToken: null,
        onboardingTokenExpires: null,
      },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

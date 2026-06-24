import "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    role: string;
    closerId?: number;
  }

  interface Session {
    user: {
      id: string;
      role: string;
      closerId?: number;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: string;
    closerId?: number;
  }
}

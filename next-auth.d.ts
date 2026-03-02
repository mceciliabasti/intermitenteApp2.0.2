import NextAuth, { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string; // <-- Aquí declaras tu campo personalizado
    } & DefaultSession["user"]
  }

  interface User {
    role: string; // <-- También hay que avisarle al objeto User
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: string; // <-- Y al Token
  }
}
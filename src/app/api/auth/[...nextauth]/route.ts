

import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import dbConnect from "@/lib/dbConnect"; // <-- Importamos la conexión pro
import User from "@/models/User";       // <-- Importa tu modelo de Usuario
import bcrypt from "bcryptjs";          // <-- O la librería que uses para passwords

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text", placeholder: "correo@ejemplo.com" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // 1. Conectamos a MongoDB Atlas
        try {
          await dbConnect();
        } catch (error) {
          console.error("Error conectando a Atlas:", error);
          throw new Error("Error de conexión con la base de datos");
        }

        if (!credentials) {
          throw new Error("Credenciales no proporcionadas");
        }

        // 2. Buscamos al usuario por email
        const user = await User.findOne({ email: credentials.email });
        if (!user) {
          console.log("El usuario no existe en Atlas");
          throw new Error("Credenciales inválidas"); // Esto devolverá el 401
        }

        // 3. Comparamos la contraseña
        const isPasswordCorrect = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordCorrect) {
          console.log("Contraseña incorrecta");
          throw new Error("Credenciales inválidas");
        }

        // 4. Si todo está bien, devolvemos el objeto usuario
        return user;
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login", // O la ruta de tu página de login
  },
  secret: process.env.NEXTAUTH_SECRET, // ¡Importante que esté aquí también!
});

export { handler as GET, handler as POST };
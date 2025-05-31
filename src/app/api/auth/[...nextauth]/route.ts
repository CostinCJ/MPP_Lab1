import NextAuth, { NextAuthOptions } from "next-auth";
import { TypeORMAdapter } from "@auth/typeorm-adapter";
import { AppDataSource, getInitializedDataSource } from "@/lib/database/data-source";
import CredentialsProvider from "next-auth/providers/credentials";
import { User } from "@/lib/entities/User";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  adapter: TypeORMAdapter(AppDataSource.options),
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "example@example.com" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) {
          console.error("Credentials missing email or password");
          return null;
        }

        try {
          const dataSource = await getInitializedDataSource();
          const userRepository = dataSource.getRepository(User);

          // Fetch user and explicitly select the password field
          const user = await userRepository
            .createQueryBuilder("user")
            .addSelect("user.password") // Ensure password is selected
            .where("user.email = :email", { email: credentials.email })
            .getOne();

          if (!user) {
            console.log("No user found with email:", credentials.email);
            return null;
          }

          // Ensure user.password is not null or undefined before comparing
          if (!user.password) {
            console.error("User found but password field is missing or null:", user.email);
            return null;
          }

          const isValidPassword = await bcrypt.compare(credentials.password, user.password);

          if (!isValidPassword) {
            console.log("Invalid password for user:", credentials.email);
            return null;
          }

          console.log("User authenticated:", user.email);
          // Return the user object that next-auth expects
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
          };
        } catch (error) {
          console.error("Error during authorization:", error);
          return null;
        }
      }
    })
  ],
  session: {
    strategy: "jwt",
  },
  secret: process.env.AUTH_SECRET,
  pages: {
    signIn: '/auth/signin',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      // Send properties to the client, like an access_token and user id from the token
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
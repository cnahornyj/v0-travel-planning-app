import type { NextAuthOptions } from "next-auth"
import { MongoDBAdapter } from "@auth/mongodb-adapter"
import { MongoClient } from "mongodb"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import connectDB from "./mongodb"
import User from "@/models/User"

const client = new MongoClient(process.env.MONGODB_URI!)
const clientPromise = client.connect()

export const authOptions: NextAuthOptions = {
  adapter: MongoDBAdapter(clientPromise),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        name: { label: "Name", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        await connectDB()

        try {
          // Check if user exists
          const existingUser = await User.findOne({ email: credentials.email })

          if (existingUser) {
            // Login flow - verify password
            const isPasswordValid = await bcrypt.compare(credentials.password, existingUser.password)

            if (!isPasswordValid) {
              return null
            }

            return {
              id: existingUser._id.toString(),
              email: existingUser.email,
              name: existingUser.name,
              image: existingUser.image,
            }
          } else {
            // Registration flow - create new user
            if (!credentials.name) {
              return null
            }

            const hashedPassword = await bcrypt.hash(credentials.password, 12)

            const newUser = await User.create({
              email: credentials.email,
              name: credentials.name,
              password: hashedPassword,
            })

            return {
              id: newUser._id.toString(),
              email: newUser.email,
              name: newUser.name,
              image: newUser.image,
            }
          }
        } catch (error) {
          console.error("Auth error:", error)
          return null
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
      }
      return session
    },
  },
  pages: {
    signIn: "/auth/signin",
    signUp: "/auth/signup",
  },
}

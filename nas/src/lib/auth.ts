import NextAuth, { NextAuthConfig } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { sql } from "@/lib/db"
import argon2 from "argon2"

export const authConfig: NextAuthConfig = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          // Query auth_users table
          const users = await sql`
            SELECT id, name, email, user_role
            FROM auth_users 
            WHERE email = ${credentials.email as string}
          `

          if (users.length === 0) {
            return null
          }

          const user = users[0]

          // Get password from auth_accounts table
          const accounts = await sql`
            SELECT password
            FROM auth_accounts
            WHERE "userId" = ${user.id as number}
              AND provider = 'credentials'
          `

          if (accounts.length === 0 || !accounts[0].password) {
            return null
          }

          // Verify password (using argon2)
          const isValid = await argon2.verify(
            accounts[0].password as string,
            credentials.password as string
          )

          if (!isValid) {
            return null
          }

          // Return user object
          return {
            id: String(user.id),
            name: user.name as string,
            email: user.email as string,
            role: user.user_role as string
          }
        } catch (error) {
          console.error("Authentication error:", error)
          return null
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
      }
      return session
    },
    async signIn({ user }) {
      if (!user?.id) {
        return false
      }

      try {
        // Create session record in auth_sessions table
        const sessionToken = crypto.randomUUID()
        const expires = new Date()
        expires.setDate(expires.getDate() + 30) // 30 days

        await sql`
          INSERT INTO auth_sessions ("userId", expires, "sessionToken")
          VALUES (${parseInt(user.id)}, ${expires.toISOString()}, ${sessionToken})
        `

        return true
      } catch (error) {
        console.error("Session creation error:", error)
        return false
      }
    }
  },
  pages: {
    signIn: "/login"
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60 // 30 days
  },
  secret: process.env.AUTH_SECRET
}

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig)

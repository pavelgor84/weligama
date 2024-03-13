import { NextAuthConfig } from 'next-auth'
import Google from 'next-auth/providers/google'
import NextAuth from 'next-auth'

const config = {
    providers: [Google],
    callbacks: {
        authorized({ request, auth }) {
            const { pathname } = request.nextUrl;
            if (pathname === "/admin") return !!auth;
            return true
        }
    }
}

export const { handlers, auth, signIn, signOut } = NextAuth(config)
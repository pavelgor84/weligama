import { NextAuthConfig } from 'next-auth'
import Google from 'next-auth/providers/google'
import NextAuth from 'next-auth'

const config = {
    providers: [Google]
}

export const { handlers, auth, signIn, signOut } = NextAuth(config)
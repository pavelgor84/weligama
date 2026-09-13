import { NextAuthConfig } from 'next-auth'
import Google from 'next-auth/providers/google'
import NextAuth from 'next-auth'
import { NextResponse } from 'next/server'

const config = {
    providers: [Google],
    callbacks: {
        authorized({ request, auth }) {
            const { pathname } = request.nextUrl;
            // Protect all admin pages (exact match on "/admin" missed /admin/edit)
            if (pathname === "/admin" || pathname.startsWith("/admin/")) return !!auth;
            return true
        }
    }
}

export const { handlers, auth, signIn, signOut } = NextAuth(config)

/**
 * Server-side guard for admin API routes.
 * Returns the session email, or a 401 NextResponse when unauthenticated.
 */
export async function requireAdminEmail() {
    const session = await auth();
    if (!session?.user?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return session.user.email;
}
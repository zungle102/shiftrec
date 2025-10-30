import NextAuth from 'next-auth'
import { authOptions } from '../../../../lib/auth'

// Create NextAuth handler - it returns an object with handlers for App Router
const nextAuth = NextAuth(authOptions)

// Export the handlers - NextAuth v4 returns handlers object
export const GET = nextAuth.handlers?.GET || nextAuth
export const POST = nextAuth.handlers?.POST || nextAuth


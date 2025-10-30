import { MongoDBAdapter } from '@next-auth/mongodb-adapter'
import NextAuth, { type NextAuthOptions } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import Google from 'next-auth/providers/google'
import GitHub from 'next-auth/providers/github'
import clientPromise from './mongodb'
import { compare } from 'bcryptjs'
import { z } from 'zod'

const credentialsSchema = z.object({
	email: z.string().email(),
	password: z.string().min(8)
})

export const authOptions: NextAuthOptions = {
	adapter: MongoDBAdapter(clientPromise) as any,
	secret: process.env.NEXTAUTH_SECRET,
	session: { strategy: 'jwt' },
	providers: [
		Credentials({
			name: 'Credentials',
			credentials: {
				email: { label: 'Email', type: 'email' },
				password: { label: 'Password', type: 'password' }
			},
			async authorize(raw) {
				const parsed = credentialsSchema.safeParse(raw)
				if (!parsed.success) return null
				const { email, password } = parsed.data
				const client = await clientPromise
				const db = client.db()
				const user = await db.collection('users').findOne({ email })
				if (!user || !user.password) return null
				const ok = await compare(password, user.password)
				if (!ok) return null
				return { id: user._id.toString(), email: user.email, name: user.name ?? null }
			}
		}),
		Google({
			clientId: process.env.GOOGLE_CLIENT_ID || '',
			clientSecret: process.env.GOOGLE_CLIENT_SECRET || ''
		}),
		GitHub({
			clientId: process.env.GITHUB_CLIENT_ID || '',
			clientSecret: process.env.GITHUB_CLIENT_SECRET || ''
		})
	],
	pages: {
		signIn: '/signin'
	}
}

// Initialize NextAuth
const nextAuthInstance = NextAuth(authOptions)

// Export auth for server components
export const auth = nextAuthInstance.auth
export { authOptions }


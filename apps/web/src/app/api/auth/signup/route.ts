import clientPromise from '../../../../lib/mongodb'
import { NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import { z } from 'zod'

const schema = z.object({
	name: z.string().min(1).max(100),
	email: z.string().email(),
	password: z.string().min(8).max(128)
})

export async function POST(req: Request) {
	try {
		const data = await req.json()
		const parsed = schema.safeParse(data)
		if (!parsed.success) {
			return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
		}
		const { name, email, password } = parsed.data
		const client = await clientPromise
		const db = client.db()
		const existing = await db.collection('users').findOne({ email })
		if (existing) {
			return NextResponse.json({ error: 'Email already in use' }, { status: 409 })
		}
		const hashed = await hash(password, 12)
		const now = new Date()
		await db.collection('users').insertOne({
			name,
			email,
			password: hashed,
			emailVerified: null,
			createdAt: now,
			updatedAt: now
		})
		return NextResponse.json({ ok: true })
	} catch (err) {
		return NextResponse.json({ error: 'Server error' }, { status: 500 })
	}
}


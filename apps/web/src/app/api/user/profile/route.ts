import { auth } from '../../../../lib/auth'
import clientPromise from '../../../../lib/mongodb'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const updateProfileSchema = z.object({
	name: z.string().min(1).max(100),
	businessName: z.string().max(200).optional().or(z.literal('')),
	streetAddress: z.string().max(200).optional().or(z.literal('')),
	suburb: z.string().max(100).optional().or(z.literal('')),
	state: z.string().max(50).optional().or(z.literal('')),
	phoneNumber: z.string().max(20).optional().or(z.literal('')),
	businessWebsite: z.string().url().max(200).optional().or(z.literal('')),
	businessABN: z.string().max(11).regex(/^\d{11}$|^$/).optional().or(z.literal(''))
})

export async function GET(req: Request) {
	try {
		const session = await auth()
		if (!session?.user?.email) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const client = await clientPromise
		const db = client.db()
		const user = await db.collection('users').findOne(
			{ email: session.user.email },
			{ projection: { password: 0 } } // Exclude password
		)

		if (!user) {
			return NextResponse.json({ error: 'User not found' }, { status: 404 })
		}

		return NextResponse.json({
			name: user.name || '',
			email: user.email,
			businessName: user.businessName || '',
			streetAddress: user.streetAddress || '',
			suburb: user.suburb || '',
			state: user.state || '',
			phoneNumber: user.phoneNumber || '',
			businessWebsite: user.businessWebsite || '',
			businessABN: user.businessABN || ''
		})
	} catch (err) {
		console.error('Error fetching profile:', err)
		return NextResponse.json({ error: 'Server error' }, { status: 500 })
	}
}

export async function PATCH(req: Request) {
	try {
		const session = await auth()
		if (!session?.user?.email) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const data = await req.json()
		const parsed = updateProfileSchema.safeParse(data)
		if (!parsed.success) {
			return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
		}

		const { name, businessName, streetAddress, suburb, state, phoneNumber, businessWebsite, businessABN } = parsed.data
		const client = await clientPromise
		const db = client.db()

		// Update user profile
		const updateData: any = {
			name,
			updatedAt: new Date()
		}

		if (businessName !== undefined) updateData.businessName = businessName || null
		if (streetAddress !== undefined) updateData.streetAddress = streetAddress || null
		if (suburb !== undefined) updateData.suburb = suburb || null
		if (state !== undefined) updateData.state = state || null
		if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber || null
		if (businessWebsite !== undefined) updateData.businessWebsite = businessWebsite || null
		if (businessABN !== undefined) updateData.businessABN = businessABN || null

		await db.collection('users').updateOne(
			{ email: session.user.email },
			{ $set: updateData }
		)

		return NextResponse.json({ ok: true, ...updateData })
	} catch (err) {
		console.error('Error updating profile:', err)
		return NextResponse.json({ error: 'Server error' }, { status: 500 })
	}
}


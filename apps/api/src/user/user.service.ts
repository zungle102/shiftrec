import { Injectable, UnauthorizedException, NotFoundException, BadRequestException } from '@nestjs/common'
import { DatabaseService } from '../database/database.service'
import { updateProfileSchema } from './dto/profile.dto'

@Injectable()
export class UserService {
	constructor(private readonly databaseService: DatabaseService) {}

	async getProfile(email: string) {
		const db = await this.databaseService.getDb()
		const user = await db.collection('users').findOne(
			{ email },
			{ projection: { password: 0 } }
		)

		if (!user) {
			throw new NotFoundException('User not found')
		}

		return {
			name: user.name || '',
			email: user.email,
			businessName: user.businessName || '',
			streetAddress: user.streetAddress || '',
			suburb: user.suburb || '',
			state: user.state || '',
			phoneNumber: user.phoneNumber || '',
			businessWebsite: user.businessWebsite || '',
			businessABN: user.businessABN || ''
		}
	}

	async updateProfile(email: string, dto: any) {
		const parsed = updateProfileSchema.safeParse(dto)
		if (!parsed.success) {
			throw new BadRequestException('Invalid input')
		}

		const { name, businessName, streetAddress, suburb, state, phoneNumber, businessWebsite, businessABN } = parsed.data
		const db = await this.databaseService.getDb()

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
			{ email },
			{ $set: updateData }
		)

		return { ok: true, ...updateData }
	}
}


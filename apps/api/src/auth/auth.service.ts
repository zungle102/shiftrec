import { Injectable, ConflictException, BadRequestException } from '@nestjs/common'
import { DatabaseService } from '../database/database.service'
import { hash } from 'bcryptjs'
import { signupSchema } from './dto/signup.dto'

@Injectable()
export class AuthService {
	constructor(private readonly databaseService: DatabaseService) {}

	async signup(dto: { name: string; email: string; password: string }) {
		const parsed = signupSchema.safeParse(dto)
		if (!parsed.success) {
			throw new BadRequestException('Invalid input')
		}

		const { name, email, password } = parsed.data
		const db = await this.databaseService.getDb()

		const existing = await db.collection('users').findOne({ email })
		if (existing) {
			throw new ConflictException('Email already in use')
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

		return { ok: true }
	}
}


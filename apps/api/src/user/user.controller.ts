import { Controller, Get, Patch, Body, Req, UnauthorizedException } from '@nestjs/common'
import { UserService } from './user.service'
import { UpdateProfileDto } from './dto/profile.dto'
import { Request } from 'express'

// Simple authentication - expects email in headers from NextAuth session
// In production, you'd use proper JWT tokens
@Controller('user')
export class UserController {
	constructor(private readonly userService: UserService) {}

	private getEmailFromRequest(req: Request): string {
		const email = req.headers['x-user-email'] as string
		if (!email) {
			throw new UnauthorizedException('Email required in headers')
		}
		return email
	}

	@Get('profile')
	async getProfile(@Req() req: Request) {
		const email = this.getEmailFromRequest(req)
		return this.userService.getProfile(email)
	}

	@Patch('profile')
	async updateProfile(@Req() req: Request, @Body() dto: UpdateProfileDto) {
		const email = this.getEmailFromRequest(req)
		return this.userService.updateProfile(email, dto)
	}
}


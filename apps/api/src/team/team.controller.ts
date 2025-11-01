import { Controller, Get, Post, Patch, Delete, Body, Param, Query, Req, UnauthorizedException } from '@nestjs/common'
import { TeamService } from './team.service'
import { CreateStaffMemberDto, UpdateStaffMemberDto } from './dto/staff-member.dto'
import { Request } from 'express'

@Controller('team')
export class TeamController {
	constructor(private readonly teamService: TeamService) {}

	private getEmailFromRequest(req: Request): string {
		const email = req.headers['x-user-email'] as string
		if (!email) {
			throw new UnauthorizedException('Email required in headers')
		}
		return email
	}

	@Get('members')
	async getStaffMembers(@Req() req: Request, @Query('includeArchived') includeArchived?: string) {
		const email = this.getEmailFromRequest(req)
		return this.teamService.getStaffMembers(email, includeArchived === 'true')
	}

	@Get('members/:id')
	async getStaffMember(@Req() req: Request, @Param('id') id: string) {
		const email = this.getEmailFromRequest(req)
		return this.teamService.getStaffMember(email, id)
	}

	@Post('members')
	async createStaffMember(@Req() req: Request, @Body() dto: CreateStaffMemberDto) {
		const email = this.getEmailFromRequest(req)
		return this.teamService.createStaffMember(email, dto)
	}

	@Patch('members/:id')
	async updateStaffMember(@Req() req: Request, @Param('id') id: string, @Body() dto: UpdateStaffMemberDto) {
		const email = this.getEmailFromRequest(req)
		return this.teamService.updateStaffMember(email, id, dto)
	}

	@Delete('members/:id/permanent')
	async permanentlyDeleteStaffMember(@Req() req: Request, @Param('id') id: string) {
		const email = this.getEmailFromRequest(req)
		return this.teamService.permanentlyDeleteStaffMember(email, id)
	}

	@Delete('members/:id')
	async deleteStaffMember(@Req() req: Request, @Param('id') id: string) {
		const email = this.getEmailFromRequest(req)
		return this.teamService.deleteStaffMember(email, id)
	}

	@Patch('members/:id/restore')
	async restoreStaffMember(@Req() req: Request, @Param('id') id: string) {
		const email = this.getEmailFromRequest(req)
		return this.teamService.restoreStaffMember(email, id)
	}

	@Patch('members/:id/toggle-active')
	async toggleStaffMemberActive(@Req() req: Request, @Param('id') id: string) {
		const email = this.getEmailFromRequest(req)
		return this.teamService.toggleStaffMemberActive(email, id)
	}
}


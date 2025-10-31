import { Controller, Get, Post, Patch, Delete, Body, Param, Query, Req, UnauthorizedException } from '@nestjs/common'
import { TeamService } from './team.service'
import { CreateTeamMemberDto, UpdateTeamMemberDto } from './dto/team-member.dto'
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
	async getTeamMembers(@Req() req: Request, @Query('includeArchived') includeArchived?: string) {
		const email = this.getEmailFromRequest(req)
		return this.teamService.getTeamMembers(email, includeArchived === 'true')
	}

	@Get('members/:id')
	async getTeamMember(@Req() req: Request, @Param('id') id: string) {
		const email = this.getEmailFromRequest(req)
		return this.teamService.getTeamMember(email, id)
	}

	@Post('members')
	async createTeamMember(@Req() req: Request, @Body() dto: CreateTeamMemberDto) {
		const email = this.getEmailFromRequest(req)
		return this.teamService.createTeamMember(email, dto)
	}

	@Patch('members/:id')
	async updateTeamMember(@Req() req: Request, @Param('id') id: string, @Body() dto: UpdateTeamMemberDto) {
		const email = this.getEmailFromRequest(req)
		return this.teamService.updateTeamMember(email, id, dto)
	}

	@Delete('members/:id')
	async deleteTeamMember(@Req() req: Request, @Param('id') id: string) {
		const email = this.getEmailFromRequest(req)
		return this.teamService.deleteTeamMember(email, id)
	}

	@Patch('members/:id/restore')
	async restoreTeamMember(@Req() req: Request, @Param('id') id: string) {
		const email = this.getEmailFromRequest(req)
		return this.teamService.restoreTeamMember(email, id)
	}

	@Patch('members/:id/toggle-active')
	async toggleTeamMemberActive(@Req() req: Request, @Param('id') id: string) {
		const email = this.getEmailFromRequest(req)
		return this.teamService.toggleTeamMemberActive(email, id)
	}
}


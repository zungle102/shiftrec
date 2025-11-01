import { Controller, Get, Post, Patch, Delete, Body, Param, Headers, Query } from '@nestjs/common'
import { ShiftService } from './shift.service'

@Controller('shift')
export class ShiftController {
	constructor(private readonly shiftService: ShiftService) {}

	@Get('shifts')
	async getShifts(
		@Headers('x-user-email') ownerEmail: string, 
		@Query('includeArchived') includeArchived?: string,
		@Query('page') page?: string,
		@Query('limit') limit?: string
	) {
		if (!ownerEmail) {
			return { error: 'Unauthorized' }
		}
		const pageNum = page ? parseInt(page, 10) : 1
		const limitNum = limit ? parseInt(limit, 10) : 100
		return await this.shiftService.getShifts(ownerEmail, includeArchived === 'true', pageNum, limitNum)
	}

	@Get('shifts/:id')
	async getShift(@Headers('x-user-email') ownerEmail: string, @Param('id') shiftId: string) {
		if (!ownerEmail) {
			return { error: 'Unauthorized' }
		}
		return await this.shiftService.getShift(ownerEmail, shiftId)
	}

	@Post('shifts')
	async createShift(@Headers('x-user-email') ownerEmail: string, @Body() dto: any) {
		if (!ownerEmail) {
			return { error: 'Unauthorized' }
		}
		return await this.shiftService.createShift(ownerEmail, dto)
	}

	@Patch('shifts/:id')
	async updateShift(@Headers('x-user-email') ownerEmail: string, @Param('id') shiftId: string, @Body() dto: any) {
		if (!ownerEmail) {
			return { error: 'Unauthorized' }
		}
		return await this.shiftService.updateShift(ownerEmail, shiftId, dto)
	}

	@Delete('shifts/:id/permanent')
	async permanentlyDeleteShift(@Headers('x-user-email') ownerEmail: string, @Param('id') shiftId: string) {
		if (!ownerEmail) {
			return { error: 'Unauthorized' }
		}
		return await this.shiftService.permanentlyDeleteShift(ownerEmail, shiftId)
	}

	@Delete('shifts/:id')
	async deleteShift(@Headers('x-user-email') ownerEmail: string, @Param('id') shiftId: string) {
		if (!ownerEmail) {
			return { error: 'Unauthorized' }
		}
		return await this.shiftService.deleteShift(ownerEmail, shiftId)
	}

	@Patch('shifts/:id/restore')
	async restoreShift(@Headers('x-user-email') ownerEmail: string, @Param('id') shiftId: string) {
		if (!ownerEmail) {
			return { error: 'Unauthorized' }
		}
		return await this.shiftService.restoreShift(ownerEmail, shiftId)
	}
}


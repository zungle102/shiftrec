import { Controller, Get, Post, Patch, Delete, Body, Param, Query, Headers } from '@nestjs/common'
import { ClientService } from './client.service'

@Controller('client')
export class ClientController {
	constructor(private readonly clientService: ClientService) {}

	@Get('clients')
	async getClients(@Headers('x-user-email') ownerEmail: string, @Query('includeArchived') includeArchived?: string) {
		if (!ownerEmail) {
			return { error: 'Unauthorized' }
		}
		return await this.clientService.getClients(ownerEmail, includeArchived === 'true')
	}

	@Get('clients/:id')
	async getClient(@Headers('x-user-email') ownerEmail: string, @Param('id') clientId: string) {
		if (!ownerEmail) {
			return { error: 'Unauthorized' }
		}
		return await this.clientService.getClient(ownerEmail, clientId)
	}

	@Post('clients')
	async createClient(@Headers('x-user-email') ownerEmail: string, @Body() dto: any) {
		if (!ownerEmail) {
			return { error: 'Unauthorized' }
		}
		return await this.clientService.createClient(ownerEmail, dto)
	}

	@Patch('clients/:id')
	async updateClient(@Headers('x-user-email') ownerEmail: string, @Param('id') clientId: string, @Body() dto: any) {
		if (!ownerEmail) {
			return { error: 'Unauthorized' }
		}
		return await this.clientService.updateClient(ownerEmail, clientId, dto)
	}

	@Delete('clients/:id')
	async deleteClient(@Headers('x-user-email') ownerEmail: string, @Param('id') clientId: string) {
		if (!ownerEmail) {
			return { error: 'Unauthorized' }
		}
		return await this.clientService.deleteClient(ownerEmail, clientId)
	}

	@Patch('clients/:id/toggle-active')
	async toggleClientActive(@Headers('x-user-email') ownerEmail: string, @Param('id') clientId: string) {
		if (!ownerEmail) {
			return { error: 'Unauthorized' }
		}
		return await this.clientService.toggleClientActive(ownerEmail, clientId)
	}

	@Patch('clients/:id/restore')
	async restoreClient(@Headers('x-user-email') ownerEmail: string, @Param('id') clientId: string) {
		if (!ownerEmail) {
			return { error: 'Unauthorized' }
		}
		return await this.clientService.restoreClient(ownerEmail, clientId)
	}
}


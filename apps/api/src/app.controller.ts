import { Controller, Get } from '@nestjs/common'
import { AppService } from './app.service'
import { DatabaseService } from './database/database.service'

@Controller()
export class AppController {
	constructor(
		private readonly appService: AppService,
		private readonly databaseService: DatabaseService
	) {}

	@Get('health')
	getHealth() {
		return { status: 'ok', timestamp: new Date().toISOString() }
	}

	@Get('id-types')
	async getIdTypes() {
		try {
			const db = await this.databaseService.getDb()
			const idTypes = await db.collection('idTypes')
				.find({ active: true })
				.sort({ order: 1 })
				.toArray()
			
			return idTypes.map(type => ({
				id: type._id.toString(),
				name: type.name,
				order: type.order
			}))
		} catch (error) {
			console.error('Error fetching ID types:', error)
			throw error
		}
	}

	@Get('client-types')
	async getClientTypes() {
		try {
			const db = await this.databaseService.getDb()
			const clientTypes = await db.collection('clientTypes')
				.find({ active: true })
				.sort({ order: 1 })
				.toArray()
			
			return clientTypes.map(type => ({
				id: type._id.toString(),
				name: type.name,
				order: type.order
			}))
		} catch (error) {
			console.error('Error fetching client types:', error)
			throw error
		}
	}
}


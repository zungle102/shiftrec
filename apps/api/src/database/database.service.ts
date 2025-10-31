import { Injectable } from '@nestjs/common'
import clientPromise from '../config/database.config'

@Injectable()
export class DatabaseService {
	async getDb() {
		const client = await clientPromise
		return client.db()
	}
}


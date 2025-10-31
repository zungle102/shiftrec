import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common'
import { DatabaseService } from '../database/database.service'
import { createClientSchema, updateClientSchema } from './dto/client.dto'
import { ObjectId } from 'mongodb'

@Injectable()
export class ClientService {
	constructor(private readonly databaseService: DatabaseService) {}

	async getClients(ownerEmail: string, includeArchived: boolean = false) {
		const db = await this.databaseService.getDb()
		const query: any = { ownerEmail }
		if (!includeArchived) {
			query.archived = { $ne: true }
		}

		const clients = await db.collection('clients').find(
			query,
			{ sort: { createdAt: -1 } }
		).toArray()

		return clients.map(client => ({
			id: client._id.toString(),
			name: client.name,
			address: client.address || '',
			suburb: client.suburb || '',
			state: client.state || '',
			postcode: client.postcode || '',
			clientType: client.clientType || '',
			phoneNumber: client.phoneNumber || '',
			contactPerson: client.contactPerson || '',
			contactPhone: client.contactPhone || '',
			email: client.email || '',
			note: client.note || '',
			active: client.active !== undefined ? client.active : true,
			archived: client.archived === true,
			archivedAt: client.archivedAt || null,
			createdAt: client.createdAt,
			updatedAt: client.updatedAt
		}))
	}

	async getClient(ownerEmail: string, clientId: string) {
		const db = await this.databaseService.getDb()
		const client = await db.collection('clients').findOne({
			_id: new ObjectId(clientId),
			ownerEmail
		})

		if (!client) {
			throw new NotFoundException('Client not found')
		}

		return {
			id: client._id.toString(),
			name: client.name,
			address: client.address || '',
			suburb: client.suburb || '',
			state: client.state || '',
			postcode: client.postcode || '',
			clientType: client.clientType || '',
			phoneNumber: client.phoneNumber || '',
			contactPerson: client.contactPerson || '',
			contactPhone: client.contactPhone || '',
			email: client.email || '',
			note: client.note || '',
			active: client.active !== undefined ? client.active : true,
			archived: client.archived === true,
			archivedAt: client.archivedAt || null,
			createdAt: client.createdAt,
			updatedAt: client.updatedAt
		}
	}

	async createClient(ownerEmail: string, dto: any) {
		const parsed = createClientSchema.safeParse(dto)
		if (!parsed.success) {
			throw new BadRequestException('Invalid input')
		}

		const { name, address, suburb, state, postcode, clientType, phoneNumber, contactPerson, contactPhone, email, note, active } = parsed.data
		const db = await this.databaseService.getDb()

		// Check if client name already exists for this owner
		const existing = await db.collection('clients').findOne({
			ownerEmail,
			name
		})

		if (existing) {
			throw new ConflictException('A client with this name already exists')
		}

		const now = new Date()
		const result = await db.collection('clients').insertOne({
			ownerEmail,
			name,
			address: address || null,
			suburb: suburb || null,
			state: state || null,
			postcode: postcode || null,
			clientType: clientType || null,
			phoneNumber: phoneNumber || null,
			contactPerson: contactPerson || null,
			contactPhone: contactPhone || null,
			email: email || null,
			note: note || null,
			active: active !== undefined ? active : true,
			archived: false,
			createdAt: now,
			updatedAt: now
		})

		return {
			id: result.insertedId.toString(),
			name,
			address: address || '',
			suburb: suburb || '',
			state: state || '',
			postcode: postcode || '',
			clientType: clientType || '',
			phoneNumber: phoneNumber || '',
			contactPerson: contactPerson || '',
			contactPhone: contactPhone || '',
			email: email || '',
			note: note || '',
			active: active !== undefined ? active : true,
			archived: false
		}
	}

	async updateClient(ownerEmail: string, clientId: string, dto: any) {
		const parsed = updateClientSchema.safeParse(dto)
		if (!parsed.success) {
			throw new BadRequestException('Invalid input')
		}

		const { name, address, suburb, state, postcode, clientType, phoneNumber, contactPerson, contactPhone, email, note, active } = parsed.data
		const db = await this.databaseService.getDb()

		// Check if client exists and belongs to owner
		const existing = await db.collection('clients').findOne({
			_id: new ObjectId(clientId),
			ownerEmail
		})

		if (!existing) {
			throw new NotFoundException('Client not found')
		}

		// Check if name is being changed and conflicts with another client
		if (name !== existing.name) {
			const nameConflict = await db.collection('clients').findOne({
				ownerEmail,
				name,
				_id: { $ne: new ObjectId(clientId) }
			})

			if (nameConflict) {
				throw new ConflictException('A client with this name already exists')
			}
		}

		const updateData: any = {
			name,
			updatedAt: new Date()
		}

		if (address !== undefined) updateData.address = address || null
		if (suburb !== undefined) updateData.suburb = suburb || null
		if (state !== undefined) updateData.state = state || null
		if (postcode !== undefined) updateData.postcode = postcode || null
		if (clientType !== undefined) updateData.clientType = clientType || null
		if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber || null
		if (contactPerson !== undefined) updateData.contactPerson = contactPerson || null
		if (contactPhone !== undefined) updateData.contactPhone = contactPhone || null
		if (email !== undefined) updateData.email = email || null
		if (note !== undefined) updateData.note = note || null
		if (active !== undefined) updateData.active = active

		await db.collection('clients').updateOne(
			{ _id: new ObjectId(clientId), ownerEmail },
			{ $set: updateData }
		)

		return {
			id: clientId,
			name,
			address: address || '',
			suburb: suburb || '',
			state: state || '',
			postcode: postcode || '',
			clientType: clientType || '',
			phoneNumber: phoneNumber || '',
			contactPerson: contactPerson || '',
			contactPhone: contactPhone || '',
			email: email || '',
			note: note || '',
			active: active !== undefined ? active : (existing.active !== undefined ? existing.active : true),
			archived: existing.archived === true
		}
	}

	async deleteClient(ownerEmail: string, clientId: string) {
		const db = await this.databaseService.getDb()
		const client = await db.collection('clients').findOne({
			_id: new ObjectId(clientId),
			ownerEmail
		})

		if (!client) {
			throw new NotFoundException('Client not found')
		}

		// Archive instead of delete
		const now = new Date()
		await db.collection('clients').updateOne(
			{ _id: new ObjectId(clientId), ownerEmail },
			{ $set: { archived: true, archivedAt: now, updatedAt: now } }
		)

		return { success: true, archived: true }
	}

	async restoreClient(ownerEmail: string, clientId: string) {
		const db = await this.databaseService.getDb()
		const client = await db.collection('clients').findOne({
			_id: new ObjectId(clientId),
			ownerEmail
		})

		if (!client) {
			throw new NotFoundException('Client not found')
		}

		await db.collection('clients').updateOne(
			{ _id: new ObjectId(clientId), ownerEmail },
			{ $set: { archived: false, updatedAt: new Date() }, $unset: { archivedAt: '' } }
		)

		return {
			id: clientId,
			archived: false
		}
	}

	async toggleClientActive(ownerEmail: string, clientId: string) {
		const db = await this.databaseService.getDb()
		const client = await db.collection('clients').findOne({
			_id: new ObjectId(clientId),
			ownerEmail
		})

		if (!client) {
			throw new NotFoundException('Client not found')
		}

		const newActiveStatus = !(client.active !== undefined ? client.active : true)
		await db.collection('clients').updateOne(
			{ _id: new ObjectId(clientId), ownerEmail },
			{ $set: { active: newActiveStatus, updatedAt: new Date() } }
		)

		return {
			id: clientId,
			active: newActiveStatus
		}
	}
}


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
			{ 
				sort: { createdAt: -1 },
				projection: { password: 0 } // Exclude password if present
			}
		).toArray()

		// Fetch all client types for lookup
		const clientTypesCollection = db.collection('clientTypes')
		const clientTypes = await clientTypesCollection.find({ active: true }).toArray()
		const clientTypeMap = new Map(clientTypes.map(type => [type._id.toString(), type.name]))

		return clients.map(client => {
			// Handle clientTypeId: if it's an ObjectId, look up the name; if it's a string, use it directly (backward compatibility)
			let clientTypeName = ''
			const clientTypeField = client.clientTypeId || client.clientType // Support both old and new field names
			if (clientTypeField) {
				if (clientTypeField instanceof ObjectId || ObjectId.isValid(clientTypeField)) {
					const clientTypeIdStr = clientTypeField instanceof ObjectId ? clientTypeField.toString() : clientTypeField
					clientTypeName = clientTypeMap.get(clientTypeIdStr) || ''
				} else {
					// Backward compatibility: if it's already a string name, use it
					clientTypeName = clientTypeField
				}
			}

			const clientTypeIdValue = clientTypeField instanceof ObjectId ? clientTypeField.toString() : (ObjectId.isValid(clientTypeField) ? clientTypeField : '')

			return {
				id: client._id.toString(),
				name: client.name,
				address: client.address || '',
				suburb: client.suburb || '',
				state: client.state || '',
				postcode: client.postcode || '',
				clientType: clientTypeName,
				clientTypeId: clientTypeIdValue,
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
		})
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

		// Fetch client types for lookup
		const clientTypesCollection = db.collection('clientTypes')
		const clientTypes = await clientTypesCollection.find({ active: true }).toArray()
		const clientTypeMap = new Map(clientTypes.map(type => [type._id.toString(), type.name]))

		// Handle clientTypeId: if it's an ObjectId, look up the name; if it's a string, use it directly (backward compatibility)
		let clientTypeName = ''
		let clientTypeId = ''
		const clientTypeField = client.clientTypeId || client.clientType // Support both old and new field names
		if (clientTypeField) {
			if (clientTypeField instanceof ObjectId || ObjectId.isValid(clientTypeField)) {
				const clientTypeIdStr = clientTypeField instanceof ObjectId ? clientTypeField.toString() : clientTypeField
				clientTypeName = clientTypeMap.get(clientTypeIdStr) || ''
				clientTypeId = clientTypeIdStr
			} else {
				// Backward compatibility: if it's already a string name, use it
				clientTypeName = clientTypeField
			}
		}

		return {
			id: client._id.toString(),
			name: client.name,
			address: client.address || '',
			suburb: client.suburb || '',
			state: client.state || '',
			postcode: client.postcode || '',
			clientType: clientTypeName,
			clientTypeId: clientTypeId,
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

		const { name, address, suburb, state, postcode, clientTypeId, phoneNumber, contactPerson, contactPhone, email, note, active } = parsed.data
		const db = await this.databaseService.getDb()

		// Check if client name already exists for this owner
		const existing = await db.collection('clients').findOne({
			ownerEmail,
			name
		})

		if (existing) {
			throw new ConflictException('A client with this name already exists')
		}

		// Convert clientTypeId string ID to ObjectId if provided and valid
		let clientTypeObjectId = null
		if (clientTypeId && clientTypeId.trim() !== '') {
			if (ObjectId.isValid(clientTypeId)) {
				clientTypeObjectId = new ObjectId(clientTypeId)
			} else {
				throw new BadRequestException('Invalid client type reference')
			}
		}

		const now = new Date()
		const result = await db.collection('clients').insertOne({
			ownerEmail,
			name,
			address: address || null,
			suburb: suburb || null,
			state: state || null,
			postcode: postcode || null,
			clientTypeId: clientTypeObjectId,
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

		// Fetch client type name for response
		let clientTypeName = ''
		if (clientTypeObjectId) {
			const clientTypeDoc = await db.collection('clientTypes').findOne({ _id: clientTypeObjectId, active: true })
			if (clientTypeDoc) {
				clientTypeName = clientTypeDoc.name
			}
		}

		return {
			id: result.insertedId.toString(),
			name,
			address: address || '',
			suburb: suburb || '',
			state: state || '',
			postcode: postcode || '',
			clientType: clientTypeName,
			clientTypeId: clientTypeObjectId ? clientTypeObjectId.toString() : '',
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

		const { name, address, suburb, state, postcode, clientTypeId, phoneNumber, contactPerson, contactPhone, email, note, active } = parsed.data
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
		if (clientTypeId !== undefined) {
			// Convert clientTypeId string ID to ObjectId if provided and valid
			if (clientTypeId && clientTypeId.trim() !== '') {
				if (ObjectId.isValid(clientTypeId)) {
					updateData.clientTypeId = new ObjectId(clientTypeId)
				} else {
					throw new BadRequestException('Invalid client type reference')
				}
			} else {
				updateData.clientTypeId = null
			}
		}
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

		// Fetch client type name for response
		let clientTypeName = ''
		let clientTypeIdStr = ''
		const updatedClientTypeId = updateData.clientTypeId || existing.clientTypeId || existing.clientType // Support both old and new field names
		if (updatedClientTypeId) {
			const clientTypeIdValue = updatedClientTypeId instanceof ObjectId ? updatedClientTypeId : new ObjectId(updatedClientTypeId)
			clientTypeIdStr = clientTypeIdValue.toString()
			const clientTypeDoc = await db.collection('clientTypes').findOne({ _id: clientTypeIdValue, active: true })
			if (clientTypeDoc) {
				clientTypeName = clientTypeDoc.name
			}
		}

		return {
			id: clientId,
			name,
			address: address || '',
			suburb: suburb || '',
			state: state || '',
			postcode: postcode || '',
			clientType: clientTypeName,
			clientTypeId: clientTypeIdStr,
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

	async permanentlyDeleteClient(ownerEmail: string, clientId: string) {
		const db = await this.databaseService.getDb()
		
		// First check if client exists and is archived
		const client = await db.collection('clients').findOne({
			_id: new ObjectId(clientId),
			ownerEmail
		})

		if (!client) {
			throw new NotFoundException('Client not found')
		}

		if (!client.archived) {
			throw new BadRequestException('Only archived clients can be permanently deleted')
		}

		// Permanently delete the client
		const result = await db.collection('clients').deleteOne({
			_id: new ObjectId(clientId),
			ownerEmail
		})

		if (result.deletedCount === 0) {
			throw new NotFoundException('Client not found')
		}

		return { success: true, deleted: true }
	}
}


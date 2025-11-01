import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common'
import { DatabaseService } from '../database/database.service'
import { createStaffMemberSchema, updateStaffMemberSchema } from './dto/staff-member.dto'
import { ObjectId } from 'mongodb'

@Injectable()
export class TeamService {
	constructor(private readonly databaseService: DatabaseService) {}

	async getStaffMembers(ownerEmail: string, includeArchived: boolean = false) {
		const db = await this.databaseService.getDb()
		const query: any = { ownerEmail }
		if (!includeArchived) {
			query.archived = { $ne: true }
		}

		console.log('[TeamService] getStaffMembers - Database name:', db.databaseName)
		console.log('[TeamService] getStaffMembers - ownerEmail:', ownerEmail)
		console.log('[TeamService] getStaffMembers - includeArchived:', includeArchived)
		console.log('[TeamService] getStaffMembers - query:', JSON.stringify(query))
		
		// Check if collection exists and count total documents
		const collection = db.collection('staffMembers')
		const totalCount = await collection.countDocuments({})
		console.log('[TeamService] Total documents in staffMembers collection:', totalCount)
		
		// Check documents with matching ownerEmail
		const matchingCount = await collection.countDocuments({ ownerEmail })
		console.log('[TeamService] Documents with matching ownerEmail:', matchingCount)
		
		// Get a sample document to see structure
		const sample = await collection.findOne({})
		if (sample) {
			console.log('[TeamService] Sample document ownerEmail:', sample.ownerEmail)
			console.log('[TeamService] Sample document archived:', sample.archived)
		}

		const members = await collection.find(
			query,
			{ 
				sort: { createdAt: -1 },
				projection: { password: 0 } // Exclude password if present
			}
		).toArray()
		
		console.log('[TeamService] Found members:', members.length)

		// Fetch all ID types for lookup
		const idTypesCollection = db.collection('idTypes')
		const idTypes = await idTypesCollection.find({ active: true }).toArray()
		const idTypeMap = new Map(idTypes.map(type => [type._id.toString(), type.name]))

		return members.map(member => {
			// Handle idTypeId: if it's an ObjectId, look up the name; if it's a string, use it directly (backward compatibility)
			let idTypeName = ''
			const idTypeField = member.idTypeId || member.idType // Support both old and new field names
			if (idTypeField) {
				if (idTypeField instanceof ObjectId || ObjectId.isValid(idTypeField)) {
					const idTypeIdStr = idTypeField instanceof ObjectId ? idTypeField.toString() : idTypeField
					idTypeName = idTypeMap.get(idTypeIdStr) || ''
				} else {
					// Backward compatibility: if it's already a string name, use it
					idTypeName = idTypeField
				}
			}

			const idTypeIdValue = idTypeField instanceof ObjectId ? idTypeField.toString() : (ObjectId.isValid(idTypeField) ? idTypeField : '')

			return {
				id: member._id.toString(),
				name: member.name,
				email: member.email,
				phone: member.phone || '',
				idType: idTypeName,
				idTypeId: idTypeIdValue,
				idNumber: member.idNumber || '',
				address: member.address || '',
				suburb: member.suburb || '',
				state: member.state || '',
				postcode: member.postcode || '',
				active: member.active !== undefined ? member.active : true,
				archived: member.archived === true,
				archivedAt: member.archivedAt || null,
				createdAt: member.createdAt,
				updatedAt: member.updatedAt
			}
		})
	}

	async getStaffMember(ownerEmail: string, memberId: string) {
		const db = await this.databaseService.getDb()
		const member = await db.collection('staffMembers').findOne({
			_id: new ObjectId(memberId),
			ownerEmail
		})

		if (!member) {
			throw new NotFoundException('Team member not found')
		}

		// Fetch ID types for lookup
		const idTypesCollection = db.collection('idTypes')
		const idTypes = await idTypesCollection.find({ active: true }).toArray()
		const idTypeMap = new Map(idTypes.map(type => [type._id.toString(), type.name]))

		// Handle idTypeId: if it's an ObjectId, look up the name; if it's a string, use it directly (backward compatibility)
		let idTypeName = ''
		let idTypeId = ''
		const idTypeField = member.idTypeId || member.idType // Support both old and new field names
		if (idTypeField) {
			if (idTypeField instanceof ObjectId || ObjectId.isValid(idTypeField)) {
				const idTypeIdStr = idTypeField instanceof ObjectId ? idTypeField.toString() : idTypeField
				idTypeName = idTypeMap.get(idTypeIdStr) || ''
				idTypeId = idTypeIdStr
			} else {
				// Backward compatibility: if it's already a string name, use it
				idTypeName = idTypeField
			}
		}

		return {
			id: member._id.toString(),
			name: member.name,
			email: member.email,
			phone: member.phone || '',
			idType: idTypeName,
			idTypeId: idTypeId,
			idNumber: member.idNumber || '',
			address: member.address || '',
			suburb: member.suburb || '',
			state: member.state || '',
			postcode: member.postcode || '',
			active: member.active !== undefined ? member.active : true,
			archived: member.archived === true,
			archivedAt: member.archivedAt || null,
			createdAt: member.createdAt,
			updatedAt: member.updatedAt
		}
	}

	async createStaffMember(ownerEmail: string, dto: any) {
		const parsed = createStaffMemberSchema.safeParse(dto)
		if (!parsed.success) {
			throw new BadRequestException('Invalid input')
		}

		const { name, email, phone, idTypeId, idNumber, address, suburb, state, postcode } = parsed.data
		const db = await this.databaseService.getDb()

		// Check if email already exists for this owner
		const existing = await db.collection('staffMembers').findOne({
			ownerEmail,
			email
		})

		if (existing) {
			throw new ConflictException('A staff member with this email already exists')
		}

		// Convert idTypeId string ID to ObjectId if provided and valid
		let idTypeObjectId: ObjectId | null = null
		if (idTypeId && idTypeId.trim() !== '') {
			if (ObjectId.isValid(idTypeId)) {
				idTypeObjectId = new ObjectId(idTypeId)
			} else {
				throw new BadRequestException('Invalid ID type reference')
			}
		}

		const now = new Date()
		const result = await db.collection('staffMembers').insertOne({
			ownerEmail,
			name,
			email,
			phone: phone || null,
			idTypeId: idTypeObjectId,
			idNumber: idNumber || null,
			address: address || null,
			suburb: suburb || null,
			state: state || null,
			postcode: postcode || null,
			active: true,
			archived: false,
			createdAt: now,
			updatedAt: now
		})

		// Fetch ID type name for response
		let idTypeName = ''
		if (idTypeObjectId) {
			const idTypeDoc = await db.collection('idTypes').findOne({ _id: idTypeObjectId, active: true })
			if (idTypeDoc) {
				idTypeName = idTypeDoc.name
			}
		}

		return {
			id: result.insertedId.toString(),
			name,
			email,
			phone: phone || '',
			idType: idTypeName,
			idTypeId: idTypeObjectId ? idTypeObjectId.toString() : '',
			idNumber: idNumber || '',
			address: address || '',
			suburb: suburb || '',
			state: state || '',
			postcode: postcode || '',
			active: true,
			archived: false
		}
	}

	async updateStaffMember(ownerEmail: string, memberId: string, dto: any) {
		const parsed = updateStaffMemberSchema.safeParse(dto)
		if (!parsed.success) {
			throw new BadRequestException('Invalid input')
		}

		const { name, email, phone, idTypeId, idNumber, address, suburb, state, postcode } = parsed.data
		const db = await this.databaseService.getDb()

		// Check if member exists and belongs to owner
		const existing = await db.collection('staffMembers').findOne({
			_id: new ObjectId(memberId),
			ownerEmail
		})

		if (!existing) {
			throw new NotFoundException('Staff member not found')
		}

		// Check if email is being changed and conflicts with another member
		if (email !== existing.email) {
			const emailConflict = await db.collection('staffMembers').findOne({
				ownerEmail,
				email,
				_id: { $ne: new ObjectId(memberId) }
			})

			if (emailConflict) {
				throw new ConflictException('A staff member with this email already exists')
			}
		}

		const updateData: any = {
			name,
			email,
			updatedAt: new Date()
		}

		if (phone !== undefined) updateData.phone = phone || null
		if (idTypeId !== undefined) {
			// Convert idTypeId string ID to ObjectId if provided and valid
			if (idTypeId && idTypeId.trim() !== '') {
				if (ObjectId.isValid(idTypeId)) {
					updateData.idTypeId = new ObjectId(idTypeId)
				} else {
					throw new BadRequestException('Invalid ID type reference')
				}
			} else {
				updateData.idTypeId = null
			}
		}
		if (idNumber !== undefined) updateData.idNumber = idNumber || null
		if (address !== undefined) updateData.address = address || null
		if (suburb !== undefined) updateData.suburb = suburb || null
		if (state !== undefined) updateData.state = state || null
		if (postcode !== undefined) updateData.postcode = postcode || null

		await db.collection('staffMembers').updateOne(
			{ _id: new ObjectId(memberId), ownerEmail },
			{ $set: updateData }
		)

		// Fetch ID type name for response
		let idTypeName = ''
		let idTypeIdStr = ''
		const updatedIdTypeId = updateData.idTypeId || existing.idTypeId || existing.idType // Support both old and new field names
		if (updatedIdTypeId) {
			const idTypeIdValue = updatedIdTypeId instanceof ObjectId ? updatedIdTypeId : new ObjectId(updatedIdTypeId)
			idTypeIdStr = idTypeIdValue.toString()
			const idTypeDoc = await db.collection('idTypes').findOne({ _id: idTypeIdValue, active: true })
			if (idTypeDoc) {
				idTypeName = idTypeDoc.name
			}
		}

		return {
			id: memberId,
			name,
			email,
			phone: phone || '',
			idType: idTypeName,
			idTypeId: idTypeId,
			idNumber: idNumber || '',
			address: address || '',
			suburb: suburb || '',
			state: state || '',
			postcode: postcode || '',
			active: existing.active !== undefined ? existing.active : true,
			archived: existing.archived === true
		}
	}

	async deleteStaffMember(ownerEmail: string, memberId: string) {
		const db = await this.databaseService.getDb()
		const member = await db.collection('staffMembers').findOne({
			_id: new ObjectId(memberId),
			ownerEmail
		})

		if (!member) {
			throw new NotFoundException('Staff member not found')
		}

		// Archive instead of delete
		const now = new Date()
		await db.collection('staffMembers').updateOne(
			{ _id: new ObjectId(memberId), ownerEmail },
			{ $set: { archived: true, archivedAt: now, updatedAt: now } }
		)

		return { success: true, archived: true }
	}

	async restoreStaffMember(ownerEmail: string, memberId: string) {
		const db = await this.databaseService.getDb()
		const member = await db.collection('staffMembers').findOne({
			_id: new ObjectId(memberId),
			ownerEmail
		})

		if (!member) {
			throw new NotFoundException('Staff member not found')
		}

		await db.collection('staffMembers').updateOne(
			{ _id: new ObjectId(memberId), ownerEmail },
			{ $set: { archived: false, updatedAt: new Date() }, $unset: { archivedAt: '' } }
		)

		return {
			id: memberId,
			archived: false
		}
	}

	async toggleStaffMemberActive(ownerEmail: string, memberId: string) {
		const db = await this.databaseService.getDb()
		const member = await db.collection('staffMembers').findOne({
			_id: new ObjectId(memberId),
			ownerEmail
		})

		if (!member) {
			throw new NotFoundException('Staff member not found')
		}

		const newActiveStatus = !(member.active !== undefined ? member.active : true)
		await db.collection('staffMembers').updateOne(
			{ _id: new ObjectId(memberId), ownerEmail },
			{ $set: { active: newActiveStatus, updatedAt: new Date() } }
		)

		return {
			id: memberId,
			active: newActiveStatus
		}
	}

	async permanentlyDeleteStaffMember(ownerEmail: string, memberId: string) {
		const db = await this.databaseService.getDb()
		
		// First check if staff member exists and is archived
		const member = await db.collection('staffMembers').findOne({
			_id: new ObjectId(memberId),
			ownerEmail
		})

		if (!member) {
			throw new NotFoundException('Staff member not found')
		}

		if (!member.archived) {
			throw new BadRequestException('Only archived staff members can be permanently deleted')
		}

		// Permanently delete the staff member
		const result = await db.collection('staffMembers').deleteOne({
			_id: new ObjectId(memberId),
			ownerEmail
		})

		if (result.deletedCount === 0) {
			throw new NotFoundException('Staff member not found')
		}

		return { success: true, deleted: true }
	}
}


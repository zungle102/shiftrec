import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common'
import { DatabaseService } from '../database/database.service'
import { createTeamMemberSchema, updateTeamMemberSchema } from './dto/team-member.dto'
import { ObjectId } from 'mongodb'

@Injectable()
export class TeamService {
	constructor(private readonly databaseService: DatabaseService) {}

	async getTeamMembers(ownerEmail: string, includeArchived: boolean = false) {
		const db = await this.databaseService.getDb()
		const query: any = { ownerEmail }
		if (!includeArchived) {
			query.archived = { $ne: true }
		}

		const members = await db.collection('teamMembers').find(
			query,
			{ sort: { createdAt: -1 } }
		).toArray()

		return members.map(member => ({
			id: member._id.toString(),
			name: member.name,
			email: member.email,
			phone: member.phone || '',
			idType: member.idType || '',
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
		}))
	}

	async getTeamMember(ownerEmail: string, memberId: string) {
		const db = await this.databaseService.getDb()
		const member = await db.collection('teamMembers').findOne({
			_id: new ObjectId(memberId),
			ownerEmail
		})

		if (!member) {
			throw new NotFoundException('Team member not found')
		}

		return {
			id: member._id.toString(),
			name: member.name,
			email: member.email,
			phone: member.phone || '',
			idType: member.idType || '',
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

	async createTeamMember(ownerEmail: string, dto: any) {
		const parsed = createTeamMemberSchema.safeParse(dto)
		if (!parsed.success) {
			throw new BadRequestException('Invalid input')
		}

		const { name, email, phone, idType, idNumber, address, suburb, state, postcode } = parsed.data
		const db = await this.databaseService.getDb()

		// Check if email already exists for this owner
		const existing = await db.collection('teamMembers').findOne({
			ownerEmail,
			email
		})

		if (existing) {
			throw new ConflictException('A team member with this email already exists')
		}

		const now = new Date()
		const result = await db.collection('teamMembers').insertOne({
			ownerEmail,
			name,
			email,
			phone: phone || null,
			idType: idType || null,
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

		return {
			id: result.insertedId.toString(),
			name,
			email,
			phone: phone || '',
			idType: idType || '',
			idNumber: idNumber || '',
			address: address || '',
			suburb: suburb || '',
			state: state || '',
			postcode: postcode || '',
			active: true,
			archived: false
		}
	}

	async updateTeamMember(ownerEmail: string, memberId: string, dto: any) {
		const parsed = updateTeamMemberSchema.safeParse(dto)
		if (!parsed.success) {
			throw new BadRequestException('Invalid input')
		}

		const { name, email, phone, idType, idNumber, address, suburb, state, postcode } = parsed.data
		const db = await this.databaseService.getDb()

		// Check if member exists and belongs to owner
		const existing = await db.collection('teamMembers').findOne({
			_id: new ObjectId(memberId),
			ownerEmail
		})

		if (!existing) {
			throw new NotFoundException('Team member not found')
		}

		// Check if email is being changed and conflicts with another member
		if (email !== existing.email) {
			const emailConflict = await db.collection('teamMembers').findOne({
				ownerEmail,
				email,
				_id: { $ne: new ObjectId(memberId) }
			})

			if (emailConflict) {
				throw new ConflictException('A team member with this email already exists')
			}
		}

		const updateData: any = {
			name,
			email,
			updatedAt: new Date()
		}

		if (phone !== undefined) updateData.phone = phone || null
		if (idType !== undefined) updateData.idType = idType || null
		if (idNumber !== undefined) updateData.idNumber = idNumber || null
		if (address !== undefined) updateData.address = address || null
		if (suburb !== undefined) updateData.suburb = suburb || null
		if (state !== undefined) updateData.state = state || null
		if (postcode !== undefined) updateData.postcode = postcode || null

		await db.collection('teamMembers').updateOne(
			{ _id: new ObjectId(memberId), ownerEmail },
			{ $set: updateData }
		)

		return {
			id: memberId,
			name,
			email,
			phone: phone || '',
			idType: idType || '',
			idNumber: idNumber || '',
			address: address || '',
			suburb: suburb || '',
			state: state || '',
			postcode: postcode || '',
			active: existing.active !== undefined ? existing.active : true,
			archived: existing.archived === true
		}
	}

	async deleteTeamMember(ownerEmail: string, memberId: string) {
		const db = await this.databaseService.getDb()
		const member = await db.collection('teamMembers').findOne({
			_id: new ObjectId(memberId),
			ownerEmail
		})

		if (!member) {
			throw new NotFoundException('Team member not found')
		}

		// Archive instead of delete
		const now = new Date()
		await db.collection('teamMembers').updateOne(
			{ _id: new ObjectId(memberId), ownerEmail },
			{ $set: { archived: true, archivedAt: now, updatedAt: now } }
		)

		return { success: true, archived: true }
	}

	async restoreTeamMember(ownerEmail: string, memberId: string) {
		const db = await this.databaseService.getDb()
		const member = await db.collection('teamMembers').findOne({
			_id: new ObjectId(memberId),
			ownerEmail
		})

		if (!member) {
			throw new NotFoundException('Team member not found')
		}

		await db.collection('teamMembers').updateOne(
			{ _id: new ObjectId(memberId), ownerEmail },
			{ $set: { archived: false, updatedAt: new Date() }, $unset: { archivedAt: '' } }
		)

		return {
			id: memberId,
			archived: false
		}
	}

	async toggleTeamMemberActive(ownerEmail: string, memberId: string) {
		const db = await this.databaseService.getDb()
		const member = await db.collection('teamMembers').findOne({
			_id: new ObjectId(memberId),
			ownerEmail
		})

		if (!member) {
			throw new NotFoundException('Team member not found')
		}

		const newActiveStatus = !(member.active !== undefined ? member.active : true)
		await db.collection('teamMembers').updateOne(
			{ _id: new ObjectId(memberId), ownerEmail },
			{ $set: { active: newActiveStatus, updatedAt: new Date() } }
		)

		return {
			id: memberId,
			active: newActiveStatus
		}
	}

	async permanentlyDeleteTeamMember(ownerEmail: string, memberId: string) {
		const db = await this.databaseService.getDb()
		
		// First check if team member exists and is archived
		const member = await db.collection('teamMembers').findOne({
			_id: new ObjectId(memberId),
			ownerEmail
		})

		if (!member) {
			throw new NotFoundException('Team member not found')
		}

		if (!member.archived) {
			throw new BadRequestException('Only archived team members can be permanently deleted')
		}

		// Permanently delete the team member
		const result = await db.collection('teamMembers').deleteOne({
			_id: new ObjectId(memberId),
			ownerEmail
		})

		if (result.deletedCount === 0) {
			throw new NotFoundException('Team member not found')
		}

		return { success: true, deleted: true }
	}
}


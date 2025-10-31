import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { DatabaseService } from '../database/database.service'
import { createShiftSchema, updateShiftSchema } from './dto/shift.dto'
import { ObjectId } from 'mongodb'

@Injectable()
export class ShiftService {
	constructor(private readonly databaseService: DatabaseService) {}

	async getShifts(ownerEmail: string, includeArchived: boolean = false) {
		const db = await this.databaseService.getDb()
		const query: any = { ownerEmail }
		if (!includeArchived) {
			query.archived = { $ne: true }
		}
		const shifts = await db.collection('shifts').find(
			query,
			{ sort: { serviceDate: -1, startTime: -1 } }
		).toArray()

		return Promise.all(shifts.map(async shift => {
			let teamMemberName = ''
			if (shift.teamMemberId) {
				const teamMember = await db.collection('teamMembers').findOne({
					_id: new ObjectId(shift.teamMemberId),
					ownerEmail
				})
				if (teamMember) {
					teamMemberName = teamMember.name
				}
			}

			return {
				id: shift._id.toString(),
				serviceDate: shift.serviceDate,
				startTime: shift.startTime,
				endTime: shift.endTime,
				breakDuration: shift.breakDuration || '0',
				serviceType: shift.serviceType || '',
				clientName: shift.clientName,
				clientLocation: shift.clientLocation || '',
				clientType: shift.clientType || '',
				clientEmail: shift.clientEmail || '',
				clientPhoneNumber: shift.clientPhoneNumber || '',
				clientContactPerson: shift.clientContactPerson || '',
				clientContactPhone: shift.clientContactPhone || '',
				teamMemberId: shift.teamMemberId || '',
				teamMemberName: teamMemberName,
				status: shift.status || 'Planned',
				note: shift.note || '',
				archived: shift.archived || false,
				archivedAt: shift.archivedAt || null,
				createdAt: shift.createdAt,
				updatedAt: shift.updatedAt
			}
		}))
	}

	async getShift(ownerEmail: string, shiftId: string) {
		const db = await this.databaseService.getDb()
		const shift = await db.collection('shifts').findOne({
			_id: new ObjectId(shiftId),
			ownerEmail
		})

		if (!shift) {
			throw new NotFoundException('Shift not found')
		}

		let teamMemberName = ''
		if (shift.teamMemberId) {
			const teamMember = await db.collection('teamMembers').findOne({
				_id: new ObjectId(shift.teamMemberId),
				ownerEmail
			})
			if (teamMember) {
				teamMemberName = teamMember.name
			}
		}

		return {
			id: shift._id.toString(),
			serviceDate: shift.serviceDate,
			startTime: shift.startTime,
			endTime: shift.endTime,
			breakDuration: shift.breakDuration || '0',
			serviceType: shift.serviceType || '',
			clientName: shift.clientName,
			clientLocation: shift.clientLocation || '',
			clientType: shift.clientType || '',
			clientEmail: shift.clientEmail || '',
			clientPhoneNumber: shift.clientPhoneNumber || '',
			clientContactPerson: shift.clientContactPerson || '',
			clientContactPhone: shift.clientContactPhone || '',
			teamMemberId: shift.teamMemberId || '',
			teamMemberName: teamMemberName,
			note: shift.note || '',
			archived: shift.archived || false,
			archivedAt: shift.archivedAt || null,
			createdAt: shift.createdAt,
			updatedAt: shift.updatedAt
		}
	}

	async createShift(ownerEmail: string, dto: any) {
		const parsed = createShiftSchema.safeParse(dto)
		if (!parsed.success) {
			throw new BadRequestException('Invalid input')
		}

		const {
			serviceDate,
			startTime,
			endTime,
			breakDuration,
			serviceType,
			clientName,
			clientLocation,
			clientType,
			clientEmail,
			clientPhoneNumber,
			clientContactPerson,
			clientContactPhone,
			teamMemberId,
			note
		} = parsed.data

		const db = await this.databaseService.getDb()

		let teamMemberName = ''
		if (teamMemberId) {
			const teamMember = await db.collection('teamMembers').findOne({
				_id: new ObjectId(teamMemberId),
				ownerEmail
			})
			if (teamMember) {
				teamMemberName = teamMember.name
			}
		}

		const now = new Date()
		// Automatically set status to "Assigned" if team member is provided
		const finalStatus = teamMemberId ? 'Assigned' : (status || 'Planned')
		const result = await db.collection('shifts').insertOne({
			ownerEmail,
			serviceDate,
			startTime,
			endTime,
			breakDuration: breakDuration || '0',
			serviceType: serviceType || null,
			clientName,
			clientLocation: clientLocation || null,
			clientType: clientType || null,
			clientEmail: clientEmail || null,
			clientPhoneNumber: clientPhoneNumber || null,
			clientContactPerson: clientContactPerson || null,
			clientContactPhone: clientContactPhone || null,
			teamMemberId: teamMemberId || null,
			status: finalStatus,
			note: note || null,
			archived: false,
			createdAt: now,
			updatedAt: now
		})

		return {
			id: result.insertedId.toString(),
			serviceDate,
			startTime,
			endTime,
			breakDuration: breakDuration || '0',
			serviceType: serviceType || '',
			clientName,
			clientLocation: clientLocation || '',
			clientType: clientType || '',
			clientEmail: clientEmail || '',
			clientPhoneNumber: clientPhoneNumber || '',
			clientContactPerson: clientContactPerson || '',
			clientContactPhone: clientContactPhone || '',
			teamMemberId: teamMemberId || '',
			teamMemberName: teamMemberName,
			status: finalStatus,
			note: note || ''
		}
	}

	async updateShift(ownerEmail: string, shiftId: string, dto: any) {
		const parsed = updateShiftSchema.safeParse(dto)
		if (!parsed.success) {
			throw new BadRequestException('Invalid input')
		}

		const {
			serviceDate,
			startTime,
			endTime,
			breakDuration,
			serviceType,
			clientName,
			clientLocation,
			clientType,
			clientEmail,
			clientPhoneNumber,
			clientContactPerson,
			clientContactPhone,
			teamMemberId,
			note
		} = parsed.data

		const db = await this.databaseService.getDb()

		// Check if shift exists and belongs to owner
		const existing = await db.collection('shifts').findOne({
			_id: new ObjectId(shiftId),
			ownerEmail
		})

		if (!existing) {
			throw new NotFoundException('Shift not found')
		}

		let teamMemberName = ''
		if (teamMemberId) {
			const teamMember = await db.collection('teamMembers').findOne({
				_id: new ObjectId(teamMemberId),
				ownerEmail
			})
			if (teamMember) {
				teamMemberName = teamMember.name
			}
		}

		const updateData: any = {
			serviceDate,
			startTime,
			endTime,
			breakDuration: breakDuration || '0',
			clientName,
			updatedAt: new Date()
		}

		if (serviceType !== undefined) updateData.serviceType = serviceType || null
		if (clientLocation !== undefined) updateData.clientLocation = clientLocation || null
		if (clientType !== undefined) updateData.clientType = clientType || null
		if (clientEmail !== undefined) updateData.clientEmail = clientEmail || null
		if (clientPhoneNumber !== undefined) updateData.clientPhoneNumber = clientPhoneNumber || null
		if (clientContactPerson !== undefined) updateData.clientContactPerson = clientContactPerson || null
		if (clientContactPhone !== undefined) updateData.clientContactPhone = clientContactPhone || null
		if (teamMemberId !== undefined) {
			updateData.teamMemberId = teamMemberId || null
			// Automatically set status to "Assigned" if team member is assigned
			if (teamMemberId) {
				updateData.status = 'Assigned'
			}
		}
		if (status !== undefined && updateData.status === undefined) {
			updateData.status = status || 'Planned'
		}
		if (note !== undefined) updateData.note = note || null

		await db.collection('shifts').updateOne(
			{ _id: new ObjectId(shiftId), ownerEmail },
			{ $set: updateData }
		)

		// Determine final status - if team member was assigned, use "Assigned", otherwise use provided status or existing status
		const finalStatus = (teamMemberId && !status) ? 'Assigned' : (status || existing.status || 'Planned')
		
		return {
			id: shiftId,
			serviceDate,
			startTime,
			endTime,
			breakDuration: breakDuration || '0',
			serviceType: serviceType || '',
			clientName,
			clientLocation: clientLocation || '',
			clientType: clientType || '',
			clientEmail: clientEmail || '',
			clientPhoneNumber: clientPhoneNumber || '',
			clientContactPerson: clientContactPerson || '',
			clientContactPhone: clientContactPhone || '',
			teamMemberId: teamMemberId || '',
			teamMemberName: teamMemberName,
			status: updateData.status || finalStatus,
			note: note || ''
		}
	}

	async deleteShift(ownerEmail: string, shiftId: string) {
		const db = await this.databaseService.getDb()
		const now = new Date()
		const result = await db.collection('shifts').updateOne(
			{ _id: new ObjectId(shiftId), ownerEmail },
			{ $set: { archived: true, archivedAt: now, updatedAt: now } }
		)

		if (result.matchedCount === 0) {
			throw new NotFoundException('Shift not found')
		}

		return { success: true, archived: true }
	}

	async restoreShift(ownerEmail: string, shiftId: string) {
		const db = await this.databaseService.getDb()
		const result = await db.collection('shifts').updateOne(
			{ _id: new ObjectId(shiftId), ownerEmail },
			{ $set: { archived: false, updatedAt: new Date() }, $unset: { archivedAt: '' } }
		)

		if (result.matchedCount === 0) {
			throw new NotFoundException('Shift not found')
		}

		return { success: true, archived: false }
	}
}


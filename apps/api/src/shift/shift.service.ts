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
			// Support both single teamMemberId and array teamMemberIds
			const teamMemberIds = shift.teamMemberIds || (shift.teamMemberId ? [shift.teamMemberId] : [])
			
			// Fetch all team member names
			const teamMemberNames: string[] = []
			if (teamMemberIds.length > 0) {
				const teamMembers = await db.collection('teamMembers').find({
					_id: { $in: teamMemberIds.map((id: string) => new ObjectId(id)) },
					ownerEmail
				}).toArray()
				teamMemberNames.push(...teamMembers.map(tm => tm.name))
			}
			
			// For backward compatibility, keep single teamMemberId and teamMemberName
			const teamMemberId = teamMemberIds.length > 0 ? teamMemberIds[0] : ''
			const teamMemberName = teamMemberNames.length > 0 ? teamMemberNames[0] : ''

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
				teamMemberId: teamMemberId,
				teamMemberName: teamMemberName,
				teamMemberIds: teamMemberIds,
				teamMemberNames: teamMemberNames,
				status: shift.status || 'Planned',
				note: shift.note || '',
				archived: shift.archived || false,
				archivedAt: shift.archivedAt ? (shift.archivedAt instanceof Date ? shift.archivedAt.toISOString() : shift.archivedAt) : null,
				publishedAt: shift.publishedAt ? (shift.publishedAt instanceof Date ? shift.publishedAt.toISOString() : shift.publishedAt) : null,
				assignedAt: shift.assignedAt ? (shift.assignedAt instanceof Date ? shift.assignedAt.toISOString() : shift.assignedAt) : null,
				confirmedAt: shift.confirmedAt ? (shift.confirmedAt instanceof Date ? shift.confirmedAt.toISOString() : shift.confirmedAt) : null,
				declinedAt: shift.declinedAt ? (shift.declinedAt instanceof Date ? shift.declinedAt.toISOString() : shift.declinedAt) : null,
				inProgressAt: shift.inProgressAt ? (shift.inProgressAt instanceof Date ? shift.inProgressAt.toISOString() : shift.inProgressAt) : null,
				completedAt: shift.completedAt ? (shift.completedAt instanceof Date ? shift.completedAt.toISOString() : shift.completedAt) : null,
				missedAt: shift.missedAt ? (shift.missedAt instanceof Date ? shift.missedAt.toISOString() : shift.missedAt) : null,
				canceledAt: shift.canceledAt ? (shift.canceledAt instanceof Date ? shift.canceledAt.toISOString() : shift.canceledAt) : null,
				timesheetSubmittedAt: shift.timesheetSubmittedAt ? (shift.timesheetSubmittedAt instanceof Date ? shift.timesheetSubmittedAt.toISOString() : shift.timesheetSubmittedAt) : null,
				approvedAt: shift.approvedAt ? (shift.approvedAt instanceof Date ? shift.approvedAt.toISOString() : shift.approvedAt) : null,
				createdAt: shift.createdAt ? (shift.createdAt instanceof Date ? shift.createdAt.toISOString() : shift.createdAt) : new Date().toISOString(),
				updatedAt: shift.updatedAt ? (shift.updatedAt instanceof Date ? shift.updatedAt.toISOString() : shift.updatedAt) : new Date().toISOString()
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

		// Support both single teamMemberId and array teamMemberIds
		const teamMemberIds = shift.teamMemberIds || (shift.teamMemberId ? [shift.teamMemberId] : [])
		
		// Fetch all team member names
		const teamMemberNames: string[] = []
		if (teamMemberIds.length > 0) {
			const teamMembers = await db.collection('teamMembers').find({
				_id: { $in: teamMemberIds.map((id: string) => new ObjectId(id)) },
				ownerEmail
			}).toArray()
			teamMemberNames.push(...teamMembers.map(tm => tm.name))
		}
		
		// For backward compatibility, keep single teamMemberId and teamMemberName
		const teamMemberId = teamMemberIds.length > 0 ? teamMemberIds[0] : ''
		const teamMemberName = teamMemberNames.length > 0 ? teamMemberNames[0] : ''

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
			teamMemberId: teamMemberId,
			teamMemberName: teamMemberName,
			teamMemberIds: teamMemberIds,
			teamMemberNames: teamMemberNames,
			note: shift.note || '',
			archived: shift.archived || false,
			archivedAt: shift.archivedAt || null,
			publishedAt: shift.publishedAt || null,
			assignedAt: shift.assignedAt || null,
			confirmedAt: shift.confirmedAt || null,
			declinedAt: shift.declinedAt || null,
			inProgressAt: shift.inProgressAt || null,
			completedAt: shift.completedAt || null,
			missedAt: shift.missedAt || null,
			canceledAt: shift.canceledAt || null,
			timesheetSubmittedAt: shift.timesheetSubmittedAt ? shift.timesheetSubmittedAt.toISOString() : null,
			approvedAt: shift.approvedAt ? shift.approvedAt.toISOString() : null,
			createdAt: shift.createdAt ? shift.createdAt.toISOString() : new Date().toISOString(),
			updatedAt: shift.updatedAt ? shift.updatedAt.toISOString() : new Date().toISOString()
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
			teamMemberIds,
			status,
			note
		} = parsed.data

		const db = await this.databaseService.getDb()

		// Use teamMemberIds if provided, otherwise use teamMemberId for backward compatibility
		const finalTeamMemberIds = teamMemberIds || (teamMemberId ? [teamMemberId] : [])
		
		// Fetch team member names
		const teamMemberNames: string[] = []
		if (finalTeamMemberIds.length > 0) {
			const teamMembers = await db.collection('teamMembers').find({
				_id: { $in: finalTeamMemberIds.map((id: string) => new ObjectId(id)) },
				ownerEmail
			}).toArray()
			teamMemberNames.push(...teamMembers.map(tm => tm.name))
		}
		
		const singleTeamMemberId = finalTeamMemberIds.length > 0 ? finalTeamMemberIds[0] : ''
		const teamMemberName = teamMemberNames.length > 0 ? teamMemberNames[0] : ''

		const now = new Date()
		// Use provided status, or auto-set to "Assigned" if team member is provided, otherwise "Planned"
		const finalStatus = status || (finalTeamMemberIds.length > 0 ? 'Assigned' : 'Planned')
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
			teamMemberId: singleTeamMemberId || null,
			teamMemberIds: finalTeamMemberIds.length > 0 ? finalTeamMemberIds : null,
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
			teamMemberId: singleTeamMemberId,
			teamMemberName: teamMemberName,
			teamMemberIds: finalTeamMemberIds,
			teamMemberNames: teamMemberNames,
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
			teamMemberIds,
			status,
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

		const updateData: any = {
			updatedAt: new Date()
		}

		// Handle teamMemberIds array (takes priority over single teamMemberId)
		if (teamMemberIds !== undefined) {
			updateData.teamMemberIds = teamMemberIds.length > 0 ? teamMemberIds : null
			// Also set teamMemberId for backward compatibility (first one)
			updateData.teamMemberId = teamMemberIds.length > 0 ? teamMemberIds[0] : null
		} else if (teamMemberId !== undefined) {
			// Handle single teamMemberId for backward compatibility
			updateData.teamMemberId = teamMemberId || null
			if (teamMemberId) {
				// Convert single ID to array for consistency
				const existingTeamMemberIds = existing.teamMemberIds || (existing.teamMemberId ? [existing.teamMemberId] : [])
				updateData.teamMemberIds = [...new Set([...existingTeamMemberIds, teamMemberId])]
			} else {
				updateData.teamMemberIds = null
			}
		}

		if (serviceDate !== undefined) updateData.serviceDate = serviceDate
		if (startTime !== undefined) updateData.startTime = startTime
		if (endTime !== undefined) updateData.endTime = endTime
		if (breakDuration !== undefined) updateData.breakDuration = breakDuration || '0'
		if (serviceType !== undefined) updateData.serviceType = serviceType || null
		if (clientName !== undefined) updateData.clientName = clientName
		if (clientLocation !== undefined) updateData.clientLocation = clientLocation || null
		if (clientType !== undefined) updateData.clientType = clientType || null
		if (clientEmail !== undefined) updateData.clientEmail = clientEmail || null
		if (clientPhoneNumber !== undefined) updateData.clientPhoneNumber = clientPhoneNumber || null
		if (clientContactPerson !== undefined) updateData.clientContactPerson = clientContactPerson || null
		if (clientContactPhone !== undefined) updateData.clientContactPhone = clientContactPhone || null
		if (teamMemberId !== undefined) {
			updateData.teamMemberId = teamMemberId || null
			// Automatically set status to "Assigned" if team member is assigned
			if (teamMemberId && status === undefined) {
				updateData.status = 'Assigned'
				// Track assignedAt when team member is assigned (status changes to Assigned)
				if (existing.status !== 'Assigned') {
					updateData.assignedAt = new Date()
				}
			}
		}
		if (status !== undefined) {
			updateData.status = status
			const now = new Date()
			// Track timestamps when status changes to each value
			if (status !== existing.status) {
				if (status === 'Sent') {
					updateData.publishedAt = now
				} else if (status === 'Assigned') {
					updateData.assignedAt = now
				} else if (status === 'Confirmed') {
					updateData.confirmedAt = now
				} else if (status === 'Declined') {
					updateData.declinedAt = now
				} else if (status === 'In Progress') {
					updateData.inProgressAt = now
				} else if (status === 'Completed') {
					updateData.completedAt = now
				} else if (status === 'Missed') {
					updateData.missedAt = now
				} else if (status === 'Canceled') {
					updateData.canceledAt = now
				} else if (status === 'Timesheet Submitted') {
					updateData.timesheetSubmittedAt = now
				} else if (status === 'Approved') {
					updateData.approvedAt = now
				}
			}
		}
		if (note !== undefined) updateData.note = note || null

		await db.collection('shifts').updateOne(
			{ _id: new ObjectId(shiftId), ownerEmail },
			{ $set: updateData }
		)

		// Get final team member IDs and names
		const finalTeamMemberIds = updateData.teamMemberIds !== undefined 
			? (updateData.teamMemberIds || [])
			: (existing.teamMemberIds || (existing.teamMemberId ? [existing.teamMemberId] : []))
		
		// Fetch all team member names
		const teamMemberNames: string[] = []
		if (finalTeamMemberIds.length > 0) {
			const teamMembers = await db.collection('teamMembers').find({
				_id: { $in: finalTeamMemberIds.map((id: string) => new ObjectId(id)) },
				ownerEmail
			}).toArray()
			teamMemberNames.push(...teamMembers.map(tm => tm.name))
		}
		
		const singleTeamMemberId = finalTeamMemberIds.length > 0 ? finalTeamMemberIds[0] : ''
		const teamMemberName = teamMemberNames.length > 0 ? teamMemberNames[0] : ''

		// Determine final status - if team member was assigned, use "Assigned", otherwise use provided status or existing status
		const finalStatus = (teamMemberId && !status && teamMemberId) ? 'Assigned' : (status !== undefined ? status : existing.status || 'Planned')
		
		return {
			id: shiftId,
			serviceDate: updateData.serviceDate !== undefined ? updateData.serviceDate : existing.serviceDate,
			startTime: updateData.startTime !== undefined ? updateData.startTime : existing.startTime,
			endTime: updateData.endTime !== undefined ? updateData.endTime : existing.endTime,
			breakDuration: updateData.breakDuration !== undefined ? (updateData.breakDuration || '0') : (existing.breakDuration || '0'),
			serviceType: updateData.serviceType !== undefined ? (updateData.serviceType || '') : (existing.serviceType || ''),
			clientName: updateData.clientName !== undefined ? updateData.clientName : existing.clientName,
			clientLocation: updateData.clientLocation !== undefined ? (updateData.clientLocation || '') : (existing.clientLocation || ''),
			clientType: updateData.clientType !== undefined ? (updateData.clientType || '') : (existing.clientType || ''),
			clientEmail: updateData.clientEmail !== undefined ? (updateData.clientEmail || '') : (existing.clientEmail || ''),
			clientPhoneNumber: updateData.clientPhoneNumber !== undefined ? (updateData.clientPhoneNumber || '') : (existing.clientPhoneNumber || ''),
			clientContactPerson: updateData.clientContactPerson !== undefined ? (updateData.clientContactPerson || '') : (existing.clientContactPerson || ''),
			clientContactPhone: updateData.clientContactPhone !== undefined ? (updateData.clientContactPhone || '') : (existing.clientContactPhone || ''),
			teamMemberId: singleTeamMemberId,
			teamMemberName: teamMemberName,
			teamMemberIds: finalTeamMemberIds,
			teamMemberNames: teamMemberNames,
			status: updateData.status !== undefined ? updateData.status : finalStatus,
			note: updateData.note !== undefined ? (updateData.note || '') : (existing.note || ''),
			publishedAt: updateData.publishedAt !== undefined ? (updateData.publishedAt instanceof Date ? updateData.publishedAt.toISOString() : updateData.publishedAt) : (existing.publishedAt ? (existing.publishedAt instanceof Date ? existing.publishedAt.toISOString() : existing.publishedAt) : null),
			assignedAt: updateData.assignedAt !== undefined ? (updateData.assignedAt instanceof Date ? updateData.assignedAt.toISOString() : updateData.assignedAt) : (existing.assignedAt ? (existing.assignedAt instanceof Date ? existing.assignedAt.toISOString() : existing.assignedAt) : null),
			confirmedAt: updateData.confirmedAt !== undefined ? (updateData.confirmedAt instanceof Date ? updateData.confirmedAt.toISOString() : updateData.confirmedAt) : (existing.confirmedAt ? (existing.confirmedAt instanceof Date ? existing.confirmedAt.toISOString() : existing.confirmedAt) : null),
			declinedAt: updateData.declinedAt !== undefined ? (updateData.declinedAt instanceof Date ? updateData.declinedAt.toISOString() : updateData.declinedAt) : (existing.declinedAt ? (existing.declinedAt instanceof Date ? existing.declinedAt.toISOString() : existing.declinedAt) : null),
			inProgressAt: updateData.inProgressAt !== undefined ? (updateData.inProgressAt instanceof Date ? updateData.inProgressAt.toISOString() : updateData.inProgressAt) : (existing.inProgressAt ? (existing.inProgressAt instanceof Date ? existing.inProgressAt.toISOString() : existing.inProgressAt) : null),
			completedAt: updateData.completedAt !== undefined ? (updateData.completedAt instanceof Date ? updateData.completedAt.toISOString() : updateData.completedAt) : (existing.completedAt ? (existing.completedAt instanceof Date ? existing.completedAt.toISOString() : existing.completedAt) : null),
			missedAt: updateData.missedAt !== undefined ? (updateData.missedAt instanceof Date ? updateData.missedAt.toISOString() : updateData.missedAt) : (existing.missedAt ? (existing.missedAt instanceof Date ? existing.missedAt.toISOString() : existing.missedAt) : null),
			canceledAt: updateData.canceledAt !== undefined ? (updateData.canceledAt instanceof Date ? updateData.canceledAt.toISOString() : updateData.canceledAt) : (existing.canceledAt ? (existing.canceledAt instanceof Date ? existing.canceledAt.toISOString() : existing.canceledAt) : null),
			timesheetSubmittedAt: updateData.timesheetSubmittedAt !== undefined ? (updateData.timesheetSubmittedAt instanceof Date ? updateData.timesheetSubmittedAt.toISOString() : updateData.timesheetSubmittedAt) : (existing.timesheetSubmittedAt ? (existing.timesheetSubmittedAt instanceof Date ? existing.timesheetSubmittedAt.toISOString() : existing.timesheetSubmittedAt) : null),
			approvedAt: updateData.approvedAt !== undefined ? (updateData.approvedAt instanceof Date ? updateData.approvedAt.toISOString() : updateData.approvedAt) : (existing.approvedAt ? (existing.approvedAt instanceof Date ? existing.approvedAt.toISOString() : existing.approvedAt) : null)
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

	async permanentlyDeleteShift(ownerEmail: string, shiftId: string) {
		const db = await this.databaseService.getDb()
		
		// First check if shift exists and is archived
		const shift = await db.collection('shifts').findOne({
			_id: new ObjectId(shiftId),
			ownerEmail
		})

		if (!shift) {
			throw new NotFoundException('Shift not found')
		}

		if (!shift.archived) {
			throw new BadRequestException('Only archived shifts can be permanently deleted')
		}

		// Permanently delete the shift
		const result = await db.collection('shifts').deleteOne({
			_id: new ObjectId(shiftId),
			ownerEmail
		})

		if (result.deletedCount === 0) {
			throw new NotFoundException('Shift not found')
		}

		return { success: true, deleted: true }
	}
}


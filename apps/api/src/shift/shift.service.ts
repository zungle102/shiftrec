import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { DatabaseService } from '../database/database.service'
import { createShiftSchema, updateShiftSchema } from './dto/shift.dto'
import { ObjectId } from 'mongodb'

@Injectable()
export class ShiftService {
	constructor(private readonly databaseService: DatabaseService) {}

	async getShifts(ownerEmail: string, includeArchived: boolean = false, page: number = 1, limit: number = 100) {
		const db = await this.databaseService.getDb()
		const query: any = { ownerEmail }
		if (!includeArchived) {
			query.archived = { $ne: true }
		}
		
		// Calculate pagination
		const skip = (page - 1) * limit
		
		// Fetch shifts with pagination
		const shifts = await db.collection('shifts').find(
			query,
			{ 
				sort: { serviceDate: -1, startTime: -1 },
				skip,
				limit
			}
		).toArray()

		// PERFORMANCE OPTIMIZATION: Batch fetch all related data to avoid N+1 queries
		// Collect all unique IDs
		const allStaffMemberIds = new Set<string>()
		const allClientIds = new Set<string>()
		const allClientTypeIds = new Set<string>()
		const clientNameMap = new Map<string, string>() // For backward compatibility lookup
		
		for (const shift of shifts) {
			// Collect staff member IDs
			const rawNotifiedStaffMemberIds = shift.notifiedStaffMemberIds || shift.notifiedTeamMemberIds || shift.teamMemberIds || (shift.teamMemberId ? [shift.teamMemberId] : [])
			for (const id of rawNotifiedStaffMemberIds) {
				if (id) {
					const idStr = id instanceof ObjectId ? id.toString() : String(id)
					if (idStr && idStr !== 'null' && idStr !== 'undefined') {
						allStaffMemberIds.add(idStr)
					}
				}
			}
			
			// Collect client IDs
			if (shift.clientId) {
				const clientIdStr = shift.clientId instanceof ObjectId ? shift.clientId.toString() : String(shift.clientId)
				allClientIds.add(clientIdStr)
			}
			
			// Collect client names for backward compatibility lookup
			if (shift.clientName && !shift.clientId) {
				clientNameMap.set(shift.clientName, shift.clientName)
			}
		}

		// Batch fetch all staff members
		const staffMemberMap = new Map<string, any>()
		if (allStaffMemberIds.size > 0) {
			const staffMemberObjectIds = Array.from(allStaffMemberIds)
				.filter((id: string) => ObjectId.isValid(id))
				.map((id: string) => new ObjectId(id))
			
			if (staffMemberObjectIds.length > 0) {
				const staffMembers = await db.collection('staffMembers').find({
					_id: { $in: staffMemberObjectIds },
					ownerEmail
				}, {
					projection: { name: 1, _id: 1 } // Only fetch needed fields
				}).toArray()
				
				for (const member of staffMembers) {
					staffMemberMap.set(member._id.toString(), member)
				}
			}
		}

		// Batch fetch all clients (by ID and by name for backward compatibility)
		const clientMap = new Map<string, any>()
		if (allClientIds.size > 0) {
			const clientObjectIds = Array.from(allClientIds)
				.filter((id: string) => ObjectId.isValid(id))
				.map((id: string) => new ObjectId(id))
			
			if (clientObjectIds.length > 0) {
				const clientsById = await db.collection('clients').find({
					_id: { $in: clientObjectIds },
					ownerEmail
				}, {
					projection: { name: 1, address: 1, suburb: 1, state: 1, postcode: 1, email: 1, phoneNumber: 1, contactPerson: 1, contactPhone: 1, clientTypeId: 1, _id: 1 }
				}).toArray()
				
				for (const client of clientsById) {
					clientMap.set(client._id.toString(), client)
				}
			}
		}
		
		// Batch fetch clients by name for backward compatibility
		if (clientNameMap.size > 0) {
			const clientNames = Array.from(clientNameMap.keys())
			const clientsByName = await db.collection('clients').find({
				name: { $in: clientNames },
				ownerEmail
			}, {
				projection: { name: 1, address: 1, suburb: 1, state: 1, postcode: 1, email: 1, phoneNumber: 1, contactPerson: 1, contactPhone: 1, clientTypeId: 1, _id: 1 }
			}).toArray()
			
			for (const client of clientsByName) {
				clientMap.set(client.name, client) // Store by name for lookup
				clientMap.set(client._id.toString(), client) // Also store by ID
			}
		}

		// Batch fetch all client types
		if (clientMap.size > 0) {
			const clientTypeObjectIds: ObjectId[] = []
			for (const client of clientMap.values()) {
				if (client.clientTypeId) {
					const typeId = client.clientTypeId instanceof ObjectId ? client.clientTypeId : new ObjectId(client.clientTypeId.toString())
					if (!allClientTypeIds.has(typeId.toString())) {
						allClientTypeIds.add(typeId.toString())
						clientTypeObjectIds.push(typeId)
					}
				}
			}
			
			if (clientTypeObjectIds.length > 0) {
				const clientTypes = await db.collection('clientTypes').find({
					_id: { $in: clientTypeObjectIds }
				}, {
					projection: { name: 1, _id: 1 }
				}).toArray()
				
				const clientTypeMap = new Map<string, string>()
				for (const ct of clientTypes) {
					clientTypeMap.set(ct._id.toString(), ct.name)
				}
				
				// Attach client type names to clients
				for (const [key, client] of clientMap.entries()) {
					if (client.clientTypeId) {
						const typeIdStr = client.clientTypeId instanceof ObjectId ? client.clientTypeId.toString() : String(client.clientTypeId)
						client.clientTypeName = clientTypeMap.get(typeIdStr) || ''
					}
				}
			}
		}

		// Now map shifts using the pre-fetched data
		return shifts.map(shift => {
			// Handle assignedStaffMemberId (the assigned/confirmed staff member)
			let assignedStaffMemberId: string = ''
			let assignedStaffMemberName: string = ''
			if (shift.assignedStaffMemberId) {
				const confirmedId = shift.assignedStaffMemberId instanceof ObjectId 
					? shift.assignedStaffMemberId.toString() 
					: String(shift.assignedStaffMemberId)
				if (confirmedId && confirmedId !== 'null' && confirmedId !== 'undefined') {
					assignedStaffMemberId = confirmedId
					const member = staffMemberMap.get(confirmedId)
					if (member) {
						assignedStaffMemberName = member.name
					}
				}
			}
			
			// Support both single teamMemberId and array notifiedTeamMemberIds (backward compatibility with teamMemberIds)
			// Handle both ObjectId and string formats from database
			const rawNotifiedStaffMemberIds = shift.notifiedStaffMemberIds || shift.notifiedTeamMemberIds || shift.teamMemberIds || (shift.teamMemberId ? [shift.teamMemberId] : [])
			const notifiedStaffMemberIds = rawNotifiedStaffMemberIds
				.map((id: any) => {
					if (id instanceof ObjectId) {
						return id.toString()
					}
					return String(id)
				})
				.filter((id: string) => id && id !== 'null' && id !== 'undefined')
			
			// Get staff member names from pre-fetched map for notified members
			const staffMemberNames: string[] = []
			for (const id of notifiedStaffMemberIds) {
				const member = staffMemberMap.get(id)
				if (member) {
					staffMemberNames.push(member.name)
				}
			}
			
		// Use assignedStaffMemberId only (no fallback to notified members)
		const staffMemberId = assignedStaffMemberId
		const staffMemberName = assignedStaffMemberName

			// Populate client data from pre-fetched map
			let clientName = shift.clientName || ''
			let clientLocation = shift.clientLocation || ''
			let clientType = shift.clientType || ''
			let clientEmail = shift.clientEmail || ''
			let clientPhoneNumber = shift.clientPhoneNumber || ''
			let clientContactPerson = shift.clientContactPerson || ''
			let clientContactPhone = shift.clientContactPhone || ''
			let clientId: string | null = null

			// If clientId exists, use pre-fetched client data
			if (shift.clientId) {
				const clientIdStr = shift.clientId instanceof ObjectId ? shift.clientId.toString() : String(shift.clientId)
				const client = clientMap.get(clientIdStr)
				if (client) {
					clientId = client._id.toString()
					clientName = client.name || clientName
					clientLocation = client.address ? `${client.address}${client.suburb ? ', ' + client.suburb : ''}${client.state ? ', ' + client.state : ''}${client.postcode ? ' ' + client.postcode : ''}`.trim() : clientLocation
					clientType = client.clientTypeName || clientType
					clientEmail = client.email || clientEmail
					clientPhoneNumber = client.phoneNumber || clientPhoneNumber
					clientContactPerson = client.contactPerson || clientContactPerson
					clientContactPhone = client.contactPhone || clientContactPhone
				}
			} else if (shift.clientName) {
				// Backward compatibility: try to find clientId from clientName in pre-fetched map
				const client = clientMap.get(shift.clientName)
				if (client && client._id) {
					clientId = client._id.toString()
				}
			}

			return {
				id: shift._id.toString(),
				serviceDate: shift.serviceDate,
				startTime: shift.startTime,
				endTime: shift.endTime,
				breakDuration: shift.breakDuration || '0',
				serviceType: shift.serviceType || '',
				clientId: clientId,
				clientName: clientName,
				clientLocation: clientLocation,
				clientType: clientType,
				clientEmail: clientEmail,
				clientPhoneNumber: clientPhoneNumber,
				clientContactPerson: clientContactPerson,
				clientContactPhone: clientContactPhone,
				staffMemberId: staffMemberId,
				staffMemberName: staffMemberName,
				notifiedStaffMemberIds: notifiedStaffMemberIds,
				staffMemberNames: staffMemberNames,
				status: shift.status || 'Drafted',
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
		})
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

		// Handle assignedStaffMemberId (the assigned/confirmed staff member)
		let assignedStaffMemberId: string = ''
		let assignedStaffMemberName: string = ''
		if (shift.assignedStaffMemberId) {
			const confirmedId = shift.assignedStaffMemberId instanceof ObjectId 
				? shift.assignedStaffMemberId.toString() 
				: String(shift.assignedStaffMemberId)
			if (confirmedId && confirmedId !== 'null' && confirmedId !== 'undefined') {
				assignedStaffMemberId = confirmedId
				const member = await db.collection('staffMembers').findOne({
					_id: new ObjectId(confirmedId),
					ownerEmail
				})
				if (member) {
					assignedStaffMemberName = member.name
				}
			}
		}
		
		// Support both single teamMemberId and array notifiedTeamMemberIds (backward compatibility with teamMemberIds)
		// Handle both ObjectId and string formats from database
		const rawNotifiedStaffMemberIds = shift.notifiedStaffMemberIds || shift.notifiedTeamMemberIds || shift.teamMemberIds || (shift.teamMemberId ? [shift.teamMemberId] : [])
		const notifiedStaffMemberIds = rawNotifiedStaffMemberIds.map((id: any) => {
			// Convert ObjectId to string if needed
			if (id instanceof ObjectId) {
				return id.toString()
			}
			return id.toString()
		}).filter((id: string) => id && id !== 'null' && id !== 'undefined')
		
		// Fetch all team member names
		const staffMemberNames: string[] = []
		if (notifiedStaffMemberIds.length > 0) {
			const staffMembers = await db.collection('staffMembers').find({
				_id: { $in: notifiedStaffMemberIds.map((id: string) => new ObjectId(id)) },
				ownerEmail
			}).toArray()
			staffMemberNames.push(...staffMembers.map(tm => tm.name))
		}
		
		// Use assignedStaffMemberId only (no fallback to notified members)
		const staffMemberId = assignedStaffMemberId
		const staffMemberName = assignedStaffMemberName

		// Populate client data from clientId reference (preferred) or use denormalized data (backward compatibility)
		let clientName = shift.clientName || ''
		let clientLocation = shift.clientLocation || ''
		let clientType = shift.clientType || ''
		let clientEmail = shift.clientEmail || ''
		let clientPhoneNumber = shift.clientPhoneNumber || ''
		let clientContactPerson = shift.clientContactPerson || ''
		let clientContactPhone = shift.clientContactPhone || ''
		let clientId: string | null = null

		// If clientId exists, populate from clients collection
		if (shift.clientId) {
			const clientIdObj = shift.clientId instanceof ObjectId ? shift.clientId : new ObjectId(shift.clientId.toString())
			const client = await db.collection('clients').findOne({
				_id: clientIdObj,
				ownerEmail
			})
			if (client) {
				clientId = client._id.toString()
				clientName = client.name || clientName
				clientLocation = client.address ? `${client.address}${client.suburb ? ', ' + client.suburb : ''}${client.state ? ', ' + client.state : ''}${client.postcode ? ' ' + client.postcode : ''}`.trim() : clientLocation
				// Get client type name from reference
				if (client.clientTypeId) {
					const clientTypeIdObj = client.clientTypeId instanceof ObjectId ? client.clientTypeId : new ObjectId(client.clientTypeId.toString())
					const clientTypeDoc = await db.collection('clientTypes').findOne({ _id: clientTypeIdObj })
					clientType = clientTypeDoc?.name || clientType
				}
				clientEmail = client.email || clientEmail
				clientPhoneNumber = client.phoneNumber || clientPhoneNumber
				clientContactPerson = client.contactPerson || clientContactPerson
				clientContactPhone = client.contactPhone || clientContactPhone
			}
		} else if (shift.clientName) {
			// Backward compatibility: try to find clientId from clientName
			const client = await db.collection('clients').findOne({
				name: shift.clientName,
				ownerEmail
			})
			if (client) {
				clientId = client._id.toString()
			}
		}

		return {
			id: shift._id.toString(),
			serviceDate: shift.serviceDate,
			startTime: shift.startTime,
			endTime: shift.endTime,
			breakDuration: shift.breakDuration || '0',
			serviceType: shift.serviceType || '',
			clientId: clientId,
			clientName: clientName,
			clientLocation: clientLocation,
			clientType: clientType,
			clientEmail: clientEmail,
			clientPhoneNumber: clientPhoneNumber,
			clientContactPerson: clientContactPerson,
			clientContactPhone: clientContactPhone,
			staffMemberId: staffMemberId,
			staffMemberName: staffMemberName,
			notifiedStaffMemberIds: notifiedStaffMemberIds,
			staffMemberNames: staffMemberNames,
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
			console.error('=== CREATE SHIFT VALIDATION ERROR ===')
			console.error('DTO received:', JSON.stringify(dto, null, 2))
			console.error('Full validation error:', JSON.stringify(parsed.error, null, 2))
			
			const errors = parsed.error.errors.map(err => {
				const path = err.path.length > 0 ? err.path.join('.') : 'root'
				return `${path}: ${err.message}`
			})
			
			const errorMessage = errors.length > 0 
				? `Invalid input: ${errors.join('; ')}` 
				: 'Invalid input'
			
			console.error('Constructed error message:', errorMessage)
			console.error('Error count:', errors.length)
			console.error('=====================================')
			
			throw new BadRequestException(errorMessage)
		}

		const {
			serviceDate,
			startTime,
			endTime,
			breakDuration,
			serviceType,
			clientId,
			staffMemberId,
			notifiedStaffMemberIds,
			status,
			note
		} = parsed.data

		const db = await this.databaseService.getDb()

		// Validate and resolve clientId - clientId is now required
		let finalClientId: ObjectId | null = null

		if (!clientId || clientId.trim() === '') {
			throw new BadRequestException('Client ID is required')
		}

		// Validate that the client exists
		try {
			const client = await db.collection('clients').findOne({
				_id: new ObjectId(clientId),
				ownerEmail
			})
			if (!client) {
				throw new BadRequestException(`Client with ID ${clientId} not found`)
			}
			finalClientId = client._id
		} catch (error) {
			if (error instanceof BadRequestException) {
				throw error
			}
			throw new BadRequestException(`Invalid clientId: ${clientId}`)
		}

		// Use notifiedStaffMemberIds if provided, otherwise use staffMemberId
		const finalStaffMemberIds = notifiedStaffMemberIds || (staffMemberId ? [staffMemberId] : [])
		
		// Validate team member IDs if provided
		if (finalStaffMemberIds.length > 0) {
			const staffMembers = await db.collection('staffMembers').find({
				_id: { $in: finalStaffMemberIds.map((id: string) => {
					try {
						return new ObjectId(id)
					} catch {
						throw new BadRequestException(`Invalid team member ID: ${id}`)
					}
				}) },
				ownerEmail
			}).toArray()
			
			if (staffMembers.length !== finalStaffMemberIds.length) {
				throw new BadRequestException('One or more team member IDs not found')
			}
		}
		
		// Fetch team member names
		const staffMemberNames: string[] = []
		if (finalStaffMemberIds.length > 0) {
			const staffMembers = await db.collection('staffMembers').find({
				_id: { $in: finalStaffMemberIds.map((id: string) => new ObjectId(id)) },
				ownerEmail
			}).toArray()
			staffMemberNames.push(...staffMembers.map(tm => tm.name))
		}
		
		const singleStaffMemberId = finalStaffMemberIds.length > 0 ? finalStaffMemberIds[0] : null
		const staffMemberName = staffMemberNames.length > 0 ? staffMemberNames[0] : ''

		const now = new Date()
		// Use provided status, or auto-set to "Assigned" if team member is provided, otherwise "Drafted"
		const finalStatus = status || (finalStaffMemberIds.length > 0 ? 'Assigned' : 'Drafted')
		const result = await db.collection('shifts').insertOne({
			ownerEmail,
			serviceDate,
			startTime,
			endTime,
			breakDuration: breakDuration || '0',
			serviceType: serviceType || null,
			clientId: finalClientId, // Store only the ObjectId reference
			assignedStaffMemberId: singleStaffMemberId ? new ObjectId(singleStaffMemberId) : null,
			notifiedStaffMemberIds: finalStaffMemberIds.length > 0 
				? finalStaffMemberIds.map((id: string) => new ObjectId(id))
				: null,
			status: finalStatus,
			note: note || null,
			archived: false,
			createdAt: now,
			updatedAt: now
		})

		// Fetch client data to return in response (for display)
		const client = await db.collection('clients').findOne({ _id: finalClientId, ownerEmail })
		const clientTypeName = client?.clientTypeId ? (await db.collection('clientTypes').findOne({ _id: client.clientTypeId }))?.name || '' : ''
		const clientLocation = client?.address ? `${client.address}${client.suburb ? ', ' + client.suburb : ''}${client.state ? ', ' + client.state : ''}${client.postcode ? ' ' + client.postcode : ''}`.trim() : ''

		return {
			id: result.insertedId.toString(),
			serviceDate,
			startTime,
			endTime,
			breakDuration: breakDuration || '0',
			serviceType: serviceType || '',
			clientId: finalClientId.toString(),
			clientName: client?.name || '',
			clientLocation: clientLocation,
			clientType: clientTypeName,
			clientEmail: client?.email || '',
			clientPhoneNumber: client?.phoneNumber || '',
			clientContactPerson: client?.contactPerson || '',
			clientContactPhone: client?.contactPhone || '',
			staffMemberId: singleStaffMemberId,
			staffMemberName: staffMemberName,
			notifiedStaffMemberIds: finalStaffMemberIds,
			staffMemberNames: staffMemberNames,
			status: finalStatus,
			note: note || ''
		}
	}

	async updateShift(ownerEmail: string, shiftId: string, dto: any) {
		// Support both new and old field names for backward compatibility
		if ('teamMemberId' in dto && !('staffMemberId' in dto)) {
			dto.staffMemberId = dto.teamMemberId
		}
		if ('notifiedTeamMemberIds' in dto && !('notifiedStaffMemberIds' in dto)) {
			dto.notifiedStaffMemberIds = dto.notifiedTeamMemberIds
		}
		const parsed = updateShiftSchema.safeParse(dto)
		if (!parsed.success) {
			console.error('=== VALIDATION ERROR ===')
			console.error('DTO received:', JSON.stringify(dto, null, 2))
			console.error('Full validation error:', JSON.stringify(parsed.error, null, 2))
			
			const errors = parsed.error.errors.map(err => {
				const path = err.path.length > 0 ? err.path.join('.') : 'root'
				return `${path}: ${err.message}`
			})
			
			const errorMessage = errors.length > 0 
				? `Invalid input: ${errors.join('; ')}` 
				: 'Invalid input'
			
			console.error('Constructed error message:', errorMessage)
			console.error('Error count:', errors.length)
			console.error('========================')
			
			// NestJS will put the string message in the 'message' field of the response
			throw new BadRequestException(errorMessage)
		}

		const {
			serviceDate,
			startTime,
			endTime,
			breakDuration,
			serviceType,
			clientId,
			staffMemberId,
			notifiedStaffMemberIds,
			status,
			note
		} = parsed.data
		// Support old field names for backward compatibility
		const legacyStaffMemberId = staffMemberId || (dto as any).teamMemberId
		const legacyNotifiedStaffMemberIds = notifiedStaffMemberIds || (dto as any).notifiedTeamMemberIds

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

		// Validate and update clientId if provided
		if (clientId !== undefined) {
			if (clientId && clientId.trim() !== '') {
				// Validate that the client exists
				try {
					const client = await db.collection('clients').findOne({
						_id: new ObjectId(clientId),
						ownerEmail
					})
					if (!client) {
						throw new BadRequestException(`Client with ID ${clientId} not found`)
					}
					updateData.clientId = client._id
					// Client data is now always populated from clientId reference in the return value
				} catch (error) {
					if (error instanceof BadRequestException) {
						throw error
					}
					throw new BadRequestException(`Invalid clientId: ${clientId}`)
				}
			} else {
				// Clear clientId if empty string
				updateData.clientId = null
			}
		}
		// Note: Client name lookup for backward compatibility removed - clientId is now required

		// Validate team member IDs if provided
		if (notifiedStaffMemberIds !== undefined && notifiedStaffMemberIds.length > 0) {
			// Validate all team member IDs exist
			const staffMembers = await db.collection('staffMembers').find({
				_id: { $in: notifiedStaffMemberIds.map((id: string) => {
					try {
						return new ObjectId(id)
					} catch {
						throw new BadRequestException(`Invalid team member ID: ${id}`)
					}
				}) },
				ownerEmail
			}).toArray()
			
			if (staffMembers.length !== notifiedStaffMemberIds.length) {
				throw new BadRequestException('One or more team member IDs not found')
			}
		}
		if (legacyStaffMemberId !== undefined && legacyStaffMemberId && legacyStaffMemberId.trim() !== '') {
			// Validate single staff member ID exists
			try {
				const staffMember = await db.collection('staffMembers').findOne({
					_id: new ObjectId(legacyStaffMemberId),
					ownerEmail
				})
				if (!staffMember) {
					throw new BadRequestException(`Staff member with ID ${legacyStaffMemberId} not found`)
				}
			} catch (error) {
				if (error instanceof BadRequestException) {
					throw error
				}
				throw new BadRequestException(`Invalid staff member ID: ${legacyStaffMemberId}`)
			}
		}

		// Handle notifiedStaffMemberIds array (takes priority over single staffMemberId)
		// Also support backward compatibility with old field names
		if (legacyNotifiedStaffMemberIds !== undefined) {
			// Convert string IDs to ObjectIds for MongoDB storage
			updateData.notifiedStaffMemberIds = legacyNotifiedStaffMemberIds.length > 0 
				? legacyNotifiedStaffMemberIds.map((id: string) => new ObjectId(id))
				: null
			// Do NOT update assignedStaffMemberId when only notifiedStaffMemberIds is provided
			// assignedStaffMemberId should only be updated when staffMemberId is explicitly provided
		} else if (legacyStaffMemberId !== undefined) {
			// Handle single staffMemberId - store as ObjectId reference
			if (legacyStaffMemberId && legacyStaffMemberId.trim() !== '') {
				try {
					updateData.assignedStaffMemberId = new ObjectId(legacyStaffMemberId)
					// Do NOT automatically add assigned staff member to notifiedStaffMemberIds
				} catch {
					throw new BadRequestException(`Invalid staff member ID: ${legacyStaffMemberId}`)
				}
			} else {
				updateData.assignedStaffMemberId = null
			}
		}

		if (serviceDate !== undefined) updateData.serviceDate = serviceDate
		if (startTime !== undefined) updateData.startTime = startTime
		if (endTime !== undefined) updateData.endTime = endTime
		if (breakDuration !== undefined) updateData.breakDuration = breakDuration || '0'
		if (serviceType !== undefined) updateData.serviceType = serviceType || null
		// Client fields are no longer in DTO - they are populated from clientId reference
		// Note: staffMemberId handling is done above with notifiedStaffMemberIds logic
		// This block is kept for backward compatibility but should not execute if notifiedStaffMemberIds was handled
		if (legacyStaffMemberId !== undefined && updateData.assignedStaffMemberId === undefined) {
			// Store as ObjectId reference
			if (legacyStaffMemberId && legacyStaffMemberId.trim() !== '') {
				try {
					updateData.assignedStaffMemberId = new ObjectId(legacyStaffMemberId)
					// Automatically set status to "Assigned" if staff member is assigned
					if (status === undefined) {
						updateData.status = 'Assigned'
						// Track assignedAt when staff member is assigned (status changes to Assigned)
						if (existing.status !== 'Assigned') {
							updateData.assignedAt = new Date()
						}
					}
				} catch {
					throw new BadRequestException(`Invalid staff member ID: ${legacyStaffMemberId}`)
				}
			} else {
				updateData.assignedStaffMemberId = null
			}
		}
		if (status !== undefined) {
			updateData.status = status
			const now = new Date()
			// Track timestamps when status changes to each value
			if (status !== existing.status) {
				if (status === 'Pending') {
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
				} else if (status === 'Timesheet Approved') {
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
		// Handle both ObjectId and string formats from database
		const rawFinalStaffMemberIds = updateData.notifiedStaffMemberIds !== undefined 
			? (updateData.notifiedStaffMemberIds || [])
			: (existing.notifiedStaffMemberIds || existing.notifiedStaffMemberIds || (existing.staffMemberId ? [existing.staffMemberId] : []))
		
		// Convert ObjectIds to strings for return value
		const finalStaffMemberIds = rawFinalStaffMemberIds.map((id: any) => {
			if (id instanceof ObjectId) {
				return id.toString()
			}
			return id.toString()
		})
		
		// Fetch all staff member names
		const staffMemberNames: string[] = []
		if (finalStaffMemberIds.length > 0) {
			const staffMembers = await db.collection('staffMembers').find({
				_id: { $in: finalStaffMemberIds.map((id: string) => new ObjectId(id)) },
				ownerEmail
			}).toArray()
			staffMemberNames.push(...staffMembers.map(tm => tm.name))
		}
		
		const singleStaffMemberId = finalStaffMemberIds.length > 0 ? finalStaffMemberIds[0] : ''
		const staffMemberName = staffMemberNames.length > 0 ? staffMemberNames[0] : ''

		// Determine final status - if team member was assigned, use "Assigned", otherwise use provided status or existing status
		const finalStatus = (staffMemberId && !status && staffMemberId) ? 'Assigned' : (status !== undefined ? status : existing.status || 'Drafted')
		
		// Get final clientId (from updateData or existing)
		const finalClientId = updateData.clientId !== undefined 
			? (updateData.clientId ? updateData.clientId.toString() : null)
			: (existing.clientId ? (existing.clientId instanceof ObjectId ? existing.clientId.toString() : existing.clientId.toString()) : null)

		// Fetch client data to return in response (for display)
		let clientName = ''
		let clientLocation = ''
		let clientType = ''
		let clientEmail = ''
		let clientPhoneNumber = ''
		let clientContactPerson = ''
		let clientContactPhone = ''
		
		if (finalClientId) {
			const clientIdObj = new ObjectId(finalClientId)
			const client = await db.collection('clients').findOne({ _id: clientIdObj, ownerEmail })
			if (client) {
				clientName = client.name || ''
				clientLocation = client.address ? `${client.address}${client.suburb ? ', ' + client.suburb : ''}${client.state ? ', ' + client.state : ''}${client.postcode ? ' ' + client.postcode : ''}`.trim() : ''
				clientEmail = client.email || ''
				clientPhoneNumber = client.phoneNumber || ''
				clientContactPerson = client.contactPerson || ''
				clientContactPhone = client.contactPhone || ''
				
				// Get client type name
				if (client.clientTypeId) {
					const clientTypeIdObj = client.clientTypeId instanceof ObjectId ? client.clientTypeId : new ObjectId(client.clientTypeId.toString())
					const clientTypeDoc = await db.collection('clientTypes').findOne({ _id: clientTypeIdObj })
					clientType = clientTypeDoc?.name || ''
				}
			}
		}

		return {
			id: shiftId,
			serviceDate: updateData.serviceDate !== undefined ? updateData.serviceDate : existing.serviceDate,
			startTime: updateData.startTime !== undefined ? updateData.startTime : existing.startTime,
			endTime: updateData.endTime !== undefined ? updateData.endTime : existing.endTime,
			breakDuration: updateData.breakDuration !== undefined ? (updateData.breakDuration || '0') : (existing.breakDuration || '0'),
			serviceType: updateData.serviceType !== undefined ? (updateData.serviceType || '') : (existing.serviceType || ''),
			clientId: finalClientId,
			clientName: clientName,
			clientLocation: clientLocation,
			clientType: clientType,
			clientEmail: clientEmail,
			clientPhoneNumber: clientPhoneNumber,
			clientContactPerson: clientContactPerson,
			clientContactPhone: clientContactPhone,
			staffMemberId: singleStaffMemberId,
			staffMemberName: staffMemberName,
			notifiedStaffMemberIds: finalStaffMemberIds,
			staffMemberNames: staffMemberNames,
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


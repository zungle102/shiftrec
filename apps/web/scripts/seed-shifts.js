const { MongoClient, ObjectId } = require('mongodb')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '../.env') })

const uri = process.env.MONGODB_URI
if (!uri) {
	console.error('MONGODB_URI environment variable is required')
	process.exit(1)
}

// Get user email from command line argument or use default
const userEmail = process.argv[2] || process.env.USER_EMAIL || 'test@example.com'
const numShifts = parseInt(process.argv[3]) || 50

// Sample data arrays
const serviceTypes = [
	'Cleaning Service',
	'Gardening Service',
	'Maintenance',
	'Delivery Service',
	'Support Work',
	'Personal Care',
	'Respite Care',
	'Transport Service'
]

const clientTypes = ['Aged Care', 'NDIS', 'Others']

const statuses = [
	'Drafted',
	'Pending',
	'Assigned',
	'Confirmed',
	'In Progress',
	'Completed',
	'Declined',
	'Missed',
	'Canceled',
	'Timesheet Submitted',
	'Timesheet Approved'
]

const startTimes = ['06:00', '07:00', '08:00', '09:00', '10:00', '13:00', '14:00', '15:00']
const endTimes = ['10:00', '11:00', '12:00', '14:00', '15:00', '17:00', '18:00', '19:00']
const breakDurations = ['0', '15', '30', '45', '60']

function getRandomElement(array) {
	return array[Math.floor(Math.random() * array.length)]
}

function getRandomDate(startDaysAgo = -30, endDaysFromNow = 60) {
	const today = new Date()
	const startDate = new Date(today)
	startDate.setDate(today.getDate() + startDaysAgo)
	const endDate = new Date(today)
	endDate.setDate(today.getDate() + endDaysFromNow)
	const randomTime = startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime())
	return new Date(randomTime)
}

function formatDate(date) {
	const year = date.getFullYear()
	const month = String(date.getMonth() + 1).padStart(2, '0')
	const day = String(date.getDate()).padStart(2, '0')
	return `${year}-${month}-${day}`
}

function getStatusTimestamp(serviceDate, status) {
	const date = new Date(serviceDate)
	
	switch (status) {
		case 'Pending':
		case 'Assigned':
			// Set before service date
			date.setDate(date.getDate() - Math.floor(Math.random() * 7) - 1)
			break
		case 'Confirmed':
			// Set before service date but after assigned
			date.setDate(date.getDate() - Math.floor(Math.random() * 3) - 1)
			break
		case 'In Progress':
		case 'Completed':
		case 'Missed':
			// Set on or after service date
			date.setDate(date.getDate() + Math.floor(Math.random() * 3))
			break
		case 'Timesheet Submitted':
		case 'Timesheet Approved':
			// Set after completed
			date.setDate(date.getDate() + Math.floor(Math.random() * 7) + 1)
			break
		case 'Declined':
		case 'Canceled':
			// Set before service date
			date.setDate(date.getDate() - Math.floor(Math.random() * 5) - 1)
			break
		default:
			return null
	}
	
	return date
}

async function seedShifts() {
	const client = new MongoClient(uri)
	try {
		await client.connect()
		const db = client.db()
		
		console.log(`\n🌱 Generating ${numShifts} shifts for user: ${userEmail}\n`)
		
		// Get user
		const usersCollection = db.collection('users')
		const user = await usersCollection.findOne({ email: userEmail })
		
		if (!user) {
			console.error(`❌ User with email ${userEmail} not found`)
			console.log('💡 Please create a user first or provide a valid email')
			process.exit(1)
		}
		
		console.log(`✓ Found user: ${user.name || userEmail}`)
		
		// Get clients for this user
		const clientsCollection = db.collection('clients')
		const clients = await clientsCollection.find({ ownerEmail: userEmail, archived: { $ne: true } }).toArray()
		console.log(`✓ Found ${clients.length} client(s)`)
		
		// Get staff members for this user
		const staffMembersCollection = db.collection('staffMembers')
		const teamMembers = await staffMembersCollection.find({ ownerEmail: userEmail, archived: { $ne: true } }).toArray()
		console.log(`✓ Found ${teamMembers.length} staff member(s)`)
		
		if (clients.length === 0) {
			console.warn('⚠ Warning: No clients found. Shifts will be created with placeholder client data.')
		}
		
		if (teamMembers.length === 0) {
			console.warn('⚠ Warning: No staff members found. Shifts will be created without staff member assignments.')
		}
		
		// Delete existing shifts
		const shiftsCollection = db.collection('shifts')
		const deleteResult = await shiftsCollection.deleteMany({ ownerEmail: userEmail })
		console.log(`✓ Deleted ${deleteResult.deletedCount} existing shift(s)`)
		
		// Generate shifts
		const shifts = []
		const now = new Date()
		
		for (let i = 0; i < numShifts; i++) {
			const serviceDate = getRandomDate(-30, 60)
			const formattedDate = formatDate(serviceDate)
			const status = getRandomElement(statuses)
			
			// Select random client or create placeholder
			let client
			let clientName, clientLocation, clientType, clientEmail, clientPhoneNumber, clientContactPerson, clientContactPhone
			
			if (clients.length > 0) {
				client = getRandomElement(clients)
				clientName = client.name
				clientLocation = client.address || `${client.suburb || ''} ${client.state || ''} ${client.postcode || ''}`.trim()
				clientType = client.clientType || getRandomElement(clientTypes)
				clientEmail = client.email || ''
				clientPhoneNumber = client.phoneNumber || ''
				clientContactPerson = client.contactPerson || ''
				clientContactPhone = client.contactPhone || ''
			} else {
				clientName = `Client ${i + 1}`
				clientLocation = `${i + 10} Sample Street, Suburb ${i + 1}, SA 5000`
				clientType = getRandomElement(clientTypes)
				clientEmail = `client${i + 1}@example.com`
				clientPhoneNumber = `+61 4${Math.floor(Math.random() * 10000000).toString().padStart(8, '0')}`
				clientContactPerson = `Contact Person ${i + 1}`
				clientContactPhone = clientPhoneNumber
			}
			
			// Select random team member or leave empty
			let teamMemberId = null
			let teamMemberIds = []
			
			if (teamMembers.length > 0 && Math.random() > 0.3) { // 70% chance of assignment
				if (Math.random() > 0.7 && teamMembers.length > 1) { // 30% chance of multiple assignments
					// Multiple team members
					const numAssignments = Math.min(Math.floor(Math.random() * 3) + 1, teamMembers.length)
					const selectedMembers = []
					const availableMembers = [...teamMembers]
					for (let j = 0; j < numAssignments; j++) {
						const randomIndex = Math.floor(Math.random() * availableMembers.length)
						selectedMembers.push(availableMembers.splice(randomIndex, 1)[0])
					}
					teamMemberIds = selectedMembers.map(m => m._id.toString())
				} else {
					// Single team member
					const teamMember = getRandomElement(teamMembers)
					teamMemberId = teamMember._id.toString()
				}
			}
			
			const startTime = getRandomElement(startTimes)
			const endTime = getRandomElement(endTimes)
			const breakDuration = getRandomElement(breakDurations)
			const serviceType = getRandomElement(serviceTypes)
			
			// Set timestamps based on status
			const publishedAt = ['Pending', 'Assigned', 'Confirmed', 'Declined', 'Canceled', 'In Progress', 'Completed', 'Missed', 'Timesheet Submitted', 'Timesheet Approved'].includes(status) 
				? getStatusTimestamp(serviceDate, 'Pending') : null
			const assignedAt = ['Assigned', 'Confirmed', 'Declined', 'In Progress', 'Completed', 'Missed', 'Timesheet Submitted', 'Timesheet Approved'].includes(status) && teamMemberId
				? getStatusTimestamp(serviceDate, 'Assigned') : null
			const confirmedAt = ['Confirmed', 'In Progress', 'Completed', 'Missed', 'Timesheet Submitted', 'Timesheet Approved'].includes(status)
				? getStatusTimestamp(serviceDate, 'Confirmed') : null
			const declinedAt = status === 'Declined' ? getStatusTimestamp(serviceDate, 'Declined') : null
			const inProgressAt = ['In Progress', 'Completed', 'Missed', 'Timesheet Submitted', 'Timesheet Approved'].includes(status)
				? getStatusTimestamp(serviceDate, 'In Progress') : null
			const completedAt = ['Completed', 'Timesheet Submitted', 'Timesheet Approved'].includes(status)
				? getStatusTimestamp(serviceDate, 'Completed') : null
			const missedAt = status === 'Missed' ? getStatusTimestamp(serviceDate, 'Missed') : null
			const canceledAt = status === 'Canceled' ? getStatusTimestamp(serviceDate, 'Canceled') : null
			const timesheetSubmittedAt = ['Timesheet Submitted', 'Timesheet Approved'].includes(status)
				? getStatusTimestamp(serviceDate, 'Timesheet Submitted') : null
			const approvedAt = status === 'Timesheet Approved' ? getStatusTimestamp(serviceDate, 'Timesheet Approved') : null
			
			// Clear notifiedTeamMemberIds if status is Drafted
			const notifiedTeamMemberIdsArray = status === 'Drafted' ? [] : (teamMemberId || teamMemberIds.length > 0 ? [teamMemberId || teamMemberIds[0]] : [])
			
			const shift = {
				ownerEmail: userEmail,
				serviceDate: formattedDate,
				startTime: startTime,
				endTime: endTime,
				breakDuration: breakDuration,
				serviceType: serviceType,
				status: status,
				note: Math.random() > 0.7 ? `Note for shift ${i + 1}` : '',
				archived: false,
				createdAt: now,
				updatedAt: now,
				...(client ? { clientId: client._id } : {}), // Store only clientId reference (required)
				...(teamMemberId ? { confirmedStaffMemberId: new ObjectId(teamMemberId) } : {}),
				...(notifiedTeamMemberIdsArray.length > 0 ? { notifiedStaffMemberIds: notifiedTeamMemberIdsArray.map(id => new ObjectId(id)) } : {}),
				...(publishedAt ? { publishedAt: publishedAt } : {}),
				...(assignedAt ? { assignedAt: assignedAt } : {}),
				...(confirmedAt ? { confirmedAt: confirmedAt } : {}),
				...(declinedAt ? { declinedAt: declinedAt } : {}),
				...(inProgressAt ? { inProgressAt: inProgressAt } : {}),
				...(completedAt ? { completedAt: completedAt } : {}),
				...(missedAt ? { missedAt: missedAt } : {}),
				...(canceledAt ? { canceledAt: canceledAt } : {}),
				...(timesheetSubmittedAt ? { timesheetSubmittedAt: timesheetSubmittedAt } : {}),
				...(approvedAt ? { approvedAt: approvedAt } : {})
			}
			
			shifts.push(shift)
		}
		
		// Insert shifts
		if (shifts.length > 0) {
			const result = await shiftsCollection.insertMany(shifts)
			console.log(`✓ Created ${result.insertedCount} shift(s)`)
			
			// Show status distribution
			const statusCounts = {}
			shifts.forEach(s => {
				statusCounts[s.status] = (statusCounts[s.status] || 0) + 1
			})
			
			console.log('\n📊 Status Distribution:')
			Object.entries(statusCounts).sort((a, b) => b[1] - a[1]).forEach(([status, count]) => {
				console.log(`   ${status}: ${count}`)
			})
		}
		
		console.log('\n✅ Seed data generation complete!')
		
	} catch (error) {
		console.error('❌ Error generating seed data:', error)
		process.exit(1)
	} finally {
		await client.close()
	}
}

seedShifts()


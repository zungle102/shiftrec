const { MongoClient, ObjectId } = require('mongodb')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '../.env') })

const uri = process.env.MONGODB_URI
if (!uri) {
	console.error('MONGODB_URI environment variable is required')
	process.exit(1)
}

async function verifyReferences() {
	const client = new MongoClient(uri)
	try {
		await client.connect()
		const db = client.db()
		
		console.log('\n🔍 Verifying shift references...\n')
		
		// Check a shift with confirmed staff member
		const shiftWithStaff = await db.collection('shifts').findOne({ 
			assignedStaffMemberId: { $exists: true } 
		})
		
		if (shiftWithStaff) {
			console.log('✓ Shift with confirmed staff member found:')
			console.log(`  clientId: ${shiftWithStaff.clientId instanceof ObjectId ? 'ObjectId ✓' : 'NOT ObjectId ✗'}`)
			console.log(`  assignedStaffMemberId: ${shiftWithStaff.assignedStaffMemberId instanceof ObjectId ? 'ObjectId ✓' : 'NOT ObjectId ✗'}`)
		} else {
			console.log('⚠ No shift with assignedStaffMemberId found')
		}
		
		// Check a shift with notified staff members
		const shiftWithNotified = await db.collection('shifts').findOne({ 
			notifiedStaffMemberIds: { $exists: true, $ne: null, $not: { $size: 0 } }
		})
		
		if (shiftWithNotified) {
			console.log('\n✓ Shift with notified staff members found:')
			console.log(`  clientId: ${shiftWithNotified.clientId instanceof ObjectId ? 'ObjectId ✓' : 'NOT ObjectId ✗'}`)
			console.log(`  notifiedStaffMemberIds count: ${shiftWithNotified.notifiedStaffMemberIds?.length || 0}`)
			const allObjectIds = shiftWithNotified.notifiedStaffMemberIds?.every(id => id instanceof ObjectId)
			console.log(`  All are ObjectIds: ${allObjectIds ? '✓' : '✗'}`)
		} else {
			console.log('\n⚠ No shift with notifiedStaffMemberIds found')
		}
		
		// Count shifts with references
		const totalShifts = await db.collection('shifts').countDocuments({})
		const shiftsWithClientId = await db.collection('shifts').countDocuments({ clientId: { $exists: true, $ne: null } })
		const shiftsWithConfirmedStaff = await db.collection('shifts').countDocuments({ assignedStaffMemberId: { $exists: true, $ne: null } })
		const shiftsWithNotifiedStaff = await db.collection('shifts').countDocuments({ notifiedStaffMemberIds: { $exists: true, $ne: null, $not: { $size: 0 } } })
		
		console.log('\n📊 Reference Statistics:')
		console.log(`  Total shifts: ${totalShifts}`)
		console.log(`  Shifts with clientId reference: ${shiftsWithClientId} (${Math.round(shiftsWithClientId/totalShifts*100)}%)`)
		console.log(`  Shifts with assignedStaffMemberId: ${shiftsWithConfirmedStaff} (${Math.round(shiftsWithConfirmedStaff/totalShifts*100)}%)`)
		console.log(`  Shifts with notifiedStaffMemberIds: ${shiftsWithNotifiedStaff} (${Math.round(shiftsWithNotifiedStaff/totalShifts*100)}%)`)
		
		console.log('\n✅ Verification complete!')
		
	} catch (error) {
		console.error('❌ Error verifying references:', error)
		process.exit(1)
	} finally {
		await client.close()
	}
}

verifyReferences()


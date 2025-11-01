const { MongoClient } = require('mongodb')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '../.env') })

const uri = process.env.MONGODB_URI
if (!uri) {
	console.error('MONGODB_URI environment variable is required')
	process.exit(1)
}

async function clearAllStaffMembers() {
	const client = new MongoClient(uri)
	try {
		await client.connect()
		const db = client.db()
		
		console.log('\n🔄 Clearing all assigned and notified staff members from shifts...\n')
		
		// Update all shifts to clear both assigned and notified staff members
		const result = await db.collection('shifts').updateMany(
			{},
			{
				$set: {
					assignedStaffMemberId: null,
					notifiedStaffMemberIds: [],
					updatedAt: new Date()
				},
				$unset: {
					confirmedTeamMemberId: '', // Also clear old field name for backward compatibility
					staffMemberId: '', // Also clear old field name for backward compatibility
					teamMemberId: '', // Also clear old field name for backward compatibility
					notifiedTeamMemberIds: '', // Also clear old field name for backward compatibility
					teamMemberIds: '' // Also clear old field name for backward compatibility
				}
			}
		)
		
		console.log(`✅ Updated ${result.modifiedCount} shift(s)`)
		console.log(`   Total shifts found: ${result.matchedCount}`)
		
		// Verify the update
		const shiftsWithAssigned = await db.collection('shifts').countDocuments({
			$or: [
				{ assignedStaffMemberId: { $exists: true, $ne: null } },
				{ confirmedTeamMemberId: { $exists: true } },
				{ staffMemberId: { $exists: true } },
				{ teamMemberId: { $exists: true } }
			]
		})
		
		const shiftsWithNotified = await db.collection('shifts').countDocuments({
			$or: [
				{ notifiedStaffMemberIds: { $exists: true, $not: { $eq: [] } } },
				{ notifiedTeamMemberIds: { $exists: true, $ne: [] } },
				{ teamMemberIds: { $exists: true, $ne: [] } }
			]
		})
		
		const shiftsWithEmptyNotified = await db.collection('shifts').countDocuments({
			notifiedStaffMemberIds: []
		})
		
		console.log(`\n📊 Verification:`)
		console.log(`   Shifts with assigned staff members: ${shiftsWithAssigned}`)
		console.log(`   Shifts with notified staff members: ${shiftsWithNotified}`)
		console.log(`   Shifts with empty notified array: ${shiftsWithEmptyNotified}`)
		console.log(`   ${result.matchedCount - shiftsWithAssigned} shift(s) have no assigned staff member`)
		console.log(`   ${shiftsWithEmptyNotified} shift(s) have empty notified staff members array`)
		
	} catch (error) {
		console.error('❌ Error clearing staff members:', error)
		process.exit(1)
	} finally {
		await client.close()
	}
}

clearAllStaffMembers()


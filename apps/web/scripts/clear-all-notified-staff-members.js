const { MongoClient } = require('mongodb')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '../.env') })

const uri = process.env.MONGODB_URI
if (!uri) {
	console.error('MONGODB_URI environment variable is required')
	process.exit(1)
}

async function clearAllNotifiedStaffMembers() {
	const client = new MongoClient(uri)
	try {
		await client.connect()
		const db = client.db()
		
		console.log('\n🔄 Clearing all notified staff members from shifts...\n')
		
		// Update all shifts to clear notifiedStaffMemberIds
		const result = await db.collection('shifts').updateMany(
			{},
			{
				$unset: {
					notifiedStaffMemberIds: '',
					notifiedTeamMemberIds: '', // Also clear old field name for backward compatibility
					teamMemberIds: '' // Also clear old field name for backward compatibility
				},
				$set: {
					updatedAt: new Date()
				}
			}
		)
		
		console.log(`✅ Updated ${result.modifiedCount} shift(s)`)
		console.log(`   Total shifts found: ${result.matchedCount}`)
		
		// Verify the update
		const shiftsWithNotified = await db.collection('shifts').countDocuments({
			$or: [
				{ notifiedStaffMemberIds: { $exists: true, $ne: [] } },
				{ notifiedTeamMemberIds: { $exists: true, $ne: [] } },
				{ teamMemberIds: { $exists: true, $ne: [] } }
			]
		})
		console.log(`\n📊 Verification: ${shiftsWithNotified} shift(s) still have notified staff members`)
		console.log(`   ${result.matchedCount - shiftsWithNotified} shift(s) have cleared notified staff members`)
		
	} catch (error) {
		console.error('❌ Error clearing notified staff members:', error)
		process.exit(1)
	} finally {
		await client.close()
	}
}

clearAllNotifiedStaffMembers()


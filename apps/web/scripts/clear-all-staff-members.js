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
		
		console.log('\n🔄 Clearing all confirmed and notified staff members from shifts...\n')
		
		// Update all shifts to clear both confirmed and notified staff members
		const result = await db.collection('shifts').updateMany(
			{},
			{
				$unset: {
					confirmedStaffMemberId: '',
					confirmedTeamMemberId: '', // Also clear old field name for backward compatibility
					staffMemberId: '', // Also clear old field name for backward compatibility
					teamMemberId: '', // Also clear old field name for backward compatibility
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
		const shiftsWithConfirmed = await db.collection('shifts').countDocuments({
			$or: [
				{ confirmedStaffMemberId: { $exists: true } },
				{ confirmedTeamMemberId: { $exists: true } },
				{ staffMemberId: { $exists: true } },
				{ teamMemberId: { $exists: true } }
			]
		})
		
		const shiftsWithNotified = await db.collection('shifts').countDocuments({
			$or: [
				{ notifiedStaffMemberIds: { $exists: true, $ne: [] } },
				{ notifiedTeamMemberIds: { $exists: true, $ne: [] } },
				{ teamMemberIds: { $exists: true, $ne: [] } }
			]
		})
		
		console.log(`\n📊 Verification:`)
		console.log(`   Shifts with confirmed staff members: ${shiftsWithConfirmed}`)
		console.log(`   Shifts with notified staff members: ${shiftsWithNotified}`)
		console.log(`   ${result.matchedCount - shiftsWithConfirmed - shiftsWithNotified} shift(s) have all staff members cleared`)
		
	} catch (error) {
		console.error('❌ Error clearing staff members:', error)
		process.exit(1)
	} finally {
		await client.close()
	}
}

clearAllStaffMembers()


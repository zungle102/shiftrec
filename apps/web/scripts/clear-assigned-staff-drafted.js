const { MongoClient } = require('mongodb')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '../.env') })

const uri = process.env.MONGODB_URI
if (!uri) {
	console.error('MONGODB_URI environment variable is required')
	process.exit(1)
}

async function clearAssignedStaffFromDraftedShifts() {
	const client = new MongoClient(uri)
	try {
		await client.connect()
		const db = client.db()
		
		console.log('\n🔄 Clearing assigned staff members from Drafted shifts...\n')
		
		// Update all Drafted shifts to clear assignedStaffMemberId
		const result = await db.collection('shifts').updateMany(
			{ status: 'Drafted' },
			{
				$set: {
					assignedStaffMemberId: null,
					updatedAt: new Date()
				}
			}
		)
		
		console.log(`✅ Updated ${result.modifiedCount} Drafted shift(s)`)
		console.log(`   Total Drafted shifts found: ${result.matchedCount}`)
		
		// Verify the update
		const draftedShiftsWithAssigned = await db.collection('shifts').countDocuments({
			status: 'Drafted',
			$or: [
				{ assignedStaffMemberId: { $exists: true, $ne: null } },
				{ confirmedTeamMemberId: { $exists: true } },
				{ staffMemberId: { $exists: true } },
				{ teamMemberId: { $exists: true } }
			]
		})
		
		const draftedShiftsWithoutAssigned = await db.collection('shifts').countDocuments({
			status: 'Drafted',
			assignedStaffMemberId: null
		})
		
		console.log(`\n📊 Verification:`)
		console.log(`   Drafted shifts with assigned staff members: ${draftedShiftsWithAssigned}`)
		console.log(`   Drafted shifts without assigned staff members: ${draftedShiftsWithoutAssigned}`)
		
	} catch (error) {
		console.error('❌ Error clearing assigned staff members:', error)
		process.exit(1)
	} finally {
		await client.close()
	}
}

clearAssignedStaffFromDraftedShifts()


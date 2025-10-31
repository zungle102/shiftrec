const { MongoClient } = require('mongodb')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '../.env') })

const uri = process.env.MONGODB_URI
if (!uri) {
	console.error('MONGODB_URI environment variable is required')
	process.exit(1)
}

async function setAllShiftsToPlanned() {
	const client = new MongoClient(uri)
	try {
		await client.connect()
		const db = client.db()
		const shiftsCollection = db.collection('shifts')
		
		// Update all shifts to status "Planned" and clear all status timestamps
		const result = await shiftsCollection.updateMany(
			{}, // Match all shifts
			{ 
				$set: { 
					status: 'Planned',
					updatedAt: new Date()
				},
				$unset: {
					publishedAt: '',
					assignedAt: '',
					confirmedAt: '',
					declinedAt: '',
					inProgressAt: '',
					completedAt: '',
					missedAt: '',
					canceledAt: '',
					timesheetSubmittedAt: '',
					approvedAt: ''
				}
			}
		)
		
		console.log(`✓ Reset ${result.modifiedCount} shift(s) to "Planned" status`)
		console.log(`✓ ${result.matchedCount} total shift(s) matched`)
		console.log(`✓ Cleared all status timestamps`)
	} catch (error) {
		console.error('Error updating shifts:', error)
		process.exit(1)
	} finally {
		await client.close()
	}
}

setAllShiftsToPlanned()


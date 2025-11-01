const { MongoClient } = require('mongodb')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '../.env') })

const uri = process.env.MONGODB_URI
if (!uri) {
	console.error('MONGODB_URI environment variable is required')
	process.exit(1)
}

async function clearNotifiedTeamMembers() {
	const client = new MongoClient(uri)
	try {
		await client.connect()
		const db = client.db()
		const shiftsCollection = db.collection('shifts')
		
		// Clear only notifiedTeamMemberIds (Notified Team Members) but keep teamMemberId (Team Members)
		// Also clear old teamMemberIds for backward compatibility
		const result = await shiftsCollection.updateMany(
			{}, // Match all shifts
			{ 
				$unset: {
					notifiedTeamMemberIds: '',
					teamMemberIds: '' // Clear old field name for backward compatibility
				},
				$set: {
					updatedAt: new Date()
				}
			}
		)
		
		console.log(`✓ Cleared notified team members (notifiedTeamMemberIds) from ${result.modifiedCount} shift(s)`)
		console.log(`✓ ${result.matchedCount} total shift(s) matched`)
		console.log(`✓ Team members (teamMemberId) were preserved`)
	} catch (error) {
		console.error('Error clearing notified team members:', error)
		process.exit(1)
	} finally {
		await client.close()
	}
}

clearNotifiedTeamMembers()


const { MongoClient } = require('mongodb')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '../.env') })

const uri = process.env.MONGODB_URI
if (!uri) {
	console.error('MONGODB_URI environment variable is required')
	process.exit(1)
}

async function deleteAllTeamMembers() {
	const client = new MongoClient(uri)
	try {
		await client.connect()
		const db = client.db()
		const teamMembersCollection = db.collection('teamMembers')
		
		// Count team members before deletion
		const countBefore = await teamMembersCollection.countDocuments({})
		
		// Delete all team members
		const result = await teamMembersCollection.deleteMany({})
		
		console.log(`✓ Deleted ${result.deletedCount} team member(s) from database`)
		console.log(`✓ ${countBefore} total team member(s) found before deletion`)
		
		if (result.deletedCount !== countBefore) {
			console.warn(`⚠ Warning: Deleted count (${result.deletedCount}) does not match total count (${countBefore})`)
		}
	} catch (error) {
		console.error('Error deleting team members:', error)
		process.exit(1)
	} finally {
		await client.close()
	}
}

deleteAllTeamMembers()


const { MongoClient } = require('mongodb')
const path = require('path')

require('dotenv').config({ path: path.join(__dirname, '../.env') })

const uri = process.env.MONGODB_URI
if (!uri) {
	console.error('MONGODB_URI environment variable is required')
	process.exit(1)
}

async function updateShiftStatus() {
	const client = new MongoClient(uri)
	try {
		await client.connect()
		const db = client.db()
		const shiftsCollection = db.collection('shifts')
		
		// Update all shifts with status "Planned" to "Drafted"
		const result = await shiftsCollection.updateMany(
			{ status: 'Planned' },
			{ 
				$set: { 
					status: 'Drafted',
					updatedAt: new Date()
				}
			}
		)
		
		console.log(`✓ Updated ${result.modifiedCount} shift(s) from "Planned" to "Drafted"`)
		console.log(`✓ ${result.matchedCount} total shift(s) matched`)
	} catch (error) {
		console.error('Error updating shifts:', error)
		process.exit(1)
	} finally {
		await client.close()
	}
}

updateShiftStatus()


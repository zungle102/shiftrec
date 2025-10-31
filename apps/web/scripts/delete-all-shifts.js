const { MongoClient } = require('mongodb')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '../.env') })

const uri = process.env.MONGODB_URI
if (!uri) {
	console.error('MONGODB_URI environment variable is required')
	process.exit(1)
}

async function deleteAllShifts() {
	const client = new MongoClient(uri)
	try {
		await client.connect()
		const db = client.db()
		const shiftsCollection = db.collection('shifts')
		
		// Count shifts before deletion
		const countBefore = await shiftsCollection.countDocuments({})
		
		// Delete all shifts
		const result = await shiftsCollection.deleteMany({})
		
		console.log(`✓ Deleted ${result.deletedCount} shift(s) from database`)
		console.log(`✓ ${countBefore} total shift(s) found before deletion`)
		
		if (result.deletedCount !== countBefore) {
			console.warn(`⚠ Warning: Deleted count (${result.deletedCount}) does not match total count (${countBefore})`)
		}
	} catch (error) {
		console.error('Error deleting shifts:', error)
		process.exit(1)
	} finally {
		await client.close()
	}
}

deleteAllShifts()


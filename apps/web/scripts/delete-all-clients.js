const { MongoClient } = require('mongodb')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '../.env') })

const uri = process.env.MONGODB_URI
if (!uri) {
	console.error('MONGODB_URI environment variable is required')
	process.exit(1)
}

async function deleteAllClients() {
	const client = new MongoClient(uri)
	try {
		await client.connect()
		const db = client.db()
		const clientsCollection = db.collection('clients')
		
		// Count clients before deletion
		const countBefore = await clientsCollection.countDocuments({})
		
		// Delete all clients
		const result = await clientsCollection.deleteMany({})
		
		console.log(`✓ Deleted ${result.deletedCount} client(s) from database`)
		console.log(`✓ ${countBefore} total client(s) found before deletion`)
		
		if (result.deletedCount !== countBefore) {
			console.warn(`⚠ Warning: Deleted count (${result.deletedCount}) does not match total count (${countBefore})`)
		}
	} catch (error) {
		console.error('Error deleting clients:', error)
		process.exit(1)
	} finally {
		await client.close()
	}
}

deleteAllClients()


const { MongoClient, ObjectId } = require('mongodb')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '../.env') })

const uri = process.env.MONGODB_URI
if (!uri) {
	console.error('MONGODB_URI environment variable is required')
	process.exit(1)
}

async function migrateClientTypeToClientTypeId() {
	const client = new MongoClient(uri)
	try {
		await client.connect()
		const db = client.db()
		const clientsCollection = db.collection('clients')
		
		console.log('\n🔄 Migrating clientType to clientTypeId in clients collection...\n')
		
		// Find all documents with clientType field
		const clientsWithClientType = await clientsCollection.find({ clientType: { $exists: true } }).toArray()
		console.log(`✓ Found ${clientsWithClientType.length} client(s) with clientType field`)
		
		if (clientsWithClientType.length === 0) {
			console.log('ℹ No documents to migrate')
			return
		}
		
		let migrated = 0
		let skipped = 0
		
		for (const client of clientsWithClientType) {
			try {
				// Only migrate if clientTypeId doesn't already exist
				if (!client.clientTypeId) {
					await clientsCollection.updateOne(
						{ _id: client._id },
						{ 
							$set: { clientTypeId: client.clientType },
							$unset: { clientType: '' }
						}
					)
					migrated++
				} else {
					// If both exist, just remove the old field
					await clientsCollection.updateOne(
						{ _id: client._id },
						{ $unset: { clientType: '' } }
					)
					skipped++
				}
			} catch (error) {
				console.error(`⚠ Error migrating client ${client._id}:`, error.message)
			}
		}
		
		console.log(`✓ Migrated ${migrated} client(s)`)
		if (skipped > 0) {
			console.log(`⚠ Skipped ${skipped} client(s) (clientTypeId already exists)`)
		}
		
		console.log('\n✅ Migration complete!')
		
	} catch (error) {
		console.error('❌ Error during migration:', error)
		process.exit(1)
	} finally {
		await client.close()
	}
}

migrateClientTypeToClientTypeId()


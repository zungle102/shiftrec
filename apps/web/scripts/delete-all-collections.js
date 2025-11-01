const { MongoClient } = require('mongodb')
const path = require('path')

require('dotenv').config({ path: path.join(__dirname, '../.env') })

const uri = process.env.MONGODB_URI
if (!uri) {
	console.error('MONGODB_URI environment variable is required')
	process.exit(1)
}

async function deleteAllCollections() {
	const client = new MongoClient(uri)
	try {
		await client.connect()
		const db = client.db()
		
		console.log('\n🗑️  Deleting all collections...\n')
		
		// Get all collection names
		const collections = await db.listCollections().toArray()
		const collectionNames = collections.map(c => c.name)
		
		console.log(`Found ${collectionNames.length} collection(s) to delete:\n`)
		
		// Delete each collection
		for (const collectionName of collectionNames) {
			try {
				const collection = db.collection(collectionName)
				const count = await collection.countDocuments()
				const result = await collection.deleteMany({})
				console.log(`✓ Deleted ${result.deletedCount} document(s) from ${collectionName}`)
				
				// Drop the collection
				await db.collection(collectionName).drop()
				console.log(`✓ Dropped collection: ${collectionName}`)
			} catch (error) {
				if (error.code === 26) {
					// Collection doesn't exist
					console.log(`⚠ Collection ${collectionName} doesn't exist (already deleted)`)
				} else {
					console.error(`❌ Error deleting collection ${collectionName}:`, error.message)
				}
			}
		}
		
		// Verify all collections are deleted
		const remainingCollections = await db.listCollections().toArray()
		console.log(`\n✅ Deletion complete!`)
		console.log(`   Remaining collections: ${remainingCollections.length}`)
		
		if (remainingCollections.length > 0) {
			console.log(`\n⚠ Note: Some system collections may still exist:`)
			remainingCollections.forEach(c => {
				console.log(`   - ${c.name}`)
			})
		}
		
	} catch (error) {
		console.error('❌ Error deleting collections:', error)
		process.exit(1)
	} finally {
		await client.close()
	}
}

deleteAllCollections()


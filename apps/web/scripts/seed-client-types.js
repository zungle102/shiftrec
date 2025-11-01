const { MongoClient } = require('mongodb')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '../.env') })

const uri = process.env.MONGODB_URI
if (!uri) {
	console.error('MONGODB_URI environment variable is required')
	process.exit(1)
}

// Client Types from seed data
const clientTypes = [
	'Aged Care',
	'NDIS',
	'Others'
]

async function seedClientTypes() {
	const client = new MongoClient(uri)
	try {
		await client.connect()
		const db = client.db()
		const clientTypesCollection = db.collection('clientTypes')
		
		console.log('\n🌱 Seeding Client Types collection...\n')
		
		// Delete existing client types to avoid duplicates
		const deleteResult = await clientTypesCollection.deleteMany({})
		console.log(`✓ Deleted ${deleteResult.deletedCount} existing client type(s)`)
		
		// Insert client types
		const now = new Date()
		const clientTypeDocuments = clientTypes.map((type, index) => ({
			name: type,
			order: index + 1,
			active: true,
			createdAt: now,
			updatedAt: now
		}))
		
		const result = await clientTypesCollection.insertMany(clientTypeDocuments)
		console.log(`✓ Inserted ${result.insertedCount} client type(s)`)
		
		console.log('\n📊 Client Types in database:')
		clientTypes.forEach((type, index) => {
			console.log(`  ${index + 1}. ${type}`)
		})
		
		console.log('\n✅ Client Types collection seeded successfully!')
		
	} catch (error) {
		console.error('❌ Error seeding client types:', error)
		process.exit(1)
	} finally {
		await client.close()
	}
}

seedClientTypes()


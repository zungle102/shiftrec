const { MongoClient } = require('mongodb')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '../.env') })

const uri = process.env.MONGODB_URI
if (!uri) {
	console.error('MONGODB_URI environment variable is required')
	process.exit(1)
}

// ID Types from Edit Team Member dropdown
const idTypes = [
	"Australian Driver's License",
	"Oversea Driver's License",
	"Australian Passport",
	"Oversea Passport",
	"Australian Visa",
	"Others"
]

async function seedIdTypes() {
	const client = new MongoClient(uri)
	try {
		await client.connect()
		const db = client.db()
		const idTypesCollection = db.collection('idTypes')
		
		console.log('\n🌱 Seeding ID Types collection...\n')
		
		// Delete existing ID types to avoid duplicates
		const deleteResult = await idTypesCollection.deleteMany({})
		console.log(`✓ Deleted ${deleteResult.deletedCount} existing ID type(s)`)
		
		// Insert ID types
		const now = new Date()
		const idTypeDocuments = idTypes.map((type, index) => ({
			name: type,
			order: index + 1,
			active: true,
			createdAt: now,
			updatedAt: now
		}))
		
		const result = await idTypesCollection.insertMany(idTypeDocuments)
		console.log(`✓ Inserted ${result.insertedCount} ID type(s)`)
		
		console.log('\n📊 ID Types in database:')
		idTypes.forEach((type, index) => {
			console.log(`  ${index + 1}. ${type}`)
		})
		
		console.log('\n✅ ID Types collection seeded successfully!')
		
	} catch (error) {
		console.error('❌ Error seeding ID types:', error)
		process.exit(1)
	} finally {
		await client.close()
	}
}

seedIdTypes()


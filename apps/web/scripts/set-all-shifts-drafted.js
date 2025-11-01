const { MongoClient } = require('mongodb')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '../.env') })

const uri = process.env.MONGODB_URI
if (!uri) {
	console.error('MONGODB_URI environment variable is required')
	process.exit(1)
}

async function setAllShiftsToDrafted() {
	const client = new MongoClient(uri)
	try {
		await client.connect()
		const db = client.db()
		
		console.log('\n🔄 Setting all shifts status to "Drafted"...\n')
		
		// Update all shifts to have status "Drafted"
		const result = await db.collection('shifts').updateMany(
			{},
			{
				$set: {
					status: 'Drafted',
					updatedAt: new Date()
				}
			}
		)
		
		console.log(`✅ Updated ${result.modifiedCount} shift(s) to status "Drafted"`)
		console.log(`   Total shifts found: ${result.matchedCount}`)
		
		// Verify the update
		const draftedCount = await db.collection('shifts').countDocuments({ status: 'Drafted' })
		console.log(`\n📊 Verification: ${draftedCount} shift(s) now have status "Drafted"`)
		
	} catch (error) {
		console.error('❌ Error updating shifts:', error)
		process.exit(1)
	} finally {
		await client.close()
	}
}

setAllShiftsToDrafted()


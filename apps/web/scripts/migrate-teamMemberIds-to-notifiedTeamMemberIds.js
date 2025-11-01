const { MongoClient } = require('mongodb')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '../.env') })

const uri = process.env.MONGODB_URI
if (!uri) {
	console.error('MONGODB_URI environment variable is required')
	process.exit(1)
}

async function migrateTeamMemberIds() {
	const client = new MongoClient(uri)
	try {
		await client.connect()
		const db = client.db()
		const shiftsCollection = db.collection('shifts')
		
		console.log('\n🔄 Migrating teamMemberIds to notifiedTeamMemberIds...\n')
		
		// Find all shifts that have teamMemberIds but not notifiedTeamMemberIds
		const shifts = await shiftsCollection.find({
			teamMemberIds: { $exists: true },
			notifiedTeamMemberIds: { $exists: false }
		}).toArray()
		
		console.log(`✓ Found ${shifts.length} shift(s) to migrate`)
		
		if (shifts.length === 0) {
			console.log('✓ No shifts need migration')
			return
		}
		
		let migrated = 0
		for (const shift of shifts) {
			await shiftsCollection.updateOne(
				{ _id: shift._id },
				{
					$set: {
						notifiedTeamMemberIds: shift.teamMemberIds,
						updatedAt: new Date()
					},
					$unset: {
						teamMemberIds: ''
					}
				}
			)
			migrated++
		}
		
		console.log(`✓ Migrated ${migrated} shift(s)`)
		console.log(`\n✅ Migration complete!`)
		
	} catch (error) {
		console.error('❌ Error during migration:', error)
		process.exit(1)
	} finally {
		await client.close()
	}
}

migrateTeamMemberIds()


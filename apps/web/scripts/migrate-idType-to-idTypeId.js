const { MongoClient, ObjectId } = require('mongodb')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '../.env') })

const uri = process.env.MONGODB_URI
if (!uri) {
	console.error('MONGODB_URI environment variable is required')
	process.exit(1)
}

async function migrateIdTypeToIdTypeId() {
	const client = new MongoClient(uri)
	try {
		await client.connect()
		const db = client.db()
		const teamMembersCollection = db.collection('teamMembers')
		
		console.log('\n🔄 Migrating idType to idTypeId in teamMembers collection...\n')
		
		// Find all documents with idType field
		const membersWithIdType = await teamMembersCollection.find({ idType: { $exists: true } }).toArray()
		console.log(`✓ Found ${membersWithIdType.length} team member(s) with idType field`)
		
		if (membersWithIdType.length === 0) {
			console.log('ℹ No documents to migrate')
			return
		}
		
		let migrated = 0
		let skipped = 0
		
		for (const member of membersWithIdType) {
			try {
				// Only migrate if idTypeId doesn't already exist
				if (!member.idTypeId) {
					await teamMembersCollection.updateOne(
						{ _id: member._id },
						{ 
							$set: { idTypeId: member.idType },
							$unset: { idType: '' }
						}
					)
					migrated++
				} else {
					// If both exist, just remove the old field
					await teamMembersCollection.updateOne(
						{ _id: member._id },
						{ $unset: { idType: '' } }
					)
					skipped++
				}
			} catch (error) {
				console.error(`⚠ Error migrating team member ${member._id}:`, error.message)
			}
		}
		
		console.log(`✓ Migrated ${migrated} team member(s)`)
		if (skipped > 0) {
			console.log(`⚠ Skipped ${skipped} team member(s) (idTypeId already exists)`)
		}
		
		console.log('\n✅ Migration complete!')
		
	} catch (error) {
		console.error('❌ Error during migration:', error)
		process.exit(1)
	} finally {
		await client.close()
	}
}

migrateIdTypeToIdTypeId()


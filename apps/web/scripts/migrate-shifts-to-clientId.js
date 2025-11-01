const { MongoClient, ObjectId } = require('mongodb')
const path = require('path')

require('dotenv').config({ path: path.join(__dirname, '../.env') })

const uri = process.env.MONGODB_URI
if (!uri) {
	console.error('MONGODB_URI environment variable is required')
	process.exit(1)
}

async function migrateShiftsToClientId() {
	const client = new MongoClient(uri)
	try {
		await client.connect()
		const db = client.db()
		const shiftsCollection = db.collection('shifts')
		const clientsCollection = db.collection('clients')
		
		console.log('\n🔄 Migrating shifts to use clientId references...\n')
		
		// Get all shifts without clientId
		const shifts = await shiftsCollection.find({
			clientId: { $exists: false }
		}).toArray()
		
		console.log(`Found ${shifts.length} shift(s) to migrate`)
		
		let migrated = 0
		let skipped = 0
		let errors = 0
		
		for (const shift of shifts) {
			try {
				if (!shift.clientName || !shift.ownerEmail) {
					console.log(`⚠ Skipping shift ${shift._id}: missing clientName or ownerEmail`)
					skipped++
					continue
				}
				
				// Find matching client by name and ownerEmail
				const client = await clientsCollection.findOne({
					name: shift.clientName,
					ownerEmail: shift.ownerEmail
				})
				
				if (!client) {
					console.log(`⚠ No matching client found for shift ${shift._id} (clientName: "${shift.clientName}")`)
					skipped++
					continue
				}
				
				// Update shift with clientId
				await shiftsCollection.updateOne(
					{ _id: shift._id },
					{ $set: { clientId: client._id } }
				)
				
				migrated++
				if (migrated % 10 === 0) {
					console.log(`  ✓ Migrated ${migrated} shift(s)...`)
				}
			} catch (error) {
				console.error(`❌ Error migrating shift ${shift._id}:`, error.message)
				errors++
			}
		}
		
		console.log(`\n✅ Migration complete!`)
		console.log(`   - Migrated: ${migrated} shift(s)`)
		console.log(`   - Skipped: ${skipped} shift(s)`)
		console.log(`   - Errors: ${errors} shift(s)`)
		
		// Create index on clientId after migration
		try {
			await shiftsCollection.createIndex({ ownerEmail: 1, clientId: 1 })
			console.log(`\n✓ Created index on shifts.ownerEmail + clientId`)
		} catch (err) {
			if (err.code !== 85) {
				console.log(`⚠ Index may already exist or error: ${err.message}`)
			}
		}
		
	} catch (error) {
		console.error('❌ Error during migration:', error)
		process.exit(1)
	} finally {
		await client.close()
	}
}

migrateShiftsToClientId()


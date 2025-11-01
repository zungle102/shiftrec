const { MongoClient, ObjectId } = require('mongodb')
const path = require('path')

require('dotenv').config({ path: path.join(__dirname, '../.env') })

const uri = process.env.MONGODB_URI
if (!uri) {
	console.error('MONGODB_URI environment variable is required')
	process.exit(1)
}

async function migrateTeamToStaff() {
	const client = new MongoClient(uri)
	try {
		await client.connect()
		const db = client.db()
		
		console.log('\n🔄 Migrating Team to Staff...\n')
		
		// Step 1: Rename collection
		console.log('Step 1: Renaming collection teamMembers to staffMembers...')
		try {
			const teamMembersCollection = db.collection('teamMembers')
			const count = await teamMembersCollection.countDocuments()
			
			if (count > 0) {
				// MongoDB doesn't have a direct rename command that works across databases easily
				// So we'll copy and then drop
				const staffMembers = await teamMembersCollection.find({}).toArray()
				const staffMembersCollection = db.collection('staffMembers')
				
				if (staffMembers.length > 0) {
					await staffMembersCollection.insertMany(staffMembers)
					console.log(`✓ Copied ${staffMembers.length} document(s) to staffMembers`)
					
					// Note: We'll keep teamMembers for now for safety, user can drop it manually
					console.log('⚠ Keeping original teamMembers collection for safety')
					console.log('  You can manually drop it after verifying the migration')
				}
			} else {
				console.log('✓ No documents to migrate in teamMembers')
			}
		} catch (error) {
			if (error.code === 48) {
				// Namespace exists
				console.log('⚠ staffMembers collection already exists, skipping collection rename')
			} else {
				throw error
			}
		}
		
		// Step 2: Update field names in shifts collection
		console.log('\nStep 2: Updating field names in shifts collection...')
		const shiftsCollection = db.collection('shifts')
		
		// Update teamMemberId to staffMemberId
		console.log('  - Renaming teamMemberId to staffMemberId...')
		const result1 = await shiftsCollection.updateMany(
			{ teamMemberId: { $exists: true } },
			{ $rename: { teamMemberId: 'staffMemberId' } }
		)
		console.log(`    ✓ Updated ${result1.modifiedCount} shift(s)`)
		
		// Update notifiedTeamMemberIds to notifiedStaffMemberIds
		console.log('  - Renaming notifiedTeamMemberIds to notifiedStaffMemberIds...')
		const result2 = await shiftsCollection.updateMany(
			{ notifiedTeamMemberIds: { $exists: true } },
			{ $rename: { notifiedTeamMemberIds: 'notifiedStaffMemberIds' } }
		)
		console.log(`    ✓ Updated ${result2.modifiedCount} shift(s)`)
		
		// Update teamMemberNames to staffMemberNames (if exists)
		console.log('  - Checking for teamMemberNames field...')
		const result3 = await shiftsCollection.updateMany(
			{ teamMemberNames: { $exists: true } },
			{ $rename: { teamMemberNames: 'staffMemberNames' } }
		)
		if (result3.modifiedCount > 0) {
			console.log(`    ✓ Updated ${result3.modifiedCount} shift(s)`)
		}
		
		// Update teamMemberName to staffMemberName (if exists)
		console.log('  - Checking for teamMemberName field...')
		const result4 = await shiftsCollection.updateMany(
			{ teamMemberName: { $exists: true } },
			{ $rename: { teamMemberName: 'staffMemberName' } }
		)
		if (result4.modifiedCount > 0) {
			console.log(`    ✓ Updated ${result4.modifiedCount} shift(s)`)
		}
		
		// Update old teamMemberIds field if it exists (for backward compatibility cleanup)
		const result5 = await shiftsCollection.updateMany(
			{ teamMemberIds: { $exists: true } },
			{ $rename: { teamMemberIds: 'staffMemberIds' } }
		)
		if (result5.modifiedCount > 0) {
			console.log(`  - Updated ${result5.modifiedCount} shift(s) with old teamMemberIds field`)
		}
		
		console.log('\n✅ Migration complete!')
		console.log('\n📝 Next steps:')
		console.log('  1. Verify data in staffMembers collection')
		console.log('  2. Update application code to use new names')
		console.log('  3. After verification, you can manually drop teamMembers collection')
		
	} catch (error) {
		console.error('❌ Error during migration:', error)
		process.exit(1)
	} finally {
		await client.close()
	}
}

migrateTeamToStaff()


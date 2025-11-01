const { MongoClient } = require('mongodb')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '../.env') })

const uri = process.env.MONGODB_URI
if (!uri) {
	console.error('MONGODB_URI environment variable is required')
	process.exit(1)
}

// Get user email from command line argument or use default
const userEmail = process.argv[2] || process.env.USER_EMAIL || 'test@example.com'

async function updateShiftStatus() {
	const client = new MongoClient(uri)
	try {
		await client.connect()
		const db = client.db()
		
		console.log(`\n🔄 Updating shift status from "Approved" to "Timesheet Approved" for user: ${userEmail}\n`)
		
		// Get user
		const usersCollection = db.collection('users')
		const user = await usersCollection.findOne({ email: userEmail })
		
		if (!user) {
			console.error(`❌ User with email ${userEmail} not found`)
			process.exit(1)
		}
		
		console.log(`✓ Found user: ${user.name || userEmail}\n`)
		
		// Update shifts
		const shiftsCollection = db.collection('shifts')
		
		// Count shifts with "Approved" status
		const countBefore = await shiftsCollection.countDocuments({
			ownerEmail: userEmail,
			status: 'Approved'
		})
		
		console.log(`📊 Found ${countBefore} shift(s) with status "Approved"`)
		
		if (countBefore === 0) {
			console.log('✓ No shifts to update')
		} else {
			// Update all shifts with "Approved" status to "Timesheet Approved"
			const result = await shiftsCollection.updateMany(
				{ ownerEmail: userEmail, status: 'Approved' },
				{ 
					$set: { 
						status: 'Timesheet Approved',
						updatedAt: new Date()
					}
				}
			)
			
			console.log(`✓ Updated ${result.modifiedCount} shift(s) from "Approved" to "Timesheet Approved"`)
			
			if (result.modifiedCount !== countBefore) {
				console.warn(`⚠ Warning: Modified count (${result.modifiedCount}) does not match found count (${countBefore})`)
			}
		}
		
		console.log('\n✅ Update complete!')
		
	} catch (error) {
		console.error('❌ Error updating shifts:', error)
		process.exit(1)
	} finally {
		await client.close()
	}
}

updateShiftStatus()


const { MongoClient, ObjectId } = require('mongodb')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '../.env') })

const uri = process.env.MONGODB_URI
if (!uri) {
	console.error('MONGODB_URI environment variable is required')
	process.exit(1)
}

// Get user email from command line argument or use default
const userEmail = process.argv[2] || process.env.USER_EMAIL || 'test@example.com'

function getRandomElement(array) {
	if (array.length === 0) return null
	return array[Math.floor(Math.random() * array.length)]
}

async function randomlyAssignTeamMembers() {
	const client = new MongoClient(uri)
	try {
		await client.connect()
		const db = client.db()
		
		console.log(`\n🔄 Randomly assigning team members to shifts for user: ${userEmail}\n`)
		
		// Get user
		const usersCollection = db.collection('users')
		const user = await usersCollection.findOne({ email: userEmail })
		
		if (!user) {
			console.error(`❌ User with email ${userEmail} not found`)
			console.log('💡 Please create a user first or provide a valid email')
			process.exit(1)
		}
		
		console.log(`✓ Found user: ${user.name || userEmail}`)
		
		// Get team members for this user (only active, non-archived)
		const teamMembersCollection = db.collection('teamMembers')
		const teamMembers = await teamMembersCollection.find({ 
			ownerEmail: userEmail, 
			archived: { $ne: true },
			active: { $ne: false }
		}).toArray()
		
		if (teamMembers.length === 0) {
			console.error(`❌ No team members found for user ${userEmail}`)
			console.log('💡 Please create team members first')
			process.exit(1)
		}
		
		console.log(`✓ Found ${teamMembers.length} team member(s)`)
		
		// Get all shifts for this user (non-archived)
		const shiftsCollection = db.collection('shifts')
		const shifts = await shiftsCollection.find({ 
			ownerEmail: userEmail,
			archived: { $ne: true }
		}).toArray()
		
		if (shifts.length === 0) {
			console.error(`❌ No shifts found for user ${userEmail}`)
			process.exit(1)
		}
		
		console.log(`✓ Found ${shifts.length} shift(s)\n`)
		
		// Randomly assign team members to shifts
		let assignedCount = 0
		let skippedCount = 0
		
		for (const shift of shifts) {
			// 80% chance of assigning a team member
			if (Math.random() > 0.2) {
				const randomTeamMember = getRandomElement(teamMembers)
				const teamMemberId = randomTeamMember._id.toString()
				
				await shiftsCollection.updateOne(
					{ _id: shift._id },
					{
						$set: {
							teamMemberId: teamMemberId,
							updatedAt: new Date()
						}
					}
				)
				
				assignedCount++
			} else {
				// 20% chance of leaving shift unassigned
				await shiftsCollection.updateOne(
					{ _id: shift._id },
					{
						$unset: {
							teamMemberId: ''
						},
						$set: {
							updatedAt: new Date()
						}
					}
				)
				skippedCount++
			}
		}
		
		console.log(`✓ Assigned team members to ${assignedCount} shift(s)`)
		console.log(`✓ Left ${skippedCount} shift(s) unassigned`)
		console.log(`\n✅ Random assignment complete!`)
		
	} catch (error) {
		console.error('❌ Error assigning team members:', error)
		process.exit(1)
	} finally {
		await client.close()
	}
}

randomlyAssignTeamMembers()


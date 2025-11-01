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

// Valid dropdown values
const validClientTypes = ['Aged Care', 'NDIS', 'Others']
const validIdTypes = [
	"Australian Driver's License",
	"Oversea Driver's License",
	"Australian Passport",
	"Oversea Passport",
	"Others"
]

// Map old/invalid values to valid ones (if needed)
const clientTypeMap = {
	'Residential': 'Others',
	'Commercial': 'Others',
	'Private': 'Others',
	'NDIS': 'NDIS', // Keep if exists
	'Aged Care': 'Aged Care',
	'Others': 'Others'
}

const idTypeMap = {
	'Driver License': "Australian Driver's License",
	'Driver\'s License': "Australian Driver's License",
	'Drivers License': "Australian Driver's License",
	'Australian Driver License': "Australian Driver's License",
	'Overseas Driver License': "Oversea Driver's License",
	'Overseas Driver\'s License': "Oversea Driver's License",
	'Passport': 'Australian Passport',
	'Australian Passport': 'Australian Passport',
	'Overseas Passport': "Oversea Passport",
	'Oversea Passport': "Oversea Passport",
	'Other': 'Others',
	'Others': 'Others'
}

function normalizeClientType(clientType) {
	if (!clientType) return null
	
	// If already valid, return as is
	if (validClientTypes.includes(clientType)) {
		return clientType
	}
	
	// Try to map it
	const normalized = clientTypeMap[clientType]
	if (normalized) {
		return normalized
	}
	
	// Case-insensitive match
	const lowerType = clientType.toLowerCase().trim()
	for (const valid of validClientTypes) {
		if (valid.toLowerCase() === lowerType) {
			return valid
		}
	}
	
	// Default to 'Others' if can't match
	return 'Others'
}

function normalizeIdType(idType) {
	if (!idType) return null
	
	// If already valid, return as is
	if (validIdTypes.includes(idType)) {
		return idType
	}
	
	// Try to map it
	const normalized = idTypeMap[idType]
	if (normalized) {
		return normalized
	}
	
	// Case-insensitive match
	const lowerType = idType.toLowerCase().trim()
	for (const valid of validIdTypes) {
		if (valid.toLowerCase() === lowerType) {
			return valid
		}
	}
	
	// Partial matching for common variations
	if (lowerType.includes('driver') && lowerType.includes('license')) {
		if (lowerType.includes('australian') || lowerType.includes('aus')) {
			return "Australian Driver's License"
		} else if (lowerType.includes('oversea')) {
			return "Oversea Driver's License"
		}
		return "Australian Driver's License" // Default
	}
	
	if (lowerType.includes('passport')) {
		if (lowerType.includes('australian') || lowerType.includes('aus')) {
			return 'Australian Passport'
		} else if (lowerType.includes('oversea')) {
			return "Oversea Passport"
		}
		return 'Australian Passport' // Default
	}
	
	// Default to 'Others' if can't match
	return 'Others'
}

async function updateClientsAndTeamMembers() {
	const client = new MongoClient(uri)
	try {
		await client.connect()
		const db = client.db()
		
		console.log(`\n🔄 Updating clients and team members for user: ${userEmail}\n`)
		
		// Get user
		const usersCollection = db.collection('users')
		const user = await usersCollection.findOne({ email: userEmail })
		
		if (!user) {
			console.error(`❌ User with email ${userEmail} not found`)
			process.exit(1)
		}
		
		console.log(`✓ Found user: ${user.name || userEmail}\n`)
		
		// Update Clients
		const clientsCollection = db.collection('clients')
		const clients = await clientsCollection.find({ ownerEmail: userEmail }).toArray()
		
		console.log(`\n📋 Updating ${clients.length} client(s)...`)
		
		let clientsUpdated = 0
		for (const client of clients) {
			const currentClientType = client.clientType
			const normalizedClientType = normalizeClientType(currentClientType)
			
			if (currentClientType !== normalizedClientType) {
				await clientsCollection.updateOne(
					{ _id: client._id },
					{ 
						$set: { 
							clientType: normalizedClientType,
							updatedAt: new Date()
						}
					}
				)
				console.log(`  ✓ Updated client "${client.name}": "${currentClientType}" → "${normalizedClientType}"`)
				clientsUpdated++
			}
		}
		
		if (clientsUpdated === 0) {
			console.log(`  ✓ All clients already have valid client types`)
		} else {
			console.log(`\n✓ Updated ${clientsUpdated} client(s)`)
		}
		
		// Update Team Members
		const teamMembersCollection = db.collection('teamMembers')
		const teamMembers = await teamMembersCollection.find({ ownerEmail: userEmail }).toArray()
		
		console.log(`\n👥 Updating ${teamMembers.length} team member(s)...`)
		
		let teamMembersUpdated = 0
		for (const member of teamMembers) {
			const currentIdType = member.idType
			const normalizedIdType = normalizeIdType(currentIdType)
			
			if (currentIdType !== normalizedIdType) {
				await teamMembersCollection.updateOne(
					{ _id: member._id },
					{ 
						$set: { 
							idType: normalizedIdType,
							updatedAt: new Date()
						}
					}
				)
				console.log(`  ✓ Updated team member "${member.name}": "${currentIdType}" → "${normalizedIdType}"`)
				teamMembersUpdated++
			}
		}
		
		if (teamMembersUpdated === 0) {
			console.log(`  ✓ All team members already have valid ID types`)
		} else {
			console.log(`\n✓ Updated ${teamMembersUpdated} team member(s)`)
		}
		
		// Show summary
		console.log('\n📊 Summary:')
		console.log(`   Clients: ${clients.length} total, ${clientsUpdated} updated`)
		console.log(`   Team Members: ${teamMembers.length} total, ${teamMembersUpdated} updated`)
		
		console.log('\n✅ Update complete!')
		
	} catch (error) {
		console.error('❌ Error updating data:', error)
		process.exit(1)
	} finally {
		await client.close()
	}
}

updateClientsAndTeamMembers()


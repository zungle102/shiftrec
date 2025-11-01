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
const numTeamMembers = parseInt(process.argv[3]) || 3

// Sample data arrays
const firstNames = ['John', 'Sarah', 'Michael', 'Emma', 'David', 'Olivia', 'James', 'Sophia', 'Robert', 'Isabella']
const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez']
const suburbs = ['Adelaide', 'Melbourne', 'Sydney', 'Brisbane', 'Perth', 'Hobart', 'Darwin', 'Canberra']
const states = ['SA', 'VIC', 'NSW', 'QLD', 'WA', 'TAS', 'NT', 'ACT']

function getRandomElement(array) {
	return array[Math.floor(Math.random() * array.length)]
}

function generatePhoneNumber() {
	const areaCode = ['04', '03', '02', '07', '08'][Math.floor(Math.random() * 5)]
	const number = Math.floor(Math.random() * 100000000).toString().padStart(8, '0')
	return `+61 ${areaCode} ${number}`
}

function generateIdNumber(idTypeName) {
	if (idTypeName.includes("Driver's License") || idTypeName.includes("Driver License")) {
		return `${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`
	} else if (idTypeName.includes('Passport')) {
		return `${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`
	} else if (idTypeName.includes('Visa')) {
		return `${Math.floor(Math.random() * 1000000000).toString().padStart(9, '0')}`
	} else {
		// For Others or any other type
		return `${Math.floor(Math.random() * 1000000000).toString().padStart(9, '0')}`
	}
}

async function seedTeamMembers() {
	const client = new MongoClient(uri)
	try {
		await client.connect()
		const db = client.db()
		
		console.log(`\n🌱 Generating ${numTeamMembers} team members for user: ${userEmail}\n`)
		
		// Get user
		const usersCollection = db.collection('users')
		const user = await usersCollection.findOne({ email: userEmail })
		
		if (!user) {
			console.error(`❌ User with email ${userEmail} not found`)
			console.log('💡 Please create a user first or provide a valid email')
			process.exit(1)
		}
		
		console.log(`✓ Found user: ${user.name || userEmail}`)
		
		// Fetch ID Types from database
		const idTypesCollection = db.collection('idTypes')
		const idTypes = await idTypesCollection.find({ active: true }).sort({ order: 1 }).toArray()
		
		if (idTypes.length === 0) {
			console.warn('⚠ Warning: No ID types found in database. Using fallback values.')
		} else {
			console.log(`✓ Found ${idTypes.length} ID type(s) in database`)
		}
		
		// Check existing staff members to avoid duplicate emails
		const staffMembersCollection = db.collection('staffMembers')
		const existingMembers = await staffMembersCollection.find({ ownerEmail: userEmail }).toArray()
		const existingEmails = new Set(existingMembers.map(m => m.email))
		
		console.log(`✓ Found ${existingMembers.length} existing team member(s)`)
		
		// Generate team members
		const teamMembers = []
		const now = new Date()
		let created = 0
		let skipped = 0
		
		for (let i = 0; i < numTeamMembers; i++) {
			const firstName = getRandomElement(firstNames)
			const lastName = getRandomElement(lastNames)
			const name = `${firstName} ${lastName}`
			const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`
			
			// Skip if email already exists
			if (existingEmails.has(email)) {
				console.log(`⚠ Skipping ${name} - email already exists`)
				skipped++
				continue
			}
			
			// Select random ID type from database, or use fallback
			let idTypeId = null
			let idTypeName = 'Others'
			if (idTypes.length > 0) {
				const selectedIdType = getRandomElement(idTypes)
				idTypeId = selectedIdType._id
				idTypeName = selectedIdType.name
			}
			
			const suburb = getRandomElement(suburbs)
			const state = getRandomElement(states)
			const streetNumber = Math.floor(Math.random() * 999) + 1
			
			const teamMember = {
				ownerEmail: userEmail,
				name,
				email,
				phone: generatePhoneNumber(),
				idTypeId: idTypeId ? new ObjectId(idTypeId) : null,
				idNumber: generateIdNumber(idTypeName),
				address: `${streetNumber} Sample Street`,
				suburb,
				state,
				postcode: `${Math.floor(Math.random() * 9000) + 1000}`,
				active: true,
				archived: false,
				createdAt: now,
				updatedAt: now
			}
			
			teamMembers.push(teamMember)
			existingEmails.add(email) // Add to set to avoid duplicates in this batch
		}
		
		if (teamMembers.length > 0) {
			const result = await staffMembersCollection.insertMany(teamMembers)
			created = result.insertedCount
			console.log(`✓ Created ${created} team member(s)`)
		}
		
		if (skipped > 0) {
			console.log(`⚠ Skipped ${skipped} team member(s) due to duplicate emails`)
		}
		
		console.log('\n✅ Seed data generation complete!')
		if (created > 0) {
			console.log('\n📊 Created Team Members:')
			// Create a map for ID type names for display
			const idTypeMap = new Map(idTypes.map(it => [it._id.toString(), it.name]))
			teamMembers.forEach((tm, idx) => {
				const idTypeName = tm.idTypeId ? (idTypeMap.get(tm.idTypeId.toString()) || 'Unknown') : 'None'
				console.log(`  ${idx + 1}. ${tm.name} (${tm.email}) - ID Type: ${idTypeName}`)
			})
		}
		
	} catch (error) {
		console.error('❌ Error seeding team members:', error)
		process.exit(1)
	} finally {
		await client.close()
	}
}

seedTeamMembers()


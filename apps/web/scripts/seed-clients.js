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
const numClients = parseInt(process.argv[3]) || 3

// Sample data arrays
const firstNames = ['John', 'Sarah', 'Michael', 'Emma', 'David', 'Olivia', 'James', 'Sophia', 'Robert', 'Isabella']
const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez']
const companyNames = ['Care Services', 'Home Support', 'Aged Care Solutions', 'Community Care', 'Family Support']
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

async function seedClients() {
	const client = new MongoClient(uri)
	try {
		await client.connect()
		const db = client.db()
		
		console.log(`\n🌱 Generating ${numClients} clients for user: ${userEmail}\n`)
		
		// Get user
		const usersCollection = db.collection('users')
		const user = await usersCollection.findOne({ email: userEmail })
		
		if (!user) {
			console.error(`❌ User with email ${userEmail} not found`)
			console.log('💡 Please create a user first or provide a valid email')
			process.exit(1)
		}
		
		console.log(`✓ Found user: ${user.name || userEmail}`)
		
		// Fetch Client Types from database
		const clientTypesCollection = db.collection('clientTypes')
		const clientTypes = await clientTypesCollection.find({ active: true }).sort({ order: 1 }).toArray()
		
		if (clientTypes.length === 0) {
			console.warn('⚠ Warning: No client types found in database. Using fallback values.')
		} else {
			console.log(`✓ Found ${clientTypes.length} client type(s) in database`)
		}
		
		// Check existing clients to avoid duplicate names
		const clientsCollection = db.collection('clients')
		const existingClients = await clientsCollection.find({ ownerEmail: userEmail }).toArray()
		const existingNames = new Set(existingClients.map(c => c.name))
		
		console.log(`✓ Found ${existingClients.length} existing client(s)`)
		
		// Generate clients
		const clients = []
		const now = new Date()
		let created = 0
		let skipped = 0
		
		for (let i = 0; i < numClients; i++) {
			const firstName = getRandomElement(firstNames)
			const lastName = getRandomElement(lastNames)
			const name = `${firstName} ${lastName}`
			
			// Skip if name already exists
			if (existingNames.has(name)) {
				console.log(`⚠ Skipping ${name} - name already exists`)
				skipped++
				continue
			}
			
			// Select random client type from database, or use fallback
			let clientTypeId = null
			let clientTypeName = 'Others'
			if (clientTypes.length > 0) {
				const selectedClientType = getRandomElement(clientTypes)
				clientTypeId = selectedClientType._id
				clientTypeName = selectedClientType.name
			}
			
			const suburb = getRandomElement(suburbs)
			const state = getRandomElement(states)
			const streetNumber = Math.floor(Math.random() * 999) + 1
			const phoneNumber = generatePhoneNumber()
			
			const client = {
				ownerEmail: userEmail,
				name,
				address: `${streetNumber} Sample Street`,
				suburb,
				state,
				postcode: `${Math.floor(Math.random() * 9000) + 1000}`,
				clientTypeId: clientTypeId ? new ObjectId(clientTypeId) : null,
				phoneNumber,
				email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
				contactPerson: `${firstName} ${lastName}`,
				contactPhone: phoneNumber,
				note: `Client note for ${name}`,
				active: true,
				archived: false,
				createdAt: now,
				updatedAt: now
			}
			
			clients.push(client)
			existingNames.add(name) // Add to set to avoid duplicates in this batch
		}
		
		if (clients.length > 0) {
			const result = await clientsCollection.insertMany(clients)
			created = result.insertedCount
			console.log(`✓ Created ${created} client(s)`)
		}
		
		if (skipped > 0) {
			console.log(`⚠ Skipped ${skipped} client(s) due to duplicate names`)
		}
		
		console.log('\n✅ Seed data generation complete!')
		if (created > 0) {
			console.log('\n📊 Created Clients:')
			// Fetch client type names for display
			const clientTypeMap = new Map(clientTypes.map(ct => [ct._id.toString(), ct.name]))
			clients.forEach((c, idx) => {
				const clientTypeName = c.clientTypeId ? (clientTypeMap.get(c.clientTypeId.toString()) || 'Unknown') : 'None'
				console.log(`  ${idx + 1}. ${c.name} (${clientTypeName})`)
			})
		}
		
	} catch (error) {
		console.error('❌ Error seeding clients:', error)
		process.exit(1)
	} finally {
		await client.close()
	}
}

seedClients()


const { MongoClient } = require('mongodb')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '../.env') })

const uri = process.env.MONGODB_URI
if (!uri) {
	console.error('MONGODB_URI environment variable is required')
	process.exit(1)
}

async function createIndexes() {
	const client = new MongoClient(uri)
	try {
		await client.connect()
		const db = client.db()
		
		console.log('\n🔧 Creating database indexes...\n')
		
		// Users collection
		const usersCollection = db.collection('users')
		try {
			await usersCollection.createIndex({ email: 1 }, { unique: true })
			console.log('✓ Created unique index on users.email')
		} catch (err) {
			if (err.code !== 85) console.log('⚠ Index on users.email may already exist')
		}
		
		// Accounts collection (OAuth)
		const accountsCollection = db.collection('accounts')
		try {
			await accountsCollection.createIndex({ providerId: 1, providerAccountId: 1 }, { unique: true })
			console.log('✓ Created unique index on accounts.providerId + providerAccountId')
		} catch (err) {
			if (err.code !== 85) console.log('⚠ Index on accounts may already exist')
		}
		
		// Staff Members collection
		const staffMembersCollection = db.collection('staffMembers')
		try {
			await staffMembersCollection.createIndex({ ownerEmail: 1, email: 1 }, { unique: true })
			console.log('✓ Created unique index on staffMembers.ownerEmail + email')
		} catch (err) {
			if (err.code !== 85) console.log('⚠ Index on staffMembers.ownerEmail + email may already exist')
		}
		try {
			await staffMembersCollection.createIndex({ ownerEmail: 1, active: 1 })
			console.log('✓ Created index on staffMembers.ownerEmail + active')
		} catch (err) {
			if (err.code !== 85) console.log('⚠ Index may already exist')
		}
		try {
			await staffMembersCollection.createIndex({ ownerEmail: 1, archived: 1 })
			console.log('✓ Created index on staffMembers.ownerEmail + archived')
		} catch (err) {
			if (err.code !== 85) console.log('⚠ Index may already exist')
		}
		try {
			await staffMembersCollection.createIndex({ ownerEmail: 1, idTypeId: 1 })
			console.log('✓ Created index on staffMembers.ownerEmail + idTypeId')
		} catch (err) {
			if (err.code !== 85) console.log('⚠ Index may already exist')
		}
		
		// Clients collection
		const clientsCollection = db.collection('clients')
		try {
			await clientsCollection.createIndex({ ownerEmail: 1, name: 1 }, { unique: true })
			console.log('✓ Created unique index on clients.ownerEmail + name')
		} catch (err) {
			if (err.code !== 85) console.log('⚠ Index on clients.ownerEmail + name may already exist')
		}
		try {
			await clientsCollection.createIndex({ ownerEmail: 1, active: 1 })
			console.log('✓ Created index on clients.ownerEmail + active')
		} catch (err) {
			if (err.code !== 85) console.log('⚠ Index may already exist')
		}
		try {
			await clientsCollection.createIndex({ ownerEmail: 1, clientTypeId: 1 })
			console.log('✓ Created index on clients.ownerEmail + clientTypeId')
		} catch (err) {
			if (err.code !== 85) console.log('⚠ Index may already exist')
		}
		try {
			await clientsCollection.createIndex({ ownerEmail: 1, archived: 1 })
			console.log('✓ Created index on clients.ownerEmail + archived')
		} catch (err) {
			if (err.code !== 85) console.log('⚠ Index may already exist')
		}
		
		// Shifts collection
		const shiftsCollection = db.collection('shifts')
		try {
			await shiftsCollection.createIndex({ ownerEmail: 1, serviceDate: -1 })
			console.log('✓ Created index on shifts.ownerEmail + serviceDate')
		} catch (err) {
			if (err.code !== 85) console.log('⚠ Index may already exist')
		}
		try {
			await shiftsCollection.createIndex({ ownerEmail: 1, status: 1 })
			console.log('✓ Created index on shifts.ownerEmail + status')
		} catch (err) {
			if (err.code !== 85) console.log('⚠ Index may already exist')
		}
		try {
			await shiftsCollection.createIndex({ ownerEmail: 1, archived: 1 })
			console.log('✓ Created index on shifts.ownerEmail + archived')
		} catch (err) {
			if (err.code !== 85) console.log('⚠ Index may already exist')
		}
		try {
			await shiftsCollection.createIndex({ ownerEmail: 1, assignedStaffMemberId: 1 })
			console.log('✓ Created index on shifts.ownerEmail + assignedStaffMemberId')
		} catch (err) {
			if (err.code !== 85) console.log('⚠ Index may already exist')
		}
		try {
			await shiftsCollection.createIndex({ ownerEmail: 1, clientId: 1 })
			console.log('✓ Created index on shifts.ownerEmail + clientId')
		} catch (err) {
			if (err.code !== 85) console.log('⚠ Index may already exist')
		}
		try {
			await shiftsCollection.createIndex({ ownerEmail: 1, serviceDate: 1, status: 1 })
			console.log('✓ Created compound index on shifts.ownerEmail + serviceDate + status')
		} catch (err) {
			if (err.code !== 85) console.log('⚠ Index may already exist')
		}
		
		// Reference Data collections
		const idTypesCollection = db.collection('idTypes')
		try {
			await idTypesCollection.createIndex({ active: 1, order: 1 })
			console.log('✓ Created index on idTypes.active + order')
		} catch (err) {
			if (err.code !== 85) console.log('⚠ Index may already exist')
		}
		
		const clientTypesCollection = db.collection('clientTypes')
		try {
			await clientTypesCollection.createIndex({ active: 1, order: 1 })
			console.log('✓ Created index on clientTypes.active + order')
		} catch (err) {
			if (err.code !== 85) console.log('⚠ Index may already exist')
		}
		
		console.log('\n✅ All indexes created successfully!')
		
	} catch (error) {
		console.error('❌ Error creating indexes:', error)
		process.exit(1)
	} finally {
		await client.close()
	}
}

createIndexes()


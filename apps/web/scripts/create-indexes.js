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
		const usersCollection = db.collection('users')
		
		// Create unique index on email
		await usersCollection.createIndex({ email: 1 }, { unique: true })
		console.log('✓ Created unique index on users.email')
		
		// Create index on accounts for OAuth
		const accountsCollection = db.collection('accounts')
		await accountsCollection.createIndex({ providerId: 1, providerAccountId: 1 }, { unique: true })
		console.log('✓ Created unique index on accounts.providerId + providerAccountId')
		
		console.log('✓ All indexes created successfully')
	} catch (error) {
		console.error('Error creating indexes:', error)
		process.exit(1)
	} finally {
		await client.close()
	}
}

createIndexes()


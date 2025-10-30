const { MongoClient } = require('mongodb')
const { hash } = require('bcryptjs')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '../.env') })

const uri = process.env.MONGODB_URI
if (!uri) {
	console.error('MONGODB_URI environment variable is required')
	process.exit(1)
}

async function seed() {
	const client = new MongoClient(uri)
	try {
		await client.connect()
		const db = client.db()
		const usersCollection = db.collection('users')
		
		// Check if test user exists
		const existing = await usersCollection.findOne({ email: 'test@example.com' })
		if (existing) {
			console.log('ℹ Test user already exists (test@example.com)')
			return
		}
		
		// Create test user
		const hashedPassword = await hash('testpassword123', 12)
		const now = new Date()
		await usersCollection.insertOne({
			name: 'Test User',
			email: 'test@example.com',
			password: hashedPassword,
			emailVerified: null,
			createdAt: now,
			updatedAt: now
		})
		
		console.log('✓ Created test user: test@example.com / testpassword123')
	} catch (error) {
		console.error('Error seeding database:', error)
		process.exit(1)
	} finally {
		await client.close()
	}
}

seed()


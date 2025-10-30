const { MongoClient } = require('mongodb')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '../.env') })

const uri = process.env.MONGODB_URI
if (!uri) {
	console.error('MONGODB_URI environment variable is required')
	process.exit(1)
}

async function listSeedData() {
	const client = new MongoClient(uri)
	try {
		await client.connect()
		const db = client.db()
		
		console.log('\n📊 SEED DATA IN DATABASE\n')
		console.log('='.repeat(60))
		
		// List users
		const usersCollection = db.collection('users')
		const users = await usersCollection.find({}).toArray()
		
		console.log(`\n👤 Users (${users.length}):`)
		console.log('-'.repeat(60))
		if (users.length === 0) {
			console.log('  No users found')
		} else {
			users.forEach((user, index) => {
				console.log(`\n  User ${index + 1}:`)
				console.log(`    - Name: ${user.name || 'N/A'}`)
				console.log(`    - Email: ${user.email}`)
				console.log(`    - ID: ${user._id}`)
				console.log(`    - Has Password: ${user.password ? 'Yes' : 'No'}`)
				console.log(`    - Email Verified: ${user.emailVerified || 'Not verified'}`)
				console.log(`    - Created: ${user.createdAt || 'N/A'}`)
				console.log(`    - Updated: ${user.updatedAt || 'N/A'}`)
			})
		}
		
		// List accounts (for OAuth)
		const accountsCollection = db.collection('accounts')
		const accounts = await accountsCollection.find({}).toArray()
		
		console.log(`\n🔗 OAuth Accounts (${accounts.length}):`)
		console.log('-'.repeat(60))
		if (accounts.length === 0) {
			console.log('  No OAuth accounts found')
		} else {
			accounts.forEach((account, index) => {
				console.log(`\n  Account ${index + 1}:`)
				console.log(`    - Provider: ${account.providerId}`)
				console.log(`    - Provider Account ID: ${account.providerAccountId}`)
				console.log(`    - User ID: ${account.userId}`)
			})
		}
		
		// List sessions
		const sessionsCollection = db.collection('sessions')
		const sessions = await sessionsCollection.find({}).toArray()
		
		console.log(`\n🔐 Sessions (${sessions.length}):`)
		console.log('-'.repeat(60))
		if (sessions.length === 0) {
			console.log('  No sessions found')
		} else {
			sessions.forEach((session, index) => {
				console.log(`\n  Session ${index + 1}:`)
				console.log(`    - Session Token: ${session.sessionToken?.substring(0, 20)}...`)
				console.log(`    - User ID: ${session.userId}`)
				console.log(`    - Expires: ${session.expires || 'N/A'}`)
			})
		}
		
		console.log('\n' + '='.repeat(60))
		console.log('\n✅ Seed Data Summary:')
		console.log(`   - Users: ${users.length}`)
		console.log(`   - OAuth Accounts: ${accounts.length}`)
		console.log(`   - Sessions: ${sessions.length}`)
		
		if (users.length > 0) {
			const testUser = users.find(u => u.email === 'test@example.com')
			if (testUser) {
				console.log('\n📝 Test User Credentials:')
				console.log('   Email: test@example.com')
				console.log('   Password: testpassword123')
			}
		}
		
	} catch (error) {
		console.error('Error listing seed data:', error)
		process.exit(1)
	} finally {
		await client.close()
	}
}

listSeedData()


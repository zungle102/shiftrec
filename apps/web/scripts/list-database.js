const { MongoClient } = require('mongodb')
const path = require('path')

require('dotenv').config({ path: path.join(__dirname, '../.env') })

const uri = process.env.MONGODB_URI
if (!uri) {
	console.error('MONGODB_URI environment variable is required')
	process.exit(1)
}

async function listDatabase() {
	const client = new MongoClient(uri)
	try {
		await client.connect()
		const db = client.db()
		
		console.log('\n📊 DATABASE COLLECTIONS OVERVIEW\n')
		console.log('='.repeat(80))
		
		// Get all collection names
		const collections = await db.listCollections().toArray()
		const collectionNames = collections.map(c => c.name).sort()
		
		console.log(`\nFound ${collectionNames.length} collection(s):\n`)
		
		// List each collection with document count and sample data
		for (const collectionName of collectionNames) {
			const collection = db.collection(collectionName)
			const count = await collection.countDocuments()
			
			console.log(`\n📦 ${collectionName.toUpperCase()}`)
			console.log('-'.repeat(80))
			console.log(`   Total Documents: ${count}`)
			
			if (count > 0) {
				// Get a few sample documents
				const samples = await collection.find({}).limit(3).toArray()
				
				console.log(`\n   Sample Documents (showing ${Math.min(3, count)} of ${count}):`)
				
				samples.forEach((doc, index) => {
					console.log(`\n   [${index + 1}]`)
					
					// Show key fields based on collection type
					if (collectionName === 'users') {
						console.log(`      _id: ${doc._id}`)
						console.log(`      email: ${doc.email || 'N/A'}`)
						console.log(`      name: ${doc.name || 'N/A'}`)
						console.log(`      businessName: ${doc.businessName || 'N/A'}`)
					} else if (collectionName === 'staffMembers') {
						console.log(`      _id: ${doc._id}`)
						console.log(`      name: ${doc.name || 'N/A'}`)
						console.log(`      email: ${doc.email || 'N/A'}`)
						console.log(`      ownerEmail: ${doc.ownerEmail || 'N/A'}`)
						console.log(`      active: ${doc.active !== undefined ? doc.active : 'N/A'}`)
						console.log(`      archived: ${doc.archived || false}`)
					} else if (collectionName === 'clients') {
						console.log(`      _id: ${doc._id}`)
						console.log(`      name: ${doc.name || 'N/A'}`)
						console.log(`      ownerEmail: ${doc.ownerEmail || 'N/A'}`)
						console.log(`      active: ${doc.active !== undefined ? doc.active : 'N/A'}`)
						console.log(`      archived: ${doc.archived || false}`)
					} else if (collectionName === 'shifts') {
						console.log(`      _id: ${doc._id}`)
						console.log(`      ownerEmail: ${doc.ownerEmail || 'N/A'}`)
						console.log(`      serviceDate: ${doc.serviceDate || 'N/A'}`)
						console.log(`      status: ${doc.status || 'N/A'}`)
						console.log(`      clientId: ${doc.clientId ? doc.clientId.toString() : 'N/A'}`)
						console.log(`      clientName: ${doc.clientName || 'N/A'}`)
						console.log(`      staffMemberId: ${doc.staffMemberId ? doc.staffMemberId.toString() : 'N/A'}`)
						console.log(`      teamMemberId: ${doc.teamMemberId ? doc.teamMemberId.toString() : 'N/A'}`)
						console.log(`      archived: ${doc.archived || false}`)
					} else if (collectionName === 'idTypes') {
						console.log(`      _id: ${doc._id}`)
						console.log(`      name: ${doc.name || 'N/A'}`)
						console.log(`      order: ${doc.order || 'N/A'}`)
						console.log(`      active: ${doc.active !== undefined ? doc.active : 'N/A'}`)
					} else if (collectionName === 'clientTypes') {
						console.log(`      _id: ${doc._id}`)
						console.log(`      name: ${doc.name || 'N/A'}`)
						console.log(`      order: ${doc.order || 'N/A'}`)
						console.log(`      active: ${doc.active !== undefined ? doc.active : 'N/A'}`)
					} else if (collectionName === 'accounts' || collectionName === 'sessions') {
						console.log(`      _id: ${doc._id}`)
						console.log(`      (NextAuth internal collection)`)
					} else {
						// Generic display for other collections
						const keys = Object.keys(doc).slice(0, 5)
						keys.forEach(key => {
							if (key !== '_id') {
								const value = doc[key]
								const displayValue = typeof value === 'object' && value !== null 
									? JSON.stringify(value).substring(0, 50) + '...'
									: String(value).substring(0, 50)
								console.log(`      ${key}: ${displayValue}`)
							}
						})
					}
				})
			} else {
				console.log('   (empty collection)')
			}
		}
		
		// Summary
		console.log('\n' + '='.repeat(80))
		console.log('\n📈 SUMMARY')
		console.log('-'.repeat(80))
		
		let totalDocuments = 0
		for (const collectionName of collectionNames) {
			const collection = db.collection(collectionName)
			const count = await collection.countDocuments()
			totalDocuments += count
			console.log(`   ${collectionName}: ${count} document(s)`)
		}
		
		console.log(`\n   Total: ${totalDocuments} documents across ${collectionNames.length} collections`)
		
		// Check for indexes
		console.log('\n📇 DATABASE INDEXES')
		console.log('-'.repeat(80))
		for (const collectionName of collectionNames) {
			const collection = db.collection(collectionName)
			try {
				const indexes = await collection.indexes()
				if (indexes.length > 1) { // More than just _id index
					console.log(`\n   ${collectionName}:`)
					indexes.forEach(index => {
						if (index.name !== '_id_') {
							const keys = Object.keys(index.key).map(k => `${k}:${index.key[k]}`).join(', ')
							const unique = index.unique ? ' [UNIQUE]' : ''
							console.log(`      - ${index.name}: { ${keys} }${unique}`)
						}
					})
				}
			} catch (err) {
				// Collection might not exist or accessible
			}
		}
		
		console.log('\n')
		
	} catch (error) {
		console.error('❌ Error listing database:', error)
		process.exit(1)
	} finally {
		await client.close()
	}
}

listDatabase()


import { config } from 'dotenv'
import { resolve } from 'path'
import { MongoClient } from 'mongodb'

// Load .env file before accessing environment variables
config({ path: resolve(process.cwd(), '.env') })

const uri = process.env.MONGODB_URI || ''
if (!uri) {
	throw new Error('MONGODB_URI is not set. Please check your .env file.')
}

declare global {
	// eslint-disable-next-line no-var
	var _mongoClientPromise: Promise<MongoClient> | undefined
}

let client: MongoClient
let clientPromise: Promise<MongoClient>

if (process.env.NODE_ENV === 'development') {
	if (!global._mongoClientPromise) {
		client = new MongoClient(uri)
		global._mongoClientPromise = client.connect().catch(err => {
			console.error('❌ MongoDB connection error:', err.message)
			throw err
		})
	}
	clientPromise = global._mongoClientPromise
} else {
	client = new MongoClient(uri)
	clientPromise = client.connect().catch(err => {
		console.error('❌ MongoDB connection error:', err.message)
		throw err
	})
}

export default clientPromise


import 'reflect-metadata'
import { config } from 'dotenv'
import { resolve } from 'path'
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'

// Load environment variables from .env file
config({ path: resolve(__dirname, '../.env') })

async function bootstrap() {
	try {
		const app = await NestFactory.create(AppModule)
		
		// Enable CORS for frontend
		app.enableCors({
			origin: process.env.FRONTEND_URL || 'http://localhost:3000',
			credentials: true,
			methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
			allowedHeaders: ['Content-Type', 'Authorization', 'x-user-email']
		})

		const port = parseInt(process.env.PORT || '4000', 10)
		await app.listen(port)
		console.log(`🚀 API Server running on http://localhost:${port}`)
	} catch (error) {
		console.error('❌ Failed to start server:', error)
		process.exit(1)
	}
}

bootstrap()


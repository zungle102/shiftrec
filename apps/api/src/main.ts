import 'reflect-metadata'
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'

async function bootstrap() {
	const app = await NestFactory.create(AppModule)
	
	// Enable CORS for frontend
	app.enableCors({
		origin: process.env.FRONTEND_URL || 'http://localhost:3000',
		credentials: true,
		methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
		allowedHeaders: ['Content-Type', 'Authorization', 'x-user-email']
	})

	const port = process.env.PORT || 4000
	await app.listen(port)
	console.log(`🚀 API Server running on http://localhost:${port}`)
}

bootstrap()


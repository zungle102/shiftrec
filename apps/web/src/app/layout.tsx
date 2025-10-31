import './globals.css'
import { ReactNode } from 'react'
import { Providers } from './providers'
import { Navbar } from '../components/Navbar'
import { Footer } from '../components/Footer'

export const metadata = {
	title: 'ShiftRec - Recording and Managing Workshifts Smoothly',
	description: 'Signup-enabled app with NextAuth and MongoDB'
}

export default function RootLayout({ children }: { children: ReactNode }) {
	return (
		<html lang="en">
			<body className="min-h-screen bg-gray-50 text-gray-900 flex flex-col">
				<Providers>
					<Navbar />
					<main className="flex-1">
						{children}
					</main>
					<Footer />
				</Providers>
			</body>
		</html>
	)
}



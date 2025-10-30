import './globals.css'
import { ReactNode } from 'react'
import { Providers } from './providers'
import { Navbar } from '../components/Navbar'

export const metadata = {
	title: 'ShiftRec - Smoothly Recording and Managing Workshifts',
	description: 'Signup-enabled app with NextAuth and MongoDB'
}

export default function RootLayout({ children }: { children: ReactNode }) {
	return (
		<html lang="en">
			<body className="min-h-screen bg-gray-50 text-gray-900">
				<Providers>
					<Navbar />
					{children}
				</Providers>
			</body>
		</html>
	)
}



"use client"
import Link from 'next/link'
import { signIn, signOut, useSession } from 'next-auth/react'

export function Navbar() {
	const { data: session, status } = useSession()
	return (
		<nav className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="flex items-center justify-between h-16">
					{/* Logo/Brand */}
					<Link 
						href="/" 
						className="flex items-center space-x-2 group"
						title="ShiftRec - Recording and Managing Workshifts Smoothly"
					>
						<div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-600 group-hover:bg-blue-700 transition-colors">
							<svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
							</svg>
						</div>
						<div className="flex flex-col">
							<span className="text-xl font-bold text-gray-900">ShiftRec</span>
							<span className="hidden lg:block text-xs text-gray-500 leading-tight">
								Recording and Managing Workshifts Smoothly
							</span>
						</div>
					</Link>

					{/* Navigation Links */}
					<div className="hidden md:flex items-center space-x-1">
						<Link 
							href="/" 
							className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-lg transition-colors"
						>
							Home
						</Link>
						{status === 'loading' ? (
							<div className="px-4 py-2">
								<div className="w-5 h-5 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
							</div>
						) : session ? (
							<>
								<Link 
									href="/dashboard" 
									className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-lg transition-colors"
								>
									Dashboard
								</Link>
								<div className="flex items-center space-x-3 ml-4 pl-4 border-l border-gray-200">
									<Link 
										href="/dashboard/profile" 
										className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
									>
										<div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
											<span className="text-sm font-semibold text-blue-600">
												{session.user?.email?.charAt(0).toUpperCase() || 'U'}
											</span>
										</div>
										<span className="hidden lg:block text-sm font-medium text-gray-700">
											{session.user?.name || session.user?.email?.split('@')[0]}
										</span>
									</Link>
									<button 
										onClick={() => signOut({ callbackUrl: '/' })} 
										className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
									>
										Sign out
									</button>
								</div>
							</>
						) : (
							<>
								<Link 
									href="/signin" 
									className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-lg transition-colors"
								>
									Sign in
								</Link>
								<Link 
									href="/signup" 
									className="ml-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm"
								>
									Get Started
								</Link>
							</>
						)}
					</div>

					{/* Mobile Menu Button */}
					<div className="md:hidden flex items-center space-x-2">
						{status === 'loading' ? (
							<div className="w-5 h-5 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
						) : session ? (
							<>
								<Link 
									href="/dashboard" 
									className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-blue-600 rounded-lg transition-colors"
								>
									Dashboard
								</Link>
								<button 
									onClick={() => signOut({ callbackUrl: '/' })} 
									className="px-3 py-1.5 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors"
								>
									Sign out
								</button>
							</>
						) : (
							<>
								<Link 
									href="/signin" 
									className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-blue-600 rounded-lg transition-colors"
								>
									Sign in
								</Link>
								<Link 
									href="/signup" 
									className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
								>
									Sign up
								</Link>
							</>
						)}
					</div>
				</div>
			</div>
		</nav>
	)
}



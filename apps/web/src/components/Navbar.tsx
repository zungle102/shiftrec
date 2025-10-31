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
						className="flex items-center space-x-3 group"
						title="ShiftRec - Seamlessly manage and track every shift."
					>
						<div className="flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 group-hover:from-blue-700 group-hover:to-indigo-700 transition-all shadow-md group-hover:shadow-lg">
							<svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
							</svg>
						</div>
						<div className="flex flex-col">
							<span className="text-2xl font-extrabold bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 bg-clip-text text-transparent tracking-tight group-hover:from-blue-700 group-hover:via-indigo-700 group-hover:to-blue-800 transition-all">
								ShiftRec
							</span>
							<span className="hidden lg:block text-xs text-gray-500 leading-tight font-medium mt-0.5">
								Seamlessly manage and track every shift.
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
								<div className="flex items-center space-x-4 ml-4 pl-4 border-l border-gray-200">
									<Link 
										href="/dashboard/profile" 
										className="flex items-center space-x-3 group/profile hover:opacity-90 transition-all px-3 py-1.5 rounded-lg hover:bg-gray-50"
									>
										<div className="relative">
											<div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 via-indigo-500 to-blue-600 flex items-center justify-center shadow-md group-hover/profile:shadow-lg transition-shadow">
												<span className="text-sm font-bold text-white">
													{session.user?.email?.charAt(0).toUpperCase() || 'U'}
												</span>
											</div>
											<div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-400 border-2 border-white rounded-full"></div>
										</div>
										<div className="hidden lg:flex flex-col">
											<span className="text-sm font-semibold text-gray-900 group-hover/profile:text-blue-600 transition-colors">
												{session.user?.name || session.user?.email?.split('@')[0]}
											</span>
											<span className="text-xs text-gray-500 leading-tight">
												View Profile
											</span>
										</div>
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



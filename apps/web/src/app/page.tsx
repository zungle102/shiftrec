import Link from 'next/link'

export default function Home() {
	return (
		<>
			{/* Hero Section */}
			<section className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 py-24 md:py-32 px-4">
				<div className="max-w-4xl mx-auto text-center">
					<h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight tracking-tight">
						Grow your business and deliver better shift management.
					</h1>
					<p className="text-lg md:text-xl text-blue-100 mb-12 max-w-2xl mx-auto leading-relaxed">
						ShiftRec is an easy to use platform that cuts paperwork and boosts efficiency, giving managers more time for what matters. Delivering seamless shift scheduling, while growing your business.
					</p>
					<div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
						<Link
							href="/signup"
							className="px-8 py-4 text-base font-semibold text-white bg-orange-500 hover:bg-orange-600 transition-colors duration-200 rounded-lg shadow-lg"
						>
							Try for Free
						</Link>
						<Link
							href="/signin"
							className="px-8 py-4 text-base font-semibold text-blue-600 bg-white hover:bg-blue-50 transition-colors duration-200 rounded-lg shadow-lg border-2 border-white"
						>
							Sign In
						</Link>
					</div>
					<p className="text-sm text-blue-100 mt-8 font-medium">
						Join 3,000+ businesses that use ShiftRec
					</p>
				</div>
			</section>

			{/* Stats Section */}
			<section className="bg-white py-16 md:py-20 px-4 border-b-4 border-blue-100">
				<div className="max-w-6xl mx-auto">
					<div className="grid grid-cols-2 md:grid-cols-4 gap-12 md:gap-16 text-center">
						<div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-300 rounded-xl p-6 hover:shadow-xl transition-all duration-200 hover:-translate-y-1">
							<div className="text-3xl md:text-4xl font-bold text-blue-600 mb-2">3,000+</div>
							<div className="text-sm text-blue-900 font-medium">Small, Medium & Enterprise Businesses</div>
						</div>
						<div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-300 rounded-xl p-6 hover:shadow-xl transition-all duration-200 hover:-translate-y-1">
							<div className="text-3xl md:text-4xl font-bold text-green-600 mb-2">50,000+</div>
							<div className="text-sm text-green-900 font-medium">Employees Managing Shifts</div>
						</div>
						<div className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-300 rounded-xl p-6 hover:shadow-xl transition-all duration-200 hover:-translate-y-1">
							<div className="text-3xl md:text-4xl font-bold text-purple-600 mb-2">500,000+</div>
							<div className="text-sm text-purple-900 font-medium">Shifts Scheduled Monthly</div>
						</div>
						<div className="bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-300 rounded-xl p-6 hover:shadow-xl transition-all duration-200 hover:-translate-y-1">
							<div className="text-3xl md:text-4xl font-bold text-orange-600 mb-2">&lt; 1 Min</div>
							<div className="text-sm text-orange-900 font-medium">Average Support Response Time</div>
						</div>
					</div>
				</div>
			</section>

			{/* Features Section */}
			<section className="bg-gradient-to-b from-blue-50 to-indigo-50 py-20 md:py-28 px-4">
				<div className="max-w-6xl mx-auto">
					<div className="text-center mb-16 md:mb-20">
						<h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Features</h2>
						<p className="text-base md:text-lg text-slate-700 font-medium">Everything you need to manage shifts effectively</p>
					</div>

					<div className="grid md:grid-cols-3 gap-8 md:gap-12">
						{/* Feature 1 */}
						<div className="bg-white border-2 border-blue-200 rounded-xl p-8 shadow-lg transition-all duration-200 hover:shadow-2xl hover:border-blue-400 hover:-translate-y-1">
							<div className="w-14 h-14 mb-6 flex items-center justify-center bg-blue-500 rounded-xl shadow-md">
								<svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
								</svg>
							</div>
							<h3 className="text-xl font-bold text-slate-900 mb-3">Smart Scheduling</h3>
							<p className="text-sm text-slate-700 leading-relaxed font-medium">
								Create and manage employee schedules with ease. Automatically assign shifts based on availability and skills.
							</p>
						</div>

						{/* Feature 2 */}
						<div className="bg-white border-2 border-green-200 rounded-xl p-8 shadow-lg transition-all duration-200 hover:shadow-2xl hover:border-green-400 hover:-translate-y-1">
							<div className="w-14 h-14 mb-6 flex items-center justify-center bg-green-500 rounded-xl shadow-md">
								<svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
								</svg>
							</div>
							<h3 className="text-xl font-bold text-slate-900 mb-3">Time Tracking</h3>
							<p className="text-sm text-slate-700 leading-relaxed font-medium">
								Accurate time tracking with clock in/out functionality. Real-time attendance monitoring and automated reporting.
							</p>
						</div>

						{/* Feature 3 */}
						<div className="bg-white border-2 border-purple-200 rounded-xl p-8 shadow-lg transition-all duration-200 hover:shadow-2xl hover:border-purple-400 hover:-translate-y-1">
							<div className="w-14 h-14 mb-6 flex items-center justify-center bg-purple-500 rounded-xl shadow-md">
								<svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
								</svg>
							</div>
							<h3 className="text-xl font-bold text-slate-900 mb-3">Team Management</h3>
							<p className="text-sm text-slate-700 leading-relaxed font-medium">
								Organize your workforce efficiently. Manage employee profiles, roles, and permissions in one place.
							</p>
						</div>

						{/* Feature 4 */}
						<div className="bg-white border-2 border-orange-200 rounded-xl p-8 shadow-lg transition-all duration-200 hover:shadow-2xl hover:border-orange-400 hover:-translate-y-1">
							<div className="w-14 h-14 mb-6 flex items-center justify-center bg-orange-500 rounded-xl shadow-md">
								<svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
								</svg>
							</div>
							<h3 className="text-xl font-bold text-slate-900 mb-3">Analytics & Reports</h3>
							<p className="text-sm text-slate-700 leading-relaxed font-medium">
								Get insights into your workforce with detailed analytics. Track attendance, overtime, and scheduling efficiency.
							</p>
						</div>

						{/* Feature 5 */}
						<div className="bg-white border-2 border-pink-200 rounded-xl p-8 shadow-lg transition-all duration-200 hover:shadow-2xl hover:border-pink-400 hover:-translate-y-1">
							<div className="w-14 h-14 mb-6 flex items-center justify-center bg-pink-500 rounded-xl shadow-md">
								<svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
								</svg>
							</div>
							<h3 className="text-xl font-bold text-slate-900 mb-3">Mobile App</h3>
							<p className="text-sm text-slate-700 leading-relaxed font-medium">
								Manage shifts on the go. Employees can view schedules, request time off, and clock in/out from their mobile devices.
							</p>
						</div>

						{/* Feature 6 */}
						<div className="bg-white border-2 border-indigo-200 rounded-xl p-8 shadow-lg transition-all duration-200 hover:shadow-2xl hover:border-indigo-400 hover:-translate-y-1">
							<div className="w-14 h-14 mb-6 flex items-center justify-center bg-indigo-500 rounded-xl shadow-md">
								<svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
								</svg>
							</div>
							<h3 className="text-xl font-bold text-slate-900 mb-3">Compliance & Security</h3>
							<p className="text-sm text-slate-700 leading-relaxed font-medium">
								Stay compliant with labor laws and regulations. Secure data storage with enterprise-grade security.
							</p>
						</div>
					</div>
				</div>
			</section>

			{/* Our Customers Section */}
			<section className="bg-white py-16 md:py-20 px-4 border-b-4 border-green-100">
				<div className="max-w-6xl mx-auto">
					<div className="text-center mb-12 md:mb-16">
						<h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Trusted by Leading Businesses</h2>
						<p className="text-base md:text-lg text-slate-700 font-medium">Join thousands of companies that trust ShiftRec for their shift management</p>
					</div>
					<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 md:gap-12 items-center justify-items-center mb-16">
						<div className="flex items-center justify-center h-16 w-full">
							<div className="text-slate-600 font-medium text-sm">Retail</div>
						</div>
						<div className="flex items-center justify-center h-16 w-full">
							<div className="text-slate-600 font-medium text-sm">Healthcare</div>
						</div>
						<div className="flex items-center justify-center h-16 w-full">
							<div className="text-slate-600 font-medium text-sm">Hospitality</div>
						</div>
						<div className="flex items-center justify-center h-16 w-full">
							<div className="text-slate-600 font-medium text-sm">Manufacturing</div>
						</div>
						<div className="flex items-center justify-center h-16 w-full">
							<div className="text-slate-600 font-medium text-sm">Education</div>
						</div>
						<div className="flex items-center justify-center h-16 w-full">
							<div className="text-slate-600 font-medium text-sm">Logistics</div>
						</div>
					</div>
					<div className="text-center">
						<div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
							<div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-300 rounded-xl p-4 shadow-lg">
								<div className="text-2xl md:text-3xl font-bold text-blue-600 mb-2">3,000+</div>
								<div className="text-xs text-blue-900 font-medium">Active Customers</div>
							</div>
							<div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-300 rounded-xl p-4 shadow-lg">
								<div className="text-2xl md:text-3xl font-bold text-green-600 mb-2">50,000+</div>
								<div className="text-xs text-green-900 font-medium">Employees Managed</div>
							</div>
							<div className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-300 rounded-xl p-4 shadow-lg">
								<div className="text-2xl md:text-3xl font-bold text-purple-600 mb-2">500K+</div>
								<div className="text-xs text-purple-900 font-medium">Shifts Monthly</div>
							</div>
							<div className="bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-300 rounded-xl p-4 shadow-lg">
								<div className="text-2xl md:text-3xl font-bold text-orange-600 mb-2">98%</div>
								<div className="text-xs text-orange-900 font-medium">Customer Satisfaction</div>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Testimonials Section */}
			<section className="bg-gradient-to-b from-purple-50 to-pink-50 py-20 md:py-28 px-4">
				<div className="max-w-6xl mx-auto">
					<div className="text-center mb-16 md:mb-20">
						<h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">What Our Customers Say</h2>
					</div>

					<div className="grid md:grid-cols-3 gap-8 md:gap-12">
						<div className="bg-white border-2 border-blue-200 rounded-xl p-8 shadow-lg">
							<p className="text-sm text-slate-700 mb-6 leading-relaxed font-medium">
								"ShiftRec has completely transformed how we manage our shifts. What used to take hours now takes minutes. Highly recommend!"
							</p>
							<div className="font-bold text-slate-900 text-sm">Sarah Johnson</div>
							<div className="text-xs text-slate-600 mt-1 font-medium">Operations Manager</div>
						</div>

						<div className="bg-white border-2 border-green-200 rounded-xl p-8 shadow-lg">
							<p className="text-sm text-slate-700 mb-6 leading-relaxed font-medium">
								"The mobile app is fantastic! Our team loves being able to check their schedules and swap shifts right from their phones."
							</p>
							<div className="font-bold text-slate-900 text-sm">Michael Chen</div>
							<div className="text-xs text-slate-600 mt-1 font-medium">HR Director</div>
						</div>

						<div className="bg-white border-2 border-purple-200 rounded-xl p-8 shadow-lg">
							<p className="text-sm text-slate-700 mb-6 leading-relaxed font-medium">
								"Saving so much time on scheduling has given us the opportunity to focus on growing our business. Game changer!"
							</p>
							<div className="font-bold text-slate-900 text-sm">Emily Rodriguez</div>
							<div className="text-xs text-slate-600 mt-1 font-medium">Small Business Owner</div>
						</div>
					</div>
				</div>
			</section>

			{/* CTA Section */}
			<section className="bg-gradient-to-br from-orange-500 via-pink-500 to-red-500 py-20 md:py-28 px-4">
				<div className="max-w-3xl mx-auto text-center">
					<h2 className="text-3xl md:text-4xl font-bold text-white mb-4 drop-shadow-lg">Ready to get started?</h2>
					<p className="text-base md:text-lg text-orange-50 mb-10 font-semibold">
						Start your free trial today. No credit card required.
					</p>
					<Link
						href="/signup"
						className="inline-block px-8 py-4 text-base font-bold text-orange-600 bg-white hover:bg-orange-50 transition-colors duration-200 rounded-lg shadow-2xl border-4 border-white"
					>
						Try for Free
					</Link>
				</div>
			</section>
		</>
	)
}

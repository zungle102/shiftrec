import Link from 'next/link'

export default function Home() {
	return (
		<>
			{/* Hero Section */}
			<section className="bg-gradient-to-b from-blue-50 to-white py-20 px-4">
				<div className="max-w-6xl mx-auto text-center">
					<h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
						Grow your business and deliver better shift management.
					</h1>
					<p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
						ShiftRec is an easy to use platform that cuts paperwork and boosts efficiency, giving managers more time for what matters. Delivering seamless shift scheduling, while growing your business.
					</p>
					<div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
						<Link
							href="/signup"
							className="rounded-lg bg-blue-600 px-8 py-4 text-white font-semibold hover:bg-blue-700 transition-colors text-lg"
						>
							Try for Free
						</Link>
						<Link
							href="/signin"
							className="rounded-lg border-2 border-gray-300 px-8 py-4 text-gray-700 font-semibold hover:bg-gray-50 transition-colors text-lg"
						>
							Sign In
						</Link>
					</div>
					<p className="text-sm text-gray-500 mt-4">
						Join 3,000+ businesses that use ShiftRec
					</p>
				</div>
			</section>

			{/* Stats Section */}
			<section className="bg-white py-16 px-4 border-b">
				<div className="max-w-6xl mx-auto">
					<div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
						<div>
							<div className="text-4xl font-bold text-blue-600 mb-2">3,000+</div>
							<div className="text-gray-600">Small, Medium & Enterprise Businesses</div>
						</div>
						<div>
							<div className="text-4xl font-bold text-blue-600 mb-2">50,000+</div>
							<div className="text-gray-600">Employees Managing Shifts</div>
						</div>
						<div>
							<div className="text-4xl font-bold text-blue-600 mb-2">500,000+</div>
							<div className="text-gray-600">Shifts Scheduled Monthly</div>
						</div>
						<div>
							<div className="text-4xl font-bold text-blue-600 mb-2">&lt; 1 Min</div>
							<div className="text-gray-600">Average Support Response Time</div>
						</div>
					</div>
				</div>
			</section>

			{/* Features Section */}
			<section className="bg-gray-50 py-20 px-4">
				<div className="max-w-6xl mx-auto">
					<div className="text-center mb-16">
						<h2 className="text-4xl font-bold text-gray-900 mb-4">Powerful Features</h2>
						<p className="text-xl text-gray-600">Everything you need to manage shifts effectively</p>
					</div>

					<div className="grid md:grid-cols-3 gap-8">
						{/* Feature 1 */}
						<div className="bg-white rounded-lg p-8 shadow-sm hover:shadow-md transition-shadow">
							<div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
								<svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
								</svg>
							</div>
							<h3 className="text-2xl font-semibold text-gray-900 mb-3">Smart Scheduling</h3>
							<p className="text-gray-600">
								Create and manage employee schedules with ease. Automatically assign shifts based on availability and skills.
							</p>
						</div>

						{/* Feature 2 */}
						<div className="bg-white rounded-lg p-8 shadow-sm hover:shadow-md transition-shadow">
							<div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
								<svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
								</svg>
							</div>
							<h3 className="text-2xl font-semibold text-gray-900 mb-3">Time Tracking</h3>
							<p className="text-gray-600">
								Accurate time tracking with clock in/out functionality. Real-time attendance monitoring and automated reporting.
							</p>
						</div>

						{/* Feature 3 */}
						<div className="bg-white rounded-lg p-8 shadow-sm hover:shadow-md transition-shadow">
							<div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
								<svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
								</svg>
							</div>
							<h3 className="text-2xl font-semibold text-gray-900 mb-3">Team Management</h3>
							<p className="text-gray-600">
								Organize your workforce efficiently. Manage employee profiles, roles, and permissions in one place.
							</p>
						</div>

						{/* Feature 4 */}
						<div className="bg-white rounded-lg p-8 shadow-sm hover:shadow-md transition-shadow">
							<div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
								<svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
								</svg>
							</div>
							<h3 className="text-2xl font-semibold text-gray-900 mb-3">Analytics & Reports</h3>
							<p className="text-gray-600">
								Get insights into your workforce with detailed analytics. Track attendance, overtime, and scheduling efficiency.
							</p>
						</div>

						{/* Feature 5 */}
						<div className="bg-white rounded-lg p-8 shadow-sm hover:shadow-md transition-shadow">
							<div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
								<svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
								</svg>
							</div>
							<h3 className="text-2xl font-semibold text-gray-900 mb-3">Mobile App</h3>
							<p className="text-gray-600">
								Manage shifts on the go. Employees can view schedules, request time off, and clock in/out from their mobile devices.
							</p>
						</div>

						{/* Feature 6 */}
						<div className="bg-white rounded-lg p-8 shadow-sm hover:shadow-md transition-shadow">
							<div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
								<svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
								</svg>
							</div>
							<h3 className="text-2xl font-semibold text-gray-900 mb-3">Compliance & Security</h3>
							<p className="text-gray-600">
								Stay compliant with labor laws and regulations. Secure data storage with enterprise-grade security.
							</p>
						</div>
					</div>
				</div>
			</section>

			{/* Testimonials Section */}
			<section className="bg-white py-20 px-4">
				<div className="max-w-6xl mx-auto">
					<div className="text-center mb-16">
						<h2 className="text-4xl font-bold text-gray-900 mb-4">What Our Customers Say</h2>
					</div>

					<div className="grid md:grid-cols-3 gap-8">
						<div className="bg-gray-50 rounded-lg p-6">
							<div className="flex items-center mb-4">
								<div className="flex text-yellow-400">
									{Array.from({ length: 5 }).map((_, i) => (
										<svg key={i} className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
											<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
										</svg>
									))}
								</div>
							</div>
							<p className="text-gray-700 mb-4 italic">
								"ShiftRec has completely transformed how we manage our shifts. What used to take hours now takes minutes. Highly recommend!"
							</p>
							<div className="font-semibold text-gray-900">Sarah Johnson</div>
							<div className="text-sm text-gray-600">Operations Manager</div>
						</div>

						<div className="bg-gray-50 rounded-lg p-6">
							<div className="flex items-center mb-4">
								<div className="flex text-yellow-400">
									{Array.from({ length: 5 }).map((_, i) => (
										<svg key={i} className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
											<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
										</svg>
									))}
								</div>
							</div>
							<p className="text-gray-700 mb-4 italic">
								"The mobile app is fantastic! Our team loves being able to check their schedules and swap shifts right from their phones."
							</p>
							<div className="font-semibold text-gray-900">Michael Chen</div>
							<div className="text-sm text-gray-600">HR Director</div>
						</div>

						<div className="bg-gray-50 rounded-lg p-6">
							<div className="flex items-center mb-4">
								<div className="flex text-yellow-400">
									{Array.from({ length: 5 }).map((_, i) => (
										<svg key={i} className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
											<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
										</svg>
									))}
								</div>
							</div>
							<p className="text-gray-700 mb-4 italic">
								"Saving so much time on scheduling has given us the opportunity to focus on growing our business. Game changer!"
							</p>
							<div className="font-semibold text-gray-900">Emily Rodriguez</div>
							<div className="text-sm text-gray-600">Small Business Owner</div>
						</div>
					</div>
				</div>
			</section>

			{/* CTA Section */}
			<section className="bg-blue-600 py-16 px-4">
				<div className="max-w-4xl mx-auto text-center">
					<h2 className="text-4xl font-bold text-white mb-4">Ready to get started?</h2>
					<p className="text-xl text-blue-100 mb-8">
						Start your free trial today. No credit card required.
					</p>
					<Link
						href="/signup"
						className="inline-block rounded-lg bg-white px-8 py-4 text-blue-600 font-semibold hover:bg-gray-100 transition-colors text-lg"
					>
						Try for Free
					</Link>
				</div>
			</section>
		</>
	)
}



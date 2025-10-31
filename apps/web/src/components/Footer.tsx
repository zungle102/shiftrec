import Link from 'next/link'

export function Footer() {
	return (
		<footer className="bg-gray-900 text-gray-300">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
				<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
					{/* Company Info */}
					<div>
						<h3 className="text-white text-lg font-semibold mb-4">ShiftRec</h3>
						<p className="text-sm mb-4">
							Recording and Managing Workshifts Smoothly
						</p>
						<div className="space-y-2 text-sm">
							<p>46 Hanson Road</p>
							<p>Woodville Gardens, SA 5012</p>
							<p>Australia</p>
						</div>
					</div>

					{/* Contact Info */}
					<div>
						<h3 className="text-white text-lg font-semibold mb-4">Contact</h3>
						<div className="space-y-3 text-sm">
							<div className="flex items-center space-x-3">
								<svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
								</svg>
								<a href="tel:+61451248244" className="hover:text-white transition-colors">
									+61 451248244
								</a>
							</div>
							<div className="flex items-center space-x-3">
								<svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
								</svg>
								<a href="mailto:contact@shiftrec.com" className="hover:text-white transition-colors">
									contact@shiftrec.com
								</a>
							</div>
						</div>
					</div>

					{/* Quick Links */}
					<div>
						<h3 className="text-white text-lg font-semibold mb-4">Quick Links</h3>
						<ul className="space-y-2 text-sm">
							<li>
								<Link href="/" className="hover:text-white transition-colors">
									Home
								</Link>
							</li>
							<li>
								<Link href="/signin" className="hover:text-white transition-colors">
									Sign In
								</Link>
							</li>
							<li>
								<Link href="/signup" className="hover:text-white transition-colors">
									Sign Up
								</Link>
							</li>
						</ul>
					</div>
				</div>

				{/* Bottom Bar */}
				<div className="mt-8 pt-8 border-t border-gray-800">
					<div className="text-center text-sm">
						<p>
							&copy; {new Date().getFullYear()} ShiftRec. All rights reserved.
						</p>
					</div>
				</div>
			</div>
		</footer>
	)
}


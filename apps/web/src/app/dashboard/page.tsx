import { auth } from '../../lib/auth'
import { DashboardSidebar } from '../../components/DashboardSidebar'
import { redirect } from 'next/navigation'
import { api } from '../../lib/api'

export default async function DashboardPage() {
	const session = await auth()
	if (!session) {
		redirect('/signin')
	}

	// Fetch team members count
	let teamMemberCount = 0
	try {
		if (session.user?.email) {
			const members = await api.getTeamMembers(session.user.email)
			teamMemberCount = members.length
		}
	} catch (error) {
		console.error('Failed to fetch team members:', error)
		// Continue with count of 0 if fetch fails
	}

	// Fetch clients count
	let clientCount = 0
	try {
		if (session.user?.email) {
			const clients = await api.getClients(session.user.email)
			clientCount = clients.length
		}
	} catch (error) {
		console.error('Failed to fetch clients:', error)
		// Continue with count of 0 if fetch fails
	}

	// Fetch shifts and calculate stats
	let shiftsThisWeek = 0
	let hoursThisWeek = 0
	let averageShiftsPerWeek = 0
	let averageHoursPerWeek = 0
	let activeClientCount = 0
	let activeTeamMemberCount = 0
	try {
		if (session.user?.email) {
			const shifts = await api.getShifts(session.user.email)
			const totalShifts = shifts.length

			// Calculate shifts this week (Monday to Sunday)
			const now = new Date()
			const dayOfWeek = now.getDay()
			const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
			const startOfWeek = new Date(now)
			startOfWeek.setDate(now.getDate() - daysFromMonday)
			startOfWeek.setHours(0, 0, 0, 0)
			const endOfWeek = new Date(startOfWeek)
			endOfWeek.setDate(startOfWeek.getDate() + 6)
			endOfWeek.setHours(23, 59, 59, 999)

			const shiftsThisWeekList = shifts.filter(shift => {
				const shiftDate = new Date(shift.serviceDate)
				return shiftDate >= startOfWeek && shiftDate <= endOfWeek
			})
			shiftsThisWeek = shiftsThisWeekList.length

			// Calculate total hours this week
			let totalHoursThisWeek = 0
			shiftsThisWeekList.forEach(shift => {
				const start = new Date(`2000-01-01T${shift.startTime}`)
				const end = new Date(`2000-01-01T${shift.endTime}`)
				let diff = (end.getTime() - start.getTime()) / (1000 * 60 * 60) // hours
				if (diff < 0) diff += 24 // Handle overnight shifts
				const breakMins = parseFloat(shift.breakDuration || '0')
				const hours = diff - (breakMins / 60)
				totalHoursThisWeek += Math.max(0, hours)
			})
			hoursThisWeek = Math.round(totalHoursThisWeek * 10) / 10 // Round to 1 decimal

			// Calculate average shifts per week
			if (totalShifts > 0) {
				const shiftDates = shifts.map(s => new Date(s.serviceDate)).sort((a, b) => a.getTime() - b.getTime())
				const firstShiftDate = shiftDates[0]
				const lastShiftDate = shiftDates[shiftDates.length - 1]
				const daysDiff = Math.max(1, Math.ceil((lastShiftDate.getTime() - firstShiftDate.getTime()) / (1000 * 60 * 60 * 24)))
				const weeksDiff = Math.max(1, Math.ceil(daysDiff / 7))
				averageShiftsPerWeek = Math.round((totalShifts / weeksDiff) * 10) / 10 // Round to 1 decimal

				// Calculate average hours per week
				let totalHours = 0
				shifts.forEach(shift => {
					const start = new Date(`2000-01-01T${shift.startTime}`)
					const end = new Date(`2000-01-01T${shift.endTime}`)
					let diff = (end.getTime() - start.getTime()) / (1000 * 60 * 60) // hours
					if (diff < 0) diff += 24 // Handle overnight shifts
					const breakMins = parseFloat(shift.breakDuration || '0')
					const hours = diff - (breakMins / 60)
					totalHours += Math.max(0, hours)
				})
				averageHoursPerWeek = Math.round((totalHours / weeksDiff) * 10) / 10 // Round to 1 decimal

				// Calculate active clients (clients used in shifts)
				const activeClientNames = new Set(shifts.map(s => s.clientName))
				activeClientCount = activeClientNames.size

				// Calculate active team members (team members assigned to shifts)
				const activeTeamMemberIds = new Set(shifts.filter(s => s.teamMemberId).map(s => s.teamMemberId))
				activeTeamMemberCount = activeTeamMemberIds.size
			}
		}
	} catch (error) {
		console.error('Failed to fetch shifts:', error)
		// Continue with counts of 0 if fetch fails
	}

	return (
		<div className="flex min-h-screen bg-gray-50">
			<DashboardSidebar />
			<main className="flex-1 p-6">
				<div className="mb-8">
					<h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
					<p className="text-gray-600">Welcome back, {session.user?.name || session.user?.email}!</p>
				</div>

				{/* Dashboard Stats */}
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
					<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm font-medium text-gray-600 mb-1">Total Clients</p>
								<p className="text-3xl font-bold text-gray-900">{clientCount}</p>
							</div>
							<div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
								<svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
								</svg>
							</div>
						</div>
					</div>

					<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm font-medium text-gray-600 mb-1">Active Clients</p>
								<p className="text-3xl font-bold text-gray-900">{activeClientCount}</p>
							</div>
							<div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center">
								<svg className="w-6 h-6 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
								</svg>
							</div>
						</div>
					</div>

					<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm font-medium text-gray-600 mb-1">Team Members</p>
								<p className="text-3xl font-bold text-gray-900">{teamMemberCount}</p>
							</div>
							<div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
								<svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
								</svg>
							</div>
						</div>
					</div>

					<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm font-medium text-gray-600 mb-1">Active Team Members</p>
								<p className="text-3xl font-bold text-gray-900">{activeTeamMemberCount}</p>
							</div>
							<div className="w-12 h-12 bg-cyan-100 rounded-lg flex items-center justify-center">
								<svg className="w-6 h-6 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
								</svg>
							</div>
						</div>
					</div>

					<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm font-medium text-gray-600 mb-1">Shifts This Week</p>
								<p className="text-3xl font-bold text-gray-900">{shiftsThisWeek}</p>
							</div>
							<div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
								<svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
								</svg>
							</div>
						</div>
					</div>

					<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm font-medium text-gray-600 mb-1">Avg Shifts/Week</p>
								<p className="text-3xl font-bold text-gray-900">{averageShiftsPerWeek}</p>
							</div>
							<div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
								<svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
								</svg>
							</div>
						</div>
					</div>

					<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm font-medium text-gray-600 mb-1">Hours This Week</p>
								<p className="text-3xl font-bold text-gray-900">{hoursThisWeek}</p>
							</div>
							<div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
								<svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
								</svg>
							</div>
						</div>
					</div>

					<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm font-medium text-gray-600 mb-1">Avg Hours/Week</p>
								<p className="text-3xl font-bold text-gray-900">{averageHoursPerWeek}</p>
							</div>
							<div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
								<svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
								</svg>
							</div>
						</div>
					</div>
				</div>

				{/* Recent Activity */}
				<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
					<h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
					<div className="text-center py-12">
						<svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
						</svg>
						<p className="text-gray-600 mb-2">No recent activity</p>
						<p className="text-sm text-gray-500">Get started by creating your first shift</p>
					</div>
				</div>
			</main>
		</div>
	)
}



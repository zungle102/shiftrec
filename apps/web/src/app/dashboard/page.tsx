import { auth } from '../../lib/auth'
import { DashboardSidebar } from '../../components/DashboardSidebar'
import { redirect } from 'next/navigation'
import { api } from '../../lib/api'

export default async function DashboardPage() {
	const session = await auth()
	if (!session) {
		redirect('/signin')
	}

	// Fetch staff members count and stats (excluding archived)
	let staffMemberCount = 0
	let activeStaffMemberCount = 0
	let inactiveStaffMemberCount = 0
	let archivedStaffMemberCount = 0
	let staffMembersWithShiftsThisWeek = 0
	try {
		if (session.user?.email) {
			console.log('[Dashboard] Fetching staff members for email:', session.user.email)
			// Get non-archived staff members (default behavior)
			const members = await api.getStaffMembers(session.user.email, false)
			console.log('[Dashboard] Non-archived staff members fetched:', members.length)
			// Get archived staff members separately for the archived count
			const archivedMembers = await api.getStaffMembers(session.user.email, true)
			archivedStaffMemberCount = archivedMembers.filter(member => member.archived === true).length
			console.log('[Dashboard] Archived staff members count:', archivedStaffMemberCount)
			
			// Count only non-archived staff members
			staffMemberCount = members.length
			// Count active staff members (not archived and active: true)
			activeStaffMemberCount = members.filter(member => member.active !== false).length
			// Count inactive staff members (not archived and active: false)
			inactiveStaffMemberCount = members.filter(member => member.active === false).length
			console.log('[Dashboard] Final counts - Total:', staffMemberCount, 'Active:', activeStaffMemberCount, 'Inactive:', inactiveStaffMemberCount)
			
			// Count staff members with shifts this week
			try {
				const shifts = await api.getShifts(session.user.email)
				const now = new Date()
				const dayOfWeek = now.getDay()
				const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
				const startOfWeek = new Date(now)
				startOfWeek.setDate(now.getDate() - daysFromMonday)
				startOfWeek.setHours(0, 0, 0, 0)
				const endOfWeek = new Date(startOfWeek)
				endOfWeek.setDate(startOfWeek.getDate() + 6)
				endOfWeek.setHours(23, 59, 59, 999)
				
				const shiftsThisWeek = shifts.filter(shift => {
					const shiftDate = new Date(shift.serviceDate)
					return shiftDate >= startOfWeek && shiftDate <= endOfWeek && !shift.archived
				})
				
				const staffMemberIdsWithShifts = new Set<string>()
				shiftsThisWeek.forEach(shift => {
					if (shift.staffMemberId) {
						staffMemberIdsWithShifts.add(shift.staffMemberId)
					}
					if (shift.notifiedStaffMemberIds) {
						shift.notifiedStaffMemberIds.forEach(id => staffMemberIdsWithShifts.add(id))
					}
				})
				staffMembersWithShiftsThisWeek = staffMemberIdsWithShifts.size
			} catch (error) {
				console.error('Failed to calculate staff members with shifts:', error)
			}
		}
	} catch (error) {
		console.error('Failed to fetch staff members:', error)
		// Continue with count of 0 if fetch fails
	}

	// Fetch clients count
	let clientCount = 0
	let activeClientCount = 0
	let inactiveClientCount = 0
	try {
		if (session.user?.email) {
			const clients = await api.getClients(session.user.email)
			clientCount = clients.length
			// Count active clients (not archived and active: true)
			activeClientCount = clients.filter(client => !client.archived && client.active !== false).length
			// Count inactive clients (not archived and active: false)
			inactiveClientCount = clients.filter(client => !client.archived && client.active === false).length
		}
	} catch (error) {
		console.error('Failed to fetch clients:', error)
		// Continue with count of 0 if fetch fails
	}

	// Fetch shifts and calculate stats (excluding archived)
	let totalNonArchivedShifts = 0
	let shiftsThisWeek = 0
	let hoursThisWeek = 0
	let averageShiftsPerWeek = 0
	let averageHoursPerWeek = 0
	try {
		if (session.user?.email) {
			// Get non-archived shifts (default behavior)
			const shifts = await api.getShifts(session.user.email, false)
			// All shifts returned are already non-archived, so length is correct
			totalNonArchivedShifts = shifts.length

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

			// Calculate average shifts per week (shifts are already non-archived from API)
			if (totalNonArchivedShifts > 0) {
				const shiftDates = shifts.map(s => new Date(s.serviceDate)).sort((a, b) => a.getTime() - b.getTime())
				const firstShiftDate = shiftDates[0]
				const lastShiftDate = shiftDates[shiftDates.length - 1]
				const daysDiff = Math.max(1, Math.ceil((lastShiftDate.getTime() - firstShiftDate.getTime()) / (1000 * 60 * 60 * 24)))
				const weeksDiff = Math.max(1, Math.ceil(daysDiff / 7))
				averageShiftsPerWeek = Math.round((totalNonArchivedShifts / weeksDiff) * 10) / 10 // Round to 1 decimal

				// Calculate average hours per week (shifts are already non-archived from API)
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
			}
		}
	} catch (error) {
		console.error('Failed to fetch shifts:', error)
		// Continue with counts of 0 if fetch fails
	}

	return (
		<div className="flex min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
			<DashboardSidebar />
			<main className="flex-1 p-6 md:p-8 lg:p-12">
				<div className="mb-12">
					<h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">Dashboard</h1>
					<p className="text-base text-slate-600 font-light">Welcome back, {session.user?.name || session.user?.email}!</p>
				</div>

				{/* Dashboard Stats */}
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 md:gap-12 mb-16">
					<div className="bg-white border-2 border-blue-200 rounded-xl shadow-lg pb-8 p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-200">
						<div className="flex items-center justify-between mb-6">
							<div>
								<p className="text-sm font-normal text-slate-500 mb-2">Clients</p>
								<p className="text-3xl md:text-4xl font-bold text-blue-600">{clientCount}</p>
							</div>
							<div className="w-12 h-12 flex items-center justify-center bg-blue-500 rounded-xl shadow-md">
								<svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
								</svg>
							</div>
						</div>
						<div className="space-y-3 pt-6 border-t border-slate-200">
							<div className="flex items-center justify-between">
								<span className="text-xs text-slate-500 font-light">Active</span>
								<span className="text-sm font-normal text-slate-900">{activeClientCount}</span>
							</div>
							<div className="flex items-center justify-between">
								<span className="text-xs text-slate-500 font-light">Inactive</span>
								<span className="text-sm font-normal text-slate-900">{inactiveClientCount}</span>
							</div>
						</div>
					</div>

					<div className="bg-white border-2 border-green-200 rounded-xl shadow-lg pb-8 p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-200">
						<div className="flex items-center justify-between mb-6">
							<div>
								<p className="text-sm font-normal text-slate-500 mb-2">Staff Members</p>
								<p className="text-3xl md:text-4xl font-bold text-green-600">{staffMemberCount}</p>
							</div>
							<div className="w-12 h-12 flex items-center justify-center bg-green-500 rounded-xl shadow-md">
								<svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
								</svg>
							</div>
						</div>
						<div className="space-y-3 pt-6 border-t border-slate-200">
							<div className="flex items-center justify-between">
								<span className="text-xs text-slate-500 font-light">Active</span>
								<span className="text-sm font-semibold text-green-600">{activeStaffMemberCount}</span>
							</div>
							<div className="flex items-center justify-between">
								<span className="text-xs text-slate-500 font-light">Inactive</span>
								<span className="text-sm font-normal text-slate-900">{inactiveStaffMemberCount}</span>
							</div>
							{archivedStaffMemberCount > 0 && (
								<div className="flex items-center justify-between">
									<span className="text-xs text-slate-500 font-light">Archived</span>
									<span className="text-sm font-normal text-slate-500">{archivedStaffMemberCount}</span>
								</div>
							)}
							{staffMembersWithShiftsThisWeek > 0 && (
								<div className="flex items-center justify-between pt-2 border-t border-slate-100">
									<span className="text-xs text-slate-500 font-light">With Shifts (This Week)</span>
									<span className="text-sm font-semibold text-green-700">{staffMembersWithShiftsThisWeek}</span>
								</div>
							)}
						</div>
					</div>

					<div className="bg-white border-2 border-purple-200 rounded-xl shadow-lg pb-8 p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-200">
						<div className="flex items-center justify-between mb-6">
							<div>
								<p className="text-sm font-normal text-slate-500 mb-2">Shifts</p>
								<p className="text-3xl md:text-4xl font-bold text-purple-600">{totalNonArchivedShifts}</p>
							</div>
							<div className="w-12 h-12 flex items-center justify-center bg-purple-500 rounded-xl shadow-md">
								<svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
								</svg>
							</div>
						</div>
						<div className="space-y-3 pt-6 border-t border-slate-200">
							<div className="flex items-center justify-between">
								<span className="text-xs text-slate-500 font-light">This Week</span>
								<span className="text-sm font-normal text-slate-900">{shiftsThisWeek}</span>
							</div>
							<div className="flex items-center justify-between">
								<span className="text-xs text-slate-500 font-light">Avg/Week</span>
								<span className="text-sm font-normal text-slate-900">{averageShiftsPerWeek}</span>
							</div>
						</div>
					</div>

					<div className="bg-white border-2 border-orange-200 rounded-xl shadow-lg pb-8 p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-200">
						<div className="flex items-center justify-between mb-6">
							<div>
								<p className="text-sm font-normal text-slate-500 mb-2">Hours</p>
								<p className="text-3xl md:text-4xl font-bold text-orange-600">{hoursThisWeek}</p>
							</div>
							<div className="w-12 h-12 flex items-center justify-center bg-orange-500 rounded-xl shadow-md">
								<svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
								</svg>
							</div>
						</div>
						<div className="space-y-3 pt-6 border-t border-slate-200">
							<div className="flex items-center justify-between">
								<span className="text-xs text-slate-500 font-light">This Week</span>
								<span className="text-sm font-normal text-slate-900">{hoursThisWeek}</span>
							</div>
							<div className="flex items-center justify-between">
								<span className="text-xs text-slate-500 font-light">Avg/Week</span>
								<span className="text-sm font-normal text-slate-900">{averageHoursPerWeek}</span>
							</div>
						</div>
					</div>
				</div>

				{/* Recent Activity */}
				<div className="bg-white border-2 border-indigo-200 rounded-xl shadow-lg pb-12 p-8">
					<h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-8">Recent Activity</h2>
					<div className="text-center py-16">
						<svg className="w-12 h-12 text-slate-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
						</svg>
						<p className="text-sm text-slate-500 mb-1 font-light">No recent activity</p>
						<p className="text-xs text-slate-400 font-light">Get started by creating your first shift</p>
					</div>
				</div>
			</main>
		</div>
	)
}



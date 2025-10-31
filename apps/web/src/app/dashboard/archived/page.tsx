'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { DashboardSidebar } from '../../../components/DashboardSidebar'

interface Client {
	id: string
	name: string
	email?: string
	address?: string
	suburb?: string
	state?: string
	postcode?: string
	clientType?: string
	phoneNumber?: string
	contactPerson?: string
	contactPhone?: string
	active: boolean
	archived: boolean
}

interface TeamMember {
	id: string
	name: string
	email: string
	phone?: string
	idType?: string
	idNumber?: string
	active: boolean
	archived: boolean
}

interface Shift {
	id: string
	serviceDate: string
	startTime: string
	endTime: string
	clientName: string
	teamMemberName?: string
	status?: string
	archived?: boolean
}

export default function ArchivedDataPage() {
	const { data: session } = useSession()
	const router = useRouter()
	const [archivedClients, setArchivedClients] = useState<Client[]>([])
	const [archivedTeamMembers, setArchivedTeamMembers] = useState<TeamMember[]>([])
	const [archivedShifts, setArchivedShifts] = useState<Shift[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [restoringClientId, setRestoringClientId] = useState<string | null>(null)
	const [restoringMemberId, setRestoringMemberId] = useState<string | null>(null)
	const [restoringShiftId, setRestoringShiftId] = useState<string | null>(null)

	useEffect(() => {
		if (!session) {
			router.push('/signin')
			return
		}
		fetchArchivedData()
	}, [session, router])

	const fetchArchivedData = async () => {
		if (!session?.user?.email) return

		setLoading(true)
		setError(null)
		try {
			const { api } = await import('../../../lib/api')
			
			// Fetch archived clients
			const clients = await api.getClients(session.user.email, true)
			setArchivedClients(clients.filter(client => client.archived))

			// Fetch archived team members
			const members = await api.getTeamMembers(session.user.email, true)
			setArchivedTeamMembers(members.filter(member => member.archived))

			// Fetch archived shifts
			const shifts = await api.getShifts(session.user.email, true)
			setArchivedShifts(shifts.filter(shift => shift.archived === true))
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to load archived data')
		} finally {
			setLoading(false)
		}
	}

	const handleRestoreClient = async (clientId: string) => {
		if (!session?.user?.email) return

		setRestoringClientId(clientId)
		setError(null)
		try {
			const { api } = await import('../../../lib/api')
			await api.restoreClient(session.user.email, clientId)
			fetchArchivedData()
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to restore client')
		} finally {
			setRestoringClientId(null)
		}
	}

	const handleRestoreTeamMember = async (memberId: string) => {
		if (!session?.user?.email) return

		setRestoringMemberId(memberId)
		setError(null)
		try {
			const { api } = await import('../../../lib/api')
			await api.restoreTeamMember(session.user.email, memberId)
			fetchArchivedData()
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to restore team member')
		} finally {
			setRestoringMemberId(null)
		}
	}

	const handleRestoreShift = async (shiftId: string) => {
		if (!session?.user?.email) return

		setRestoringShiftId(shiftId)
		setError(null)
		try {
			const { api } = await import('../../../lib/api')
			await api.restoreShift(session.user.email, shiftId)
			fetchArchivedData()
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to restore shift')
		} finally {
			setRestoringShiftId(null)
		}
	}

	const formatDate = (dateString: string) => {
		try {
			const date = new Date(dateString)
			return date.toLocaleDateString('en-AU', { day: '2-digit', month: '2-digit', year: 'numeric' })
		} catch {
			return dateString
		}
	}

	if (!session) {
		return null
	}

	return (
		<div className="flex min-h-screen bg-gray-50">
			<DashboardSidebar />
			<main className="flex-1 p-6">
				<div className="mb-8">
					<h1 className="text-3xl font-bold text-gray-900 mb-2">Archived Data</h1>
					<p className="text-gray-600">View and manage archived clients, team members, and shifts</p>
				</div>

				{error && (
					<div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4">
						<p className="text-sm text-red-600">{error}</p>
					</div>
				)}

				{loading ? (
					<div className="flex items-center justify-center h-64">
						<div className="w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
					</div>
				) : (
					<div className="space-y-8">
						{/* Archived Clients Section */}
						<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
							<h2 className="text-xl font-semibold text-gray-900 mb-4">Archived Clients ({archivedClients.length})</h2>
							{archivedClients.length === 0 ? (
								<div className="text-center py-8">
									<p className="text-gray-500">No archived clients</p>
								</div>
							) : (
								<div className="overflow-x-auto">
									<table className="w-full">
										<thead className="bg-gray-50 border-b border-gray-200">
											<tr>
												<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
												<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
												<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
												<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
												<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
											</tr>
										</thead>
										<tbody className="bg-white divide-y divide-gray-200">
											{archivedClients.map((client) => (
												<tr key={client.id} className="hover:bg-gray-50">
													<td className="px-6 py-4 whitespace-nowrap">
														<div className="text-sm font-medium text-gray-900">{client.name}</div>
														{client.email && (
															<div className="text-xs text-gray-500">{client.email}</div>
														)}
													</td>
													<td className="px-6 py-4 whitespace-nowrap">
														<div className="text-sm text-gray-600">{client.clientType || '-'}</div>
													</td>
													<td className="px-6 py-4 whitespace-nowrap">
														<div className="text-sm text-gray-600">{client.phoneNumber || '-'}</div>
													</td>
													<td className="px-6 py-4 whitespace-nowrap">
														<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
															Archived
														</span>
													</td>
													<td className="px-6 py-4 whitespace-nowrap text-left text-sm font-medium">
														<button
															onClick={() => handleRestoreClient(client.id)}
															disabled={restoringClientId === client.id}
															className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-green-600 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
														>
															<svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
															</svg>
															{restoringClientId === client.id ? 'Restoring...' : 'Restore'}
														</button>
													</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							)}
						</div>

						{/* Archived Team Members Section */}
						<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
							<h2 className="text-xl font-semibold text-gray-900 mb-4">Archived Team Members ({archivedTeamMembers.length})</h2>
							{archivedTeamMembers.length === 0 ? (
								<div className="text-center py-8">
									<p className="text-gray-500">No archived team members</p>
								</div>
							) : (
								<div className="overflow-x-auto">
									<table className="w-full">
										<thead className="bg-gray-50 border-b border-gray-200">
											<tr>
												<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
												<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
												<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
												<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
												<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
											</tr>
										</thead>
										<tbody className="bg-white divide-y divide-gray-200">
											{archivedTeamMembers.map((member) => (
												<tr key={member.id} className="hover:bg-gray-50">
													<td className="px-6 py-4 whitespace-nowrap">
														<div className="text-sm font-medium text-gray-900">{member.name}</div>
													</td>
													<td className="px-6 py-4 whitespace-nowrap">
														<div className="text-sm text-gray-600">{member.email}</div>
													</td>
													<td className="px-6 py-4 whitespace-nowrap">
														<div className="text-sm text-gray-600">{member.phone || '-'}</div>
													</td>
													<td className="px-6 py-4 whitespace-nowrap">
														<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
															Archived
														</span>
													</td>
													<td className="px-6 py-4 whitespace-nowrap text-left text-sm font-medium">
														<button
															onClick={() => handleRestoreTeamMember(member.id)}
															disabled={restoringMemberId === member.id}
															className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-green-600 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
														>
															<svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
															</svg>
															{restoringMemberId === member.id ? 'Restoring...' : 'Restore'}
														</button>
													</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							)}
						</div>

						{/* Archived Shifts Section */}
						<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
							<h2 className="text-xl font-semibold text-gray-900 mb-4">Archived Shifts ({archivedShifts.length})</h2>
							{archivedShifts.length === 0 ? (
								<div className="text-center py-8">
									<p className="text-gray-500">No archived shifts</p>
								</div>
							) : (
								<div className="overflow-x-auto">
									<table className="w-full">
										<thead className="bg-gray-50 border-b border-gray-200">
											<tr>
												<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service Date</th>
												<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
												<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
												<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team Member</th>
												<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
												<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
											</tr>
										</thead>
										<tbody className="bg-white divide-y divide-gray-200">
											{archivedShifts.map((shift) => (
												<tr key={shift.id} className="hover:bg-gray-50">
													<td className="px-6 py-4 whitespace-nowrap">
														<div className="text-sm font-medium text-gray-900">{formatDate(shift.serviceDate)}</div>
													</td>
													<td className="px-6 py-4 whitespace-nowrap">
														<div className="text-sm text-gray-900">{shift.startTime} - {shift.endTime}</div>
													</td>
													<td className="px-6 py-4">
														<div className="text-sm font-medium text-gray-900">{shift.clientName}</div>
													</td>
													<td className="px-6 py-4 whitespace-nowrap">
														<div className="text-sm text-gray-900">{shift.teamMemberName || '-'}</div>
													</td>
													<td className="px-6 py-4 whitespace-nowrap">
														<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
															Archived
														</span>
													</td>
													<td className="px-6 py-4 whitespace-nowrap text-left text-sm font-medium">
														<button
															onClick={() => handleRestoreShift(shift.id)}
															disabled={restoringShiftId === shift.id}
															className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-green-600 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
														>
															<svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
															</svg>
															{restoringShiftId === shift.id ? 'Restoring...' : 'Restore'}
														</button>
													</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							)}
						</div>
					</div>
				)}
			</main>
		</div>
	)
}


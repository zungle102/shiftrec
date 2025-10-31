'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { DashboardSidebar } from '../../../components/DashboardSidebar'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'

const shiftSchema = z.object({
	serviceDate: z.string().min(1, 'Service date is required'),
	startTime: z.string().min(1, 'Start time is required'),
	endTime: z.string().min(1, 'End time is required'),
	breakDuration: z.string().max(10, 'Break duration is too long').optional().or(z.literal('')),
	serviceType: z.string().max(100, 'Service type is too long').optional().or(z.literal('')),
	clientName: z.string().min(1, 'Client name is required').max(200, 'Client name is too long'),
	clientLocation: z.string().max(200, 'Client location is too long').optional().or(z.literal('')),
	clientType: z.string().max(50, 'Client type is too long').optional().or(z.literal('')),
	clientEmail: z.string().email('Invalid email address').max(200, 'Email is too long').optional().or(z.literal('')),
	clientPhoneNumber: z.string().max(20, 'Client phone number is too long').optional().or(z.literal('')),
	clientContactPerson: z.string().max(100, 'Client contact person is too long').optional().or(z.literal('')),
	clientContactPhone: z.string().max(20, 'Client contact phone is too long').optional().or(z.literal('')),
	teamMemberId: z.string().max(100, 'Team member ID is too long').optional().or(z.literal('')),
	status: z.enum(['Planned', 'Published', 'Assigned', 'Confirmed', 'Declined', 'In Progress', 'Completed', 'Missed', 'Canceled', 'Timesheet Submitted', 'Approved']).optional().default('Planned'),
	note: z.string().max(1000, 'Note is too long').optional().or(z.literal(''))
})

const clientSchema = z.object({
	name: z.string().min(1, 'Client name is required').max(200, 'Client name is too long'),
	address: z.string().max(200, 'Address is too long').optional().or(z.literal('')),
	suburb: z.string().max(100, 'Suburb is too long').optional().or(z.literal('')),
	state: z.string().max(50, 'State is too long').optional().or(z.literal('')),
	postcode: z.string().max(10, 'Postcode is too long').optional().or(z.literal('')),
	clientType: z.string().max(50, 'Client type is too long').optional().or(z.literal('')),
	phoneNumber: z.string().max(20, 'Phone number is too long').optional().or(z.literal('')),
	contactPerson: z.string().max(100, 'Contact person is too long').optional().or(z.literal('')),
	contactPhone: z.string().max(20, 'Contact phone is too long').optional().or(z.literal('')),
	email: z.string().email('Invalid email address').max(200, 'Email is too long').optional().or(z.literal('')),
	note: z.string().max(1000, 'Note is too long').optional().or(z.literal(''))
})

type ShiftFormValues = z.infer<typeof shiftSchema>

interface Shift {
	id: string
	serviceDate: string
	startTime: string
	endTime: string
	breakDuration: string
	serviceType: string
	clientName: string
	clientLocation: string
	clientType: string
	clientEmail: string
	clientPhoneNumber: string
	clientContactPerson: string
	clientContactPhone: string
	teamMemberId?: string
	teamMemberName?: string
	status?: string
	note: string
	archived?: boolean
	publishedAt?: string | null
	assignedAt?: string | null
	confirmedAt?: string | null
	declinedAt?: string | null
	inProgressAt?: string | null
	completedAt?: string | null
	missedAt?: string | null
	canceledAt?: string | null
	timesheetSubmittedAt?: string | null
	approvedAt?: string | null
	createdAt: string
	updatedAt: string
}

export default function ShiftsPage() {
	const { data: session } = useSession()
	const router = useRouter()
	const [shifts, setShifts] = useState<Shift[]>([])
	const [clients, setClients] = useState<Array<{ id: string; name: string; address: string; suburb: string; state: string; postcode: string; clientType: string; email: string; phoneNumber: string; contactPerson: string; contactPhone: string }>>([])
	const [teamMembers, setTeamMembers] = useState<Array<{ id: string; name: string; email: string }>>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [isModalOpen, setIsModalOpen] = useState(false)
	const [isAddClientModalOpen, setIsAddClientModalOpen] = useState(false)
	const [editingShift, setEditingShift] = useState<Shift | null>(null)
	const [deletingShiftId, setDeletingShiftId] = useState<string | null>(null)
	const [restoringShiftId, setRestoringShiftId] = useState<string | null>(null)
	const [publishingShiftId, setPublishingShiftId] = useState<string | null>(null)
	const [assigningShiftId, setAssigningShiftId] = useState<string | null>(null)
	const [selectedClientId, setSelectedClientId] = useState<string>('')
	const [openDropdownId, setOpenDropdownId] = useState<string | null>(null)

	const { register, handleSubmit, formState: { errors, isSubmitting }, reset, setValue } = useForm<ShiftFormValues>({
		resolver: zodResolver(shiftSchema),
		defaultValues: {
			serviceDate: '',
			startTime: '',
			endTime: '',
			breakDuration: '',
			serviceType: '',
			clientName: '',
			clientLocation: '',
			clientType: '',
			clientEmail: '',
			clientPhoneNumber: '',
			clientContactPerson: '',
			clientContactPhone: '',
			teamMemberId: '',
			status: 'Planned',
			note: ''
		}
	})

	const { register: registerClient, handleSubmit: handleSubmitClient, formState: { errors: clientErrors, isSubmitting: isSubmittingClient }, reset: resetClient } = useForm<z.infer<typeof clientSchema>>({
		resolver: zodResolver(clientSchema),
		defaultValues: {
			name: '',
			address: '',
			suburb: '',
			state: '',
			postcode: '',
			clientType: '',
			phoneNumber: '',
			contactPerson: '',
			contactPhone: '',
			email: '',
			note: ''
		}
	})

	useEffect(() => {
		if (!session) {
			router.push('/signin')
			return
		}
		fetchShifts()
		fetchClients()
		fetchTeamMembers()
	}, [session, router])

	// Close dropdown when clicking outside
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (openDropdownId && !(event.target as Element).closest('.action-dropdown')) {
				setOpenDropdownId(null)
			}
		}
		document.addEventListener('mousedown', handleClickOutside)
		return () => {
			document.removeEventListener('mousedown', handleClickOutside)
		}
	}, [openDropdownId])

	const fetchTeamMembers = async () => {
		if (!session?.user?.email) return

		try {
			const { api } = await import('../../../lib/api')
			const data = await api.getTeamMembers(session.user.email)
			// Filter to only active team members (not archived and active !== false)
			const activeMembers = data.filter(member => !member.archived && member.active !== false)
			setTeamMembers(activeMembers.map(member => ({ id: member.id, name: member.name, email: member.email })))
		} catch (err) {
			console.error('Failed to load team members:', err)
		}
	}

	const fetchClients = async (selectClientId?: string) => {
		if (!session?.user?.email) return

		try {
			const { api } = await import('../../../lib/api')
			const data = await api.getClients(session.user.email)
			// Filter to only active clients (not archived and active !== false)
			const activeClients = data.filter(client => !client.archived && client.active !== false)
			setClients(activeClients)
			// If a client ID is provided, select it after fetching
			if (selectClientId) {
				setSelectedClientId(selectClientId)
				const client = activeClients.find(c => c.id === selectClientId)
				if (client) {
					setValue('clientName', client.name)
					setValue('clientLocation', `${client.address ? client.address + ', ' : ''}${client.suburb ? client.suburb + ', ' : ''}${client.state || ''} ${client.postcode || ''}`.trim())
					setValue('clientType', client.clientType || '')
					setValue('clientEmail', client.email || '')
					setValue('clientPhoneNumber', client.phoneNumber || '')
					setValue('clientContactPerson', client.contactPerson || '')
					setValue('clientContactPhone', client.contactPhone || '')
				}
			}
		} catch (err) {
			console.error('Failed to load clients:', err)
		}
	}

	const onSubmitClient = async (values: z.infer<typeof clientSchema>) => {
		if (!session?.user?.email) return

		setError(null)
		try {
			const { api } = await import('../../../lib/api')
			const newClient = await api.createClient(session.user.email, values)
			setIsAddClientModalOpen(false)
			resetClient()
			// Refresh clients list and select the newly created client
			await fetchClients(newClient.id)
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to create client')
		}
	}

	const fetchShifts = async () => {
		if (!session?.user?.email) return

		setLoading(true)
		setError(null)
		try {
			const { api } = await import('../../../lib/api')
			const data = await api.getShifts(session.user.email)
			// Filter out archived shifts
			setShifts(data.filter(shift => shift.archived !== true))
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to load shifts')
		} finally {
			setLoading(false)
		}
	}

	const openAddModal = () => {
		setEditingShift(null)
		setSelectedClientId('')
		reset({
			serviceDate: '',
			startTime: '',
			endTime: '',
			breakDuration: '',
			serviceType: '',
			clientName: '',
			clientLocation: '',
			clientType: '',
			clientEmail: '',
			clientPhoneNumber: '',
			clientContactPerson: '',
			clientContactPhone: '',
			status: 'Planned',
			note: ''
		})
		setIsModalOpen(true)
	}

	const openEditModal = (shift: Shift) => {
		setEditingShift(shift)
		
		// Find the client that matches the shift's client name
		const matchingClient = clients.find(c => c.name === shift.clientName)
		const clientId = matchingClient ? matchingClient.id : ''
		setSelectedClientId(clientId)
		
		reset({
			serviceDate: shift.serviceDate,
			startTime: shift.startTime,
			status: shift.status || 'Planned',
			endTime: shift.endTime,
			breakDuration: shift.breakDuration || '',
			serviceType: shift.serviceType || '',
			clientName: shift.clientName,
			clientLocation: shift.clientLocation || '',
			clientType: shift.clientType || '',
			clientEmail: shift.clientEmail || '',
			clientPhoneNumber: shift.clientPhoneNumber || '',
			clientContactPerson: shift.clientContactPerson || '',
			clientContactPhone: shift.clientContactPhone || '',
			teamMemberId: shift.teamMemberId || '',
			note: shift.note || ''
		})
		
		// Ensure team member is set in the form
		if (shift.teamMemberId) {
			setValue('teamMemberId', shift.teamMemberId)
		}
		
		setIsModalOpen(true)
	}

	const closeModal = () => {
		setIsModalOpen(false)
		setEditingShift(null)
		setSelectedClientId('')
	}

	const handleClientChange = (clientId: string) => {
		if (clientId === 'new') {
			// Open Add Client modal when "New Client" is selected
			setIsAddClientModalOpen(true)
			// Reset the select to empty
			setSelectedClientId('')
		} else {
			setSelectedClientId(clientId)
			// Populate shift form fields with selected client data
			const client = clients.find(c => c.id === clientId)
			if (client) {
				setValue('clientName', client.name)
				setValue('clientLocation', `${client.address ? client.address + ', ' : ''}${client.suburb ? client.suburb + ', ' : ''}${client.state || ''} ${client.postcode || ''}`.trim())
				setValue('clientType', client.clientType || '')
				setValue('clientEmail', client.email || '')
				setValue('clientPhoneNumber', client.phoneNumber || '')
				setValue('clientContactPerson', client.contactPerson || '')
				setValue('clientContactPhone', client.contactPhone || '')
			} else {
				// Clear fields if no client selected
				setValue('clientName', '')
				setValue('clientLocation', '')
				setValue('clientType', '')
				setValue('clientEmail', '')
				setValue('clientPhoneNumber', '')
				setValue('clientContactPerson', '')
				setValue('clientContactPhone', '')
			}
		}
	}

	const onSubmit = async (values: ShiftFormValues) => {
		if (!session?.user?.email) return

		setError(null)
		try {
			const { api } = await import('../../../lib/api')
			
			if (editingShift) {
				await api.updateShift(session.user.email, editingShift.id, values)
			} else {
				await api.createShift(session.user.email, values)
			}

			closeModal()
			fetchShifts()
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to save shift')
		}
	}

	const handleDelete = async (shiftId: string) => {
		if (!session?.user?.email) return
		if (!confirm('Are you sure you want to archive this shift?')) return

		setDeletingShiftId(shiftId)
		try {
			const { api } = await import('../../../lib/api')
			await api.deleteShift(session.user.email, shiftId)
			fetchShifts()
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to archive shift')
		} finally {
			setDeletingShiftId(null)
		}
	}

	const handleRestore = async (shiftId: string) => {
		if (!session?.user?.email) return

		setRestoringShiftId(shiftId)
		setError(null)
		try {
			const { api } = await import('../../../lib/api')
			await api.restoreShift(session.user.email, shiftId)
			fetchShifts()
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to restore shift')
		} finally {
			setRestoringShiftId(null)
		}
	}

	const handlePublish = async (shiftId: string) => {
		if (!session?.user?.email) return

		setPublishingShiftId(shiftId)
		setError(null)
		try {
			const { api } = await import('../../../lib/api')
			await api.updateShift(session.user.email, shiftId, { status: 'Published' })
			fetchShifts()
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to publish shift')
		} finally {
			setPublishingShiftId(null)
		}
	}

	const handleAssign = async (shiftId: string) => {
		if (!session?.user?.email) return

		setAssigningShiftId(shiftId)
		setError(null)
		try {
			const { api } = await import('../../../lib/api')
			await api.updateShift(session.user.email, shiftId, { status: 'Assigned' })
			fetchShifts()
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to assign shift')
		} finally {
			setAssigningShiftId(null)
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

	const formatDateTime = (dateInput: string | Date | null | undefined) => {
		if (!dateInput) return null
		try {
			// Handle both string and Date object inputs
			const date = dateInput instanceof Date ? dateInput : new Date(dateInput)
			if (isNaN(date.getTime())) return null
			return date.toLocaleString('en-AU', { 
				day: '2-digit', 
				month: '2-digit', 
				year: 'numeric',
				hour: '2-digit',
				minute: '2-digit'
			})
		} catch {
			return null
		}
	}

	const getStatusDateTime = (shift: Shift) => {
		const status = shift.status || 'Planned'
		switch (status) {
			case 'Planned':
				return shift.createdAt || null
			case 'Published':
				return shift.publishedAt || null
			case 'Assigned':
				return shift.assignedAt || null
			case 'Confirmed':
				return shift.confirmedAt || null
			case 'Declined':
				return shift.declinedAt || null
			case 'In Progress':
				return shift.inProgressAt || null
			case 'Completed':
				return shift.completedAt || null
			case 'Missed':
				return shift.missedAt || null
			case 'Canceled':
				return shift.canceledAt || null
			case 'Timesheet Submitted':
				return shift.timesheetSubmittedAt || null
			case 'Approved':
				return shift.approvedAt || null
			default:
				return null
		}
	}

	if (!session) {
		return null
	}

	return (
		<div className="flex min-h-screen bg-gray-50">
			<DashboardSidebar />
			<main className="flex-1 p-6">
				<div className="mb-6 flex items-center justify-between">
					<div>
						<h1 className="text-3xl font-bold text-gray-900 mb-2">Manage Shifts</h1>
						<p className="text-gray-600">Add, edit and remove work shifts</p>
					</div>
					<div className="flex items-center space-x-4">
						<button
							onClick={openAddModal}
							className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
						>
							<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
							</svg>
							<span>New Shift</span>
						</button>
					</div>
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
				) : shifts.length === 0 ? (
					<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
						<svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
						</svg>
						<p className="text-gray-600 mb-2">No shifts yet</p>
						<p className="text-sm text-gray-500 mb-6">Get started by creating your first shift</p>
						<button
							onClick={openAddModal}
							className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 mx-auto"
						>
							<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
							</svg>
							<span>New Shift</span>
						</button>
					</div>
				) : (
					<div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-visible pb-20">
						<div className="overflow-x-auto overflow-y-visible min-h-[600px]">
							<table className="w-full">
								<thead className="bg-gray-50 border-b border-gray-200">
									<tr>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service Date</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team Member</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service Details</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Publish/Assign</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
									</tr>
								</thead>
								<tbody className="bg-white divide-y divide-gray-200">
									{shifts.map((shift) => (
										<tr key={shift.id} className="hover:bg-gray-50">
											<td className="px-6 py-4 whitespace-nowrap">
												<div className="text-sm font-medium text-gray-900">{formatDate(shift.serviceDate)}</div>
											</td>
											<td className="px-6 py-4 whitespace-nowrap">
												<div className="text-sm text-gray-900">{shift.startTime} - {shift.endTime}</div>
												{shift.breakDuration && shift.breakDuration !== '0' && (
													<div className="text-xs text-gray-500">Break: {shift.breakDuration} min</div>
												)}
											</td>
											<td className="px-6 py-4">
												<div className="text-sm font-medium text-gray-900">{shift.clientName}</div>
												{shift.clientContactPerson && (
													<div className="text-xs text-gray-500">Contact: {shift.clientContactPerson}</div>
												)}
											</td>
											<td className="px-6 py-4 whitespace-nowrap">
												<div className="text-sm text-gray-900">{shift.teamMemberName || '-'}</div>
											</td>
											<td className="px-6 py-4 whitespace-nowrap">
												<div className="text-sm text-gray-600">{shift.serviceType || '-'}</div>
											</td>
											<td className="px-6 py-4">
												<div className="text-sm text-gray-600">{shift.clientLocation || '-'}</div>
											</td>
											<td className="px-6 py-4 whitespace-nowrap">
												{shift.archived === true ? (
													<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
														Archived
													</span>
												) : (
													<div>
														<span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
															shift.status === 'Planned'
																? 'bg-gray-100 text-gray-800'
																: shift.status === 'Published'
																? 'bg-blue-100 text-blue-800'
																: shift.status === 'Assigned'
																? 'bg-purple-100 text-purple-800'
																: shift.status === 'Confirmed'
																? 'bg-teal-100 text-teal-800'
																: shift.status === 'Declined'
																? 'bg-red-100 text-red-800'
																: shift.status === 'In Progress'
																? 'bg-amber-100 text-amber-800'
																: shift.status === 'Completed'
																? 'bg-green-100 text-green-800'
																: shift.status === 'Missed'
																? 'bg-orange-100 text-orange-800'
																: shift.status === 'Canceled'
																? 'bg-red-100 text-red-800'
																: shift.status === 'Timesheet Submitted'
																? 'bg-indigo-100 text-indigo-800'
																: shift.status === 'Approved'
																? 'bg-emerald-100 text-emerald-800'
																: 'bg-gray-100 text-gray-800'
														}`}>
															{shift.status || 'Planned'}
														</span>
														{(() => {
															const statusDateTime = getStatusDateTime(shift)
															if (statusDateTime) {
																const formatted = formatDateTime(statusDateTime)
																if (formatted) {
																	return (
																		<div className="text-xs text-gray-500 mt-1">
																			Updated at: {formatted}
																		</div>
																	)
																}
															}
															return null
														})()}
													</div>
												)}
											</td>
											<td className="px-6 py-4 whitespace-nowrap">
												<div className="flex flex-col gap-2">
													{!shift.archived && shift.status === 'Planned' && !shift.teamMemberId && (
														<button
															onClick={() => handlePublish(shift.id)}
															disabled={publishingShiftId === shift.id}
															className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
														>
															<svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
															</svg>
															{publishingShiftId === shift.id ? 'Publishing...' : 'Publish'}
														</button>
													)}
													{!shift.archived && shift.status === 'Planned' && shift.teamMemberId && (
														<button
															onClick={() => handleAssign(shift.id)}
															disabled={assigningShiftId === shift.id}
															className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-purple-700 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
														>
															<svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
															</svg>
															{assigningShiftId === shift.id ? 'Assigning...' : 'Assign'}
														</button>
													)}
												</div>
											</td>
											<td className="px-6 py-4 whitespace-nowrap text-left text-sm font-medium relative">
												<div className="relative action-dropdown">
													<button
														type="button"
														onClick={() => setOpenDropdownId(openDropdownId === shift.id ? null : shift.id)}
														className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
													>
														<span>Actions</span>
														<svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
															<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
														</svg>
													</button>
													{openDropdownId === shift.id && (
														<div className="absolute left-0 top-full mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-50">
															<div className="py-1">
																<button
																	onClick={() => {
																		openEditModal(shift)
																		setOpenDropdownId(null)
																	}}
																	className="w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 flex items-center"
																>
																	<svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																		<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
																	</svg>
																	Edit
																</button>
																{!shift.archived && (
																	<button
																		onClick={() => {
																			setOpenDropdownId(null)
																			handleDelete(shift.id)
																		}}
																		disabled={deletingShiftId === shift.id}
																		className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
																	>
																		<svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																			<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
																		</svg>
																		{deletingShiftId === shift.id ? 'Archiving...' : 'Archive'}
																	</button>
																)}
																{shift.archived && (
																	<button
																		onClick={() => {
																			handleRestore(shift.id)
																			setOpenDropdownId(null)
																		}}
																		disabled={restoringShiftId === shift.id}
																		className="w-full text-left px-4 py-2 text-sm text-green-600 hover:bg-green-50 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
																	>
																		<svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																			<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
																		</svg>
																		{restoringShiftId === shift.id ? 'Restoring...' : 'Restore'}
																	</button>
																)}
															</div>
														</div>
													)}
												</div>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</div>
				)}

				{/* Add/Edit Modal */}
				{isModalOpen && (
					<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
						<div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
							<div className="p-6">
								<div className="mb-6">
									<h2 className="text-2xl font-bold text-gray-900">
										{editingShift ? 'Edit Shift' : 'Add Shift'}
									</h2>
								</div>

								<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
									<div>
										<div className="flex items-center justify-between mb-2">
											<label htmlFor="clientSelect" className="block text-sm font-medium text-gray-700">
												Select Client
											</label>
											<button
												type="button"
												onClick={() => {
													setIsAddClientModalOpen(true)
													setSelectedClientId('')
												}}
												className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center space-x-1"
												disabled={!!editingShift}
											>
												<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
												</svg>
												<span>New Client</span>
											</button>
										</div>
										<select
											id="clientSelect"
											className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors"
											value={selectedClientId}
											onChange={(e) => handleClientChange(e.target.value)}
											disabled={!!editingShift}
										>
											<option value="">Select a client</option>
											{clients.map((client) => (
												<option key={client.id} value={client.id}>
													{client.name}
												</option>
											))}
										</select>
									</div>

									<div className="grid grid-cols-2 gap-4">
										<div>
											<label htmlFor="serviceDate" className="block text-sm font-medium text-gray-700 mb-2">
												Service Date *
											</label>
											<input
												id="serviceDate"
												type="date"
												className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors"
												{...register('serviceDate')}
											/>
											{errors.serviceDate && (
												<p className="mt-1 text-sm text-red-600">{errors.serviceDate.message}</p>
											)}
										</div>
										<div>
											<label htmlFor="serviceType" className="block text-sm font-medium text-gray-700 mb-2">
												Service Details
											</label>
											<input
												id="serviceType"
												type="text"
												className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors"
												placeholder="e.g., Cleaning, Maintenance"
												{...register('serviceType')}
											/>
											{errors.serviceType && (
												<p className="mt-1 text-sm text-red-600">{errors.serviceType.message}</p>
											)}
										</div>
									</div>

									<div className="grid grid-cols-3 gap-4">
										<div>
											<label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-2">
												Start Time *
											</label>
											<input
												id="startTime"
												type="time"
												className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors"
												{...register('startTime')}
											/>
											{errors.startTime && (
												<p className="mt-1 text-sm text-red-600">{errors.startTime.message}</p>
											)}
										</div>
										<div>
											<label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-2">
												End Time *
											</label>
											<input
												id="endTime"
												type="time"
												className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors"
												{...register('endTime')}
											/>
											{errors.endTime && (
												<p className="mt-1 text-sm text-red-600">{errors.endTime.message}</p>
											)}
										</div>
										<div>
											<label htmlFor="breakDuration" className="block text-sm font-medium text-gray-700 mb-2">
												Break Duration (min)
											</label>
											<input
												id="breakDuration"
												type="number"
												min="0"
												className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors"
												placeholder="0"
												{...register('breakDuration')}
											/>
											{errors.breakDuration && (
												<p className="mt-1 text-sm text-red-600">{errors.breakDuration.message}</p>
											)}
										</div>
									</div>

									<div>
										<label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
											Status
										</label>
										<select
											id="status"
											className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors"
											{...register('status')}
										>
											<option value="Planned">Planned</option>
											<option value="Published">Published</option>
											<option value="Assigned">Assigned</option>
											<option value="Confirmed">Confirmed</option>
											<option value="Declined">Declined</option>
											<option value="In Progress">In Progress</option>
											<option value="Completed">Completed</option>
											<option value="Missed">Missed</option>
											<option value="Canceled">Canceled</option>
											<option value="Timesheet Submitted">Timesheet Submitted</option>
											<option value="Approved">Approved</option>
										</select>
										{errors.status && (
											<p className="mt-1 text-sm text-red-600">{errors.status.message}</p>
										)}
									</div>

									<div>
										<label htmlFor="note" className="block text-sm font-medium text-gray-700 mb-2">
											Note
										</label>
										<textarea
											id="note"
											rows={4}
											className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors"
											placeholder="Additional notes about this shift..."
											{...register('note')}
										/>
										{errors.note && (
											<p className="mt-1 text-sm text-red-600">{errors.note.message}</p>
										)}
									</div>

									<div className="flex items-center justify-between pt-4">
										<button
											type="button"
											onClick={closeModal}
											className="px-6 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
										>
											Cancel
										</button>
										<button
											type="submit"
											disabled={isSubmitting}
											className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
										>
											{isSubmitting ? 'Saving...' : editingShift ? 'Update' : 'Add Shift'}
										</button>
									</div>
								</form>
							</div>
						</div>
					</div>
				)}

				{/* Add Client Modal */}
				{isAddClientModalOpen && (
					<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
						<div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
							<div className="p-6">
								<div className="mb-6">
									<h2 className="text-2xl font-bold text-gray-900">Add Client</h2>
								</div>

								<form onSubmit={handleSubmitClient(onSubmitClient)} className="space-y-4">
									<div className="grid grid-cols-2 gap-4">
										<div>
											<label htmlFor="clientNameModal" className="block text-sm font-medium text-gray-700 mb-2">
												Client Name *
											</label>
											<input
												id="clientNameModal"
												type="text"
												className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors"
												placeholder="Client Name"
												{...registerClient('name')}
											/>
											{clientErrors.name && (
												<p className="mt-1 text-sm text-red-600">{clientErrors.name.message}</p>
											)}
										</div>
										<div>
											<label htmlFor="clientTypeModal" className="block text-sm font-medium text-gray-700 mb-2">
												Client Type
											</label>
											<select
												id="clientTypeModal"
												className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors"
												{...registerClient('clientType')}
											>
												<option value="">Select Client Type</option>
												<option value="Aged Care">Aged Care</option>
												<option value="NDIS">NDIS</option>
												<option value="Others">Others</option>
											</select>
											{clientErrors.clientType && (
												<p className="mt-1 text-sm text-red-600">{clientErrors.clientType.message}</p>
											)}
										</div>
									</div>

									<div className="grid grid-cols-2 gap-4">
										<div>
											<label htmlFor="clientEmailModal" className="block text-sm font-medium text-gray-700 mb-2">
												Email
											</label>
											<input
												id="clientEmailModal"
												type="email"
												className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors"
												placeholder="client@example.com"
												{...registerClient('email')}
											/>
											{clientErrors.email && (
												<p className="mt-1 text-sm text-red-600">{clientErrors.email.message}</p>
											)}
										</div>
										<div>
											<label htmlFor="clientPhoneModal" className="block text-sm font-medium text-gray-700 mb-2">
												Phone Number
											</label>
											<input
												id="clientPhoneModal"
												type="tel"
												className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors"
												placeholder="+61 451248244"
												{...registerClient('phoneNumber')}
											/>
											{clientErrors.phoneNumber && (
												<p className="mt-1 text-sm text-red-600">{clientErrors.phoneNumber.message}</p>
											)}
										</div>
									</div>

									<div>
										<label htmlFor="clientAddressModal" className="block text-sm font-medium text-gray-700 mb-2">
											Street Address
										</label>
										<input
											id="clientAddressModal"
											type="text"
											className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors"
											placeholder="123 Main Street"
											{...registerClient('address')}
										/>
										{clientErrors.address && (
											<p className="mt-1 text-sm text-red-600">{clientErrors.address.message}</p>
										)}
									</div>

									<div>
										<label htmlFor="clientSuburbModal" className="block text-sm font-medium text-gray-700 mb-2">
											Suburb
										</label>
										<input
											id="clientSuburbModal"
											type="text"
											className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors"
											placeholder="Woodville Gardens"
											{...registerClient('suburb')}
										/>
										{clientErrors.suburb && (
											<p className="mt-1 text-sm text-red-600">{clientErrors.suburb.message}</p>
										)}
									</div>

									<div className="grid grid-cols-2 gap-4">
										<div>
											<label htmlFor="clientStateModal" className="block text-sm font-medium text-gray-700 mb-2">
												State
											</label>
											<select
												id="clientStateModal"
												className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors"
												{...registerClient('state')}
											>
												<option value="">Select State</option>
												<option value="NSW">NSW</option>
												<option value="VIC">VIC</option>
												<option value="QLD">QLD</option>
												<option value="SA">SA</option>
												<option value="WA">WA</option>
												<option value="TAS">TAS</option>
												<option value="NT">NT</option>
												<option value="ACT">ACT</option>
											</select>
											{clientErrors.state && (
												<p className="mt-1 text-sm text-red-600">{clientErrors.state.message}</p>
											)}
										</div>
										<div>
											<label htmlFor="clientPostcodeModal" className="block text-sm font-medium text-gray-700 mb-2">
												Postcode
											</label>
											<input
												id="clientPostcodeModal"
												type="text"
												className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors"
												placeholder="5012"
												maxLength={10}
												{...registerClient('postcode')}
											/>
											{clientErrors.postcode && (
												<p className="mt-1 text-sm text-red-600">{clientErrors.postcode.message}</p>
											)}
										</div>
									</div>

									<div className="grid grid-cols-2 gap-4">
										<div>
											<label htmlFor="clientContactPersonModal" className="block text-sm font-medium text-gray-700 mb-2">
												Contact Person
											</label>
											<input
												id="clientContactPersonModal"
												type="text"
												className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors"
												placeholder="John Doe"
												{...registerClient('contactPerson')}
											/>
											{clientErrors.contactPerson && (
												<p className="mt-1 text-sm text-red-600">{clientErrors.contactPerson.message}</p>
											)}
										</div>
										<div>
											<label htmlFor="clientContactPhoneModal" className="block text-sm font-medium text-gray-700 mb-2">
												Contact Phone
											</label>
											<input
												id="clientContactPhoneModal"
												type="tel"
												className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors"
												placeholder="+61 451248244"
												{...registerClient('contactPhone')}
											/>
											{clientErrors.contactPhone && (
												<p className="mt-1 text-sm text-red-600">{clientErrors.contactPhone.message}</p>
											)}
										</div>
									</div>

									<div>
										<label htmlFor="clientNoteModal" className="block text-sm font-medium text-gray-700 mb-2">
											Note
										</label>
										<textarea
											id="clientNoteModal"
											rows={4}
											className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors"
											placeholder="Additional notes about this client..."
											{...registerClient('note')}
										/>
										{clientErrors.note && (
											<p className="mt-1 text-sm text-red-600">{clientErrors.note.message}</p>
										)}
									</div>

									<div className="flex items-center justify-between pt-4">
										<button
											type="button"
											onClick={() => {
												setIsAddClientModalOpen(false)
												resetClient()
											}}
											className="px-6 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
										>
											Cancel
										</button>
										<button
											type="submit"
											disabled={isSubmittingClient}
											className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
										>
											{isSubmittingClient ? 'Saving...' : 'Add Client'}
										</button>
									</div>
								</form>
							</div>
						</div>
					</div>
				)}
			</main>
		</div>
	)
}


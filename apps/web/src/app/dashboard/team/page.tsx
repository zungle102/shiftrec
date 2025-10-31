"use client"
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { DashboardSidebar } from '../../../components/DashboardSidebar'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'

const teamMemberSchema = z.object({
	name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
	email: z.string().email('Invalid email address').max(200),
	phone: z.string().max(20, 'Phone number is too long').optional().or(z.literal('')),
	idType: z.string().max(50, 'ID Type is too long').optional().or(z.literal('')),
	idNumber: z.string().max(100, 'ID Number is too long').optional().or(z.literal('')),
	address: z.string().max(200, 'Address is too long').optional().or(z.literal('')),
	suburb: z.string().max(100, 'Suburb is too long').optional().or(z.literal('')),
	state: z.string().max(50, 'State is too long').optional().or(z.literal('')),
	postcode: z.string().max(10, 'Postcode is too long').optional().or(z.literal(''))
})

type TeamMemberFormValues = z.infer<typeof teamMemberSchema>

interface TeamMember {
	id: string
	name: string
	email: string
	phone: string
	idType: string
	idNumber: string
	address: string
	suburb: string
	state: string
	postcode: string
	active: boolean
	archived: boolean
	createdAt: string
	updatedAt: string
}

export default function ManageTeamPage() {
	const { data: session } = useSession()
	const router = useRouter()
	const [members, setMembers] = useState<TeamMember[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [isModalOpen, setIsModalOpen] = useState(false)
	const [editingMember, setEditingMember] = useState<TeamMember | null>(null)
	const [deletingMemberId, setDeletingMemberId] = useState<string | null>(null)
	const [togglingMemberId, setTogglingMemberId] = useState<string | null>(null)
	const [restoringMemberId, setRestoringMemberId] = useState<string | null>(null)
	const [openDropdownId, setOpenDropdownId] = useState<string | null>(null)
	const [showInactive, setShowInactive] = useState(false)

	const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<TeamMemberFormValues>({
		resolver: zodResolver(teamMemberSchema),
		defaultValues: {
			name: '',
			email: '',
			phone: '',
			idType: '',
			idNumber: '',
			address: '',
			suburb: '',
			state: '',
			postcode: ''
		}
	})

	useEffect(() => {
		if (!session) {
			router.push('/signin')
			return
		}
		fetchTeamMembers()
	}, [session, router, showInactive])

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
		
		setLoading(true)
		setError(null)
		try {
			const { api } = await import('../../../lib/api')
			const data = await api.getTeamMembers(session.user.email)
			// Filter by inactive status if needed (exclude archived items)
			const filtered = showInactive 
				? data.filter(member => !member.archived) 
				: data.filter(member => !member.archived && member.active !== false)
			setMembers(filtered)
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to load team members')
		} finally {
			setLoading(false)
		}
	}

	const openAddModal = () => {
		setEditingMember(null)
		reset({
			name: '',
			email: '',
			phone: '',
			idType: '',
			idNumber: '',
			address: '',
			suburb: '',
			state: '',
			postcode: ''
		})
		setIsModalOpen(true)
	}

	const openEditModal = (member: TeamMember) => {
		setEditingMember(member)
		reset({
			name: member.name,
			email: member.email,
			phone: member.phone || '',
			idType: member.idType || '',
			idNumber: member.idNumber || '',
			address: member.address || '',
			suburb: member.suburb || '',
			state: member.state || '',
			postcode: member.postcode || ''
		})
		setIsModalOpen(true)
	}

	const closeModal = () => {
		setIsModalOpen(false)
		setEditingMember(null)
	}

	const onSubmit = async (values: TeamMemberFormValues) => {
		if (!session?.user?.email) return

		setError(null)
		try {
			const { api } = await import('../../../lib/api')
			
			if (editingMember) {
				await api.updateTeamMember(session.user.email, editingMember.id, values)
			} else {
				await api.createTeamMember(session.user.email, values)
			}

			closeModal()
			fetchTeamMembers()
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to save team member')
		}
	}

	const handleDelete = async (memberId: string) => {
		if (!session?.user?.email) return
		if (!confirm('Are you sure you want to archive this team member?')) return

		setDeletingMemberId(memberId)
		try {
			const { api } = await import('../../../lib/api')
			await api.deleteTeamMember(session.user.email, memberId)
			fetchTeamMembers()
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to archive team member')
		} finally {
			setDeletingMemberId(null)
		}
	}

	const handleToggleActive = async (memberId: string) => {
		if (!session?.user?.email) return

		setTogglingMemberId(memberId)
		setError(null)
		try {
			const { api } = await import('../../../lib/api')
			const result = await api.toggleTeamMemberActive(session.user.email, memberId)
			// Update the member in the local state
			setMembers(members.map(member => 
				member.id === memberId ? { ...member, active: result.active } : member
			))
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to toggle team member status')
		} finally {
			setTogglingMemberId(null)
		}
	}

	const handleRestore = async (memberId: string) => {
		if (!session?.user?.email) return

		setRestoringMemberId(memberId)
		setError(null)
		try {
			const { api } = await import('../../../lib/api')
			await api.restoreTeamMember(session.user.email, memberId)
			fetchTeamMembers()
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to restore team member')
		} finally {
			setRestoringMemberId(null)
		}
	}

	if (!session) {
		return null
	}

	return (
		<div className="flex min-h-screen bg-gray-50">
			<DashboardSidebar />
			<main className="flex-1 p-6">
				<div className="mb-8 flex items-center justify-between">
					<div>
						<h1 className="text-3xl font-bold text-gray-900 mb-2">Manage Team</h1>
						<p className="text-gray-600">Add, edit, and remove team members</p>
					</div>
					<div className="flex items-center space-x-4">
						<label className="flex items-center space-x-2 cursor-pointer">
							<input
								type="checkbox"
								checked={showInactive}
								onChange={(e) => setShowInactive(e.target.checked)}
								className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
							/>
							<span className="text-sm font-medium text-gray-700">Show Inactive</span>
						</label>
						<button
							onClick={openAddModal}
							className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
						>
							<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
							</svg>
							<span>New Team Member</span>
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
				) : members.length === 0 ? (
					<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
						<svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
						</svg>
						<p className="text-gray-600 mb-2">No team members yet</p>
						<p className="text-sm text-gray-500 mb-6">Get started by adding your first team member</p>
						<button
							onClick={openAddModal}
							className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 mx-auto"
						>
							<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
							</svg>
							<span>New Team Member</span>
						</button>
					</div>
				) : (
					<div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-visible pb-20">
						<div className="overflow-x-auto overflow-y-visible min-h-[600px]">
							<table className="w-full">
								<thead className="bg-gray-50 border-b border-gray-200">
									<tr>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID Type</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID Number</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
									</tr>
								</thead>
								<tbody className="bg-white divide-y divide-gray-200">
									{members.map((member) => (
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
												<div className="text-sm text-gray-600">{member.idType || '-'}</div>
											</td>
											<td className="px-6 py-4 whitespace-nowrap">
												<div className="text-sm text-gray-600">{member.idNumber || '-'}</div>
											</td>
											<td className="px-6 py-4 whitespace-nowrap">
												<span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
													member.archived 
														? 'bg-yellow-100 text-yellow-800' 
														: member.active !== false 
															? 'bg-green-100 text-green-800' 
															: 'bg-gray-100 text-gray-800'
												}`}>
													{member.archived ? 'Archived' : (member.active !== false ? 'Active' : 'Inactive')}
												</span>
											</td>
											<td className="px-6 py-4 whitespace-nowrap text-left text-sm font-medium relative">
												<div className="relative action-dropdown">
													<button
														type="button"
														onClick={() => setOpenDropdownId(openDropdownId === member.id ? null : member.id)}
														className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
													>
														<span>Actions</span>
														<svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
															<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
														</svg>
													</button>
													{openDropdownId === member.id && (
														<div className="absolute left-0 top-full mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-50">
															<div className="py-1">
																{!member.archived && (
																	<button
																		onClick={() => {
																			openEditModal(member)
																			setOpenDropdownId(null)
																		}}
																		className="w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 flex items-center"
																	>
																		<svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																			<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
																		</svg>
																		Edit
																	</button>
																)}
																{!member.archived && (
																	<>
																		<button
																			onClick={() => {
																				setOpenDropdownId(null)
																				handleToggleActive(member.id)
																			}}
																			disabled={togglingMemberId === member.id}
																			className={`w-full text-left px-4 py-2 text-sm flex items-center disabled:opacity-50 disabled:cursor-not-allowed ${member.active !== false ? 'text-gray-700 hover:bg-gray-100' : 'text-green-600 hover:bg-green-50'}`}
																		>
																			<svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																				<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={member.active !== false ? "M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" : "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"} />
																			</svg>
																			{togglingMemberId === member.id ? 'Processing...' : (member.active !== false ? 'Deactivate' : 'Activate')}
																		</button>
																		<button
																			onClick={() => {
																				setOpenDropdownId(null)
																				handleDelete(member.id)
																			}}
																			disabled={deletingMemberId === member.id}
																			className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
																		>
																			<svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																				<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
																			</svg>
																			{deletingMemberId === member.id ? 'Archiving...' : 'Archive'}
																		</button>
																	</>
																)}
																{member.archived && (
																	<button
																		onClick={() => {
																			handleRestore(member.id)
																			setOpenDropdownId(null)
																		}}
																		disabled={restoringMemberId === member.id}
																		className="w-full text-left px-4 py-2 text-sm text-green-600 hover:bg-green-50 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
																	>
																		<svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																			<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
																		</svg>
																		{restoringMemberId === member.id ? 'Restoring...' : 'Restore'}
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
						<div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
							<div className="p-6">
								<div className="mb-6">
									<h2 className="text-2xl font-bold text-gray-900">
										{editingMember ? 'Edit Team Member' : 'Add Team Member'}
									</h2>
								</div>

								<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
									<div>
										<label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
											Name *
										</label>
										<input
											id="name"
											type="text"
											className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors"
											placeholder="John Doe"
											{...register('name')}
										/>
										{errors.name && (
											<p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
										)}
									</div>

									<div>
										<label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
											Email *
										</label>
										<input
											id="email"
											type="email"
											className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors"
											placeholder="john@example.com"
											{...register('email')}
										/>
										{errors.email && (
											<p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
										)}
									</div>

									<div>
										<label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
											Phone
										</label>
										<input
											id="phone"
											type="tel"
											className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors"
											placeholder="+61 451248244"
											{...register('phone')}
										/>
										{errors.phone && (
											<p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
										)}
									</div>

									<div>
										<label htmlFor="idType" className="block text-sm font-medium text-gray-700 mb-2">
											ID Type
										</label>
										<select
											id="idType"
											className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors"
											{...register('idType')}
										>
											<option value="">Select ID Type</option>
											<option value="Australian Driver's License">Australian Driver's License</option>
											<option value="Oversea Driver's License">Oversea Driver's License</option>
											<option value="Australian Passport">Australian Passport</option>
											<option value="Oversea Passport">Oversea Passport</option>
											<option value="Others">Others</option>
										</select>
										{errors.idType && (
											<p className="mt-1 text-sm text-red-600">{errors.idType.message}</p>
										)}
									</div>

									<div>
										<label htmlFor="idNumber" className="block text-sm font-medium text-gray-700 mb-2">
											ID Number
										</label>
										<input
											id="idNumber"
											type="text"
											className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors"
											placeholder="123456789"
											{...register('idNumber')}
										/>
										{errors.idNumber && (
											<p className="mt-1 text-sm text-red-600">{errors.idNumber.message}</p>
										)}
									</div>

									<div>
										<label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
											Address
										</label>
										<input
											id="address"
											type="text"
											className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors"
											placeholder="123 Main Street"
											{...register('address')}
										/>
										{errors.address && (
											<p className="mt-1 text-sm text-red-600">{errors.address.message}</p>
										)}
									</div>

									<div>
										<label htmlFor="suburb" className="block text-sm font-medium text-gray-700 mb-2">
											Suburb
										</label>
										<input
											id="suburb"
											type="text"
											className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors"
											placeholder="Woodville Gardens"
											{...register('suburb')}
										/>
										{errors.suburb && (
											<p className="mt-1 text-sm text-red-600">{errors.suburb.message}</p>
										)}
									</div>

									<div className="grid grid-cols-2 gap-4">
										<div>
											<label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-2">
												State
											</label>
											<select
												id="state"
												className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors"
												{...register('state')}
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
											{errors.state && (
												<p className="mt-1 text-sm text-red-600">{errors.state.message}</p>
											)}
										</div>
										<div>
											<label htmlFor="postcode" className="block text-sm font-medium text-gray-700 mb-2">
												Postcode
											</label>
											<input
												id="postcode"
												type="text"
												className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors"
												placeholder="5012"
												maxLength={10}
												{...register('postcode')}
											/>
											{errors.postcode && (
												<p className="mt-1 text-sm text-red-600">{errors.postcode.message}</p>
											)}
										</div>
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
											{isSubmitting ? 'Saving...' : editingMember ? 'Update' : 'Add Member'}
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


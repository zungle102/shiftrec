'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { DashboardSidebar } from '../../../components/DashboardSidebar'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'

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

type ClientFormValues = z.infer<typeof clientSchema>

interface Client {
	id: string
	name: string
	address: string
	suburb: string
	state: string
	postcode: string
	clientType: string
	phoneNumber: string
	contactPerson: string
	contactPhone: string
	email: string
	note: string
	active: boolean
	archived: boolean
	createdAt: string
	updatedAt: string
}

export default function ClientsPage() {
	const { data: session } = useSession()
	const router = useRouter()
	const [clients, setClients] = useState<Client[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [isModalOpen, setIsModalOpen] = useState(false)
	const [editingClient, setEditingClient] = useState<Client | null>(null)
	const [deletingClientId, setDeletingClientId] = useState<string | null>(null)
	const [togglingClientId, setTogglingClientId] = useState<string | null>(null)
	const [restoringClientId, setRestoringClientId] = useState<string | null>(null)
	const [openDropdownId, setOpenDropdownId] = useState<string | null>(null)
	const [showInactive, setShowInactive] = useState(false)

	const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<ClientFormValues>({
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
		fetchClients()
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

	const fetchClients = async () => {
		if (!session?.user?.email) return

		setLoading(true)
		setError(null)
		try {
			const { api } = await import('../../../lib/api')
			const data = await api.getClients(session.user.email)
			// Filter by inactive status if needed (exclude archived items)
			const filtered = showInactive 
				? data.filter(client => !client.archived) 
				: data.filter(client => !client.archived && client.active !== false)
			setClients(filtered)
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to load clients')
		} finally {
			setLoading(false)
		}
	}

	const openAddModal = () => {
		setEditingClient(null)
		reset({
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
		})
		setIsModalOpen(true)
	}

	const openEditModal = (client: Client) => {
		setEditingClient(client)
		reset({
			name: client.name,
			address: client.address || '',
			suburb: client.suburb || '',
			state: client.state || '',
			postcode: client.postcode || '',
			clientType: client.clientType || '',
			phoneNumber: client.phoneNumber || '',
			contactPerson: client.contactPerson || '',
			contactPhone: client.contactPhone || '',
			email: client.email || '',
			note: client.note || ''
		})
		setIsModalOpen(true)
	}

	const closeModal = () => {
		setIsModalOpen(false)
		setEditingClient(null)
	}

	const onSubmit = async (values: ClientFormValues) => {
		if (!session?.user?.email) return

		setError(null)
		try {
			const { api } = await import('../../../lib/api')
			
			if (editingClient) {
				await api.updateClient(session.user.email, editingClient.id, values)
			} else {
				await api.createClient(session.user.email, values)
			}

			closeModal()
			fetchClients()
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to save client')
		}
	}

	const handleDelete = async (clientId: string) => {
		if (!session?.user?.email) return
		if (!confirm('Are you sure you want to delete this client?')) return

		setDeletingClientId(clientId)
		try {
			const { api } = await import('../../../lib/api')
			await api.deleteClient(session.user.email, clientId)
			fetchClients()
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to delete client')
		} finally {
			setDeletingClientId(null)
		}
	}

	const handleToggleActive = async (clientId: string) => {
		if (!session?.user?.email) return

		setTogglingClientId(clientId)
		setError(null)
		try {
			const { api } = await import('../../../lib/api')
			const result = await api.toggleClientActive(session.user.email, clientId)
			// Update the client in the local state
			setClients(clients.map(client => 
				client.id === clientId ? { ...client, active: result.active } : client
			))
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to toggle client status')
		} finally {
			setTogglingClientId(null)
		}
	}

	const handleRestore = async (clientId: string) => {
		if (!session?.user?.email) return

		setRestoringClientId(clientId)
		setError(null)
		try {
			const { api } = await import('../../../lib/api')
			const result = await api.restoreClient(session.user.email, clientId)
			// Update the client in the local state
			setClients(clients.map(client => 
				client.id === clientId ? { ...client, archived: result.archived } : client
			))
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to restore client')
		} finally {
			setRestoringClientId(null)
		}
	}

	if (!session) {
		return null
	}

	return (
		<div className="flex min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
			<DashboardSidebar />
			<main className="flex-1 p-6 md:p-8 lg:p-12">
				<div className="mb-12 flex items-center justify-between">
					<div>
						<h1 className="text-3xl md:text-4xl font-light text-slate-900 mb-2">Manage Clients</h1>
						<p className="text-base text-slate-500 font-light">Add, edit and remove clients</p>
					</div>
					<div className="flex items-center space-x-4">
						<label className="flex items-center space-x-2 cursor-pointer">
							<input
								type="checkbox"
								checked={showInactive}
								onChange={(e) => setShowInactive(e.target.checked)}
								className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
							/>
							<span className="text-sm font-medium text-slate-700">Show Inactive</span>
						</label>
						<button
							onClick={openAddModal}
							className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
						>
							<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
							</svg>
							<span>New Client</span>
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
						<div className="w-8 h-8 border-2 border-slate-300 border-t-blue-600 rounded-full animate-spin"></div>
					</div>
				) : clients.length === 0 ? (
					<div className="bg-white rounded-lg shadow-sm border border-slate-200 p-12 text-center">
						<svg className="w-16 h-16 text-slate-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
						</svg>
						<p className="text-slate-600 mb-2">No clients yet</p>
						<p className="text-sm text-slate-500 mb-6">Get started by adding your first client</p>
						<button
							onClick={openAddModal}
							className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 mx-auto"
						>
							<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
							</svg>
							<span>New Client</span>
						</button>
					</div>
				) : (
					<div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-visible pb-20">
						<div className="overflow-x-auto overflow-y-visible min-h-[600px]">
							<table className="w-full">
								<thead className="bg-slate-50 border-b border-slate-200">
									<tr>
										<th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Name</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Type</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Street Address</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Phone</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Contact</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
									</tr>
								</thead>
								<tbody className="bg-white divide-y divide-gray-200">
									{clients.map((client) => (
										<tr key={client.id} className="hover:bg-slate-50">
											<td className="px-6 py-4 whitespace-nowrap">
												<div className="text-sm font-medium text-slate-900">{client.name}</div>
												{client.email && (
													<div className="text-xs text-slate-500">{client.email}</div>
												)}
											</td>
											<td className="px-6 py-4 whitespace-nowrap">
												<div className="text-sm text-slate-600">{client.clientType || '-'}</div>
											</td>
											<td className="px-6 py-4">
												{client.address || client.suburb || client.state || client.postcode ? (
													<div className="text-sm text-slate-600">
														{client.address && <div>{client.address}</div>}
														{(client.suburb || client.state || client.postcode) && (
															<div className="text-xs text-slate-500">
																{client.suburb && <span>{client.suburb}</span>}
																{client.suburb && client.state && <span>, </span>}
																{client.state && <span>{client.state}</span>}
																{client.postcode && <span> {client.postcode}</span>}
															</div>
														)}
													</div>
												) : (
													<div className="text-sm text-slate-600">-</div>
												)}
											</td>
											<td className="px-6 py-4 whitespace-nowrap">
												<div className="text-sm text-slate-600">{client.phoneNumber || '-'}</div>
											</td>
											<td className="px-6 py-4">
												{client.contactPerson || client.contactPhone ? (
													<div>
														{client.contactPerson && (
															<div className="text-sm text-slate-900">{client.contactPerson}</div>
														)}
														{client.contactPhone && (
															<div className="text-xs text-slate-500">{client.contactPhone}</div>
														)}
													</div>
												) : (
													<div className="text-sm text-slate-600">-</div>
												)}
											</td>
											<td className="px-6 py-4 whitespace-nowrap">
												<span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
													client.archived 
														? 'bg-yellow-100 text-yellow-800' 
														: client.active !== false 
															? 'bg-green-100 text-green-800' 
															: 'bg-slate-100 text-slate-800'
												}`}>
													{client.archived ? 'Archived' : (client.active !== false ? 'Active' : 'Inactive')}
												</span>
											</td>
											<td className="px-6 py-4 whitespace-nowrap text-left text-sm font-medium relative">
												<div className="relative action-dropdown">
													<button
														type="button"
														onClick={() => setOpenDropdownId(openDropdownId === client.id ? null : client.id)}
														className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
													>
														<span>Actions</span>
														<svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
															<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
														</svg>
													</button>
													{openDropdownId === client.id && (
														<div className="absolute left-0 top-full mt-1 w-48 bg-white rounded-md shadow-lg border border-slate-200 z-50">
															<div className="py-1">
																{!client.archived && (
																	<button
																		onClick={() => {
																			openEditModal(client)
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
																{!client.archived && (
																	<>
																		<button
																			onClick={() => {
																				handleToggleActive(client.id)
																				setOpenDropdownId(null)
																			}}
																			disabled={togglingClientId === client.id}
																			className={`w-full text-left px-4 py-2 text-sm flex items-center disabled:opacity-50 disabled:cursor-not-allowed ${client.active !== false ? 'text-slate-700 hover:bg-slate-100' : 'text-green-600 hover:bg-green-50'}`}
																		>
																			<svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																				<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={client.active !== false ? "M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" : "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"} />
																			</svg>
																			{togglingClientId === client.id ? 'Processing...' : (client.active !== false ? 'Deactivate' : 'Activate')}
																		</button>
																		<button
																			onClick={() => {
																				setOpenDropdownId(null)
																				handleDelete(client.id)
																			}}
																			disabled={deletingClientId === client.id}
																			className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
																		>
																			<svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																				<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
																			</svg>
																			{deletingClientId === client.id ? 'Archiving...' : 'Archive'}
																		</button>
																	</>
																)}
																{client.archived && (
																	<button
																		onClick={() => {
																			handleRestore(client.id)
																			setOpenDropdownId(null)
																		}}
																		disabled={restoringClientId === client.id}
																		className="w-full text-left px-4 py-2 text-sm text-green-600 hover:bg-green-50 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
																	>
																		<svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																			<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
																		</svg>
																		{restoringClientId === client.id ? 'Restoring...' : 'Restore'}
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
									<h2 className="text-2xl font-bold text-slate-900">
										{editingClient ? 'Edit Client' : 'Add Client'}
									</h2>
								</div>

								<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
									<div className="grid grid-cols-2 gap-4">
										<div>
											<label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-2">
												Client Name *
											</label>
											<input
												id="name"
												type="text"
												className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors"
												placeholder="Client Name"
												{...register('name')}
											/>
											{errors.name && (
												<p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
											)}
										</div>
										<div>
											<label htmlFor="clientType" className="block text-sm font-medium text-slate-700 mb-2">
												Client Type
											</label>
											<select
												id="clientType"
												className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors"
												{...register('clientType')}
											>
												<option value="">Select Client Type</option>
												<option value="Aged Care">Aged Care</option>
												<option value="NDIS">NDIS</option>
												<option value="Others">Others</option>
											</select>
											{errors.clientType && (
												<p className="mt-1 text-sm text-red-600">{errors.clientType.message}</p>
											)}
										</div>
									</div>

									<div className="grid grid-cols-2 gap-4">
										<div>
											<label htmlFor="phoneNumber" className="block text-sm font-medium text-slate-700 mb-2">
												Phone Number
											</label>
											<input
												id="phoneNumber"
												type="tel"
												className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors"
												placeholder="+61 451248244"
												{...register('phoneNumber')}
											/>
											{errors.phoneNumber && (
												<p className="mt-1 text-sm text-red-600">{errors.phoneNumber.message}</p>
											)}
										</div>
										<div>
											<label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
												Email
											</label>
											<input
												id="email"
												type="email"
												className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors"
												placeholder="client@example.com"
												{...register('email')}
											/>
											{errors.email && (
												<p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
											)}
										</div>
									</div>

									<div>
										<label htmlFor="address" className="block text-sm font-medium text-slate-700 mb-2">
											Street Address
										</label>
										<input
											id="address"
											type="text"
											className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors"
											placeholder="123 Main Street"
											{...register('address')}
										/>
										{errors.address && (
											<p className="mt-1 text-sm text-red-600">{errors.address.message}</p>
										)}
									</div>

									<div>
										<label htmlFor="suburb" className="block text-sm font-medium text-slate-700 mb-2">
											Suburb
										</label>
										<input
											id="suburb"
											type="text"
											className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors"
											placeholder="Woodville Gardens"
											{...register('suburb')}
										/>
										{errors.suburb && (
											<p className="mt-1 text-sm text-red-600">{errors.suburb.message}</p>
										)}
									</div>

									<div className="grid grid-cols-2 gap-4">
										<div>
											<label htmlFor="state" className="block text-sm font-medium text-slate-700 mb-2">
												State
											</label>
											<select
												id="state"
												className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors"
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
											<label htmlFor="postcode" className="block text-sm font-medium text-slate-700 mb-2">
												Postcode
											</label>
											<input
												id="postcode"
												type="text"
												className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors"
												placeholder="5012"
												maxLength={10}
												{...register('postcode')}
											/>
											{errors.postcode && (
												<p className="mt-1 text-sm text-red-600">{errors.postcode.message}</p>
											)}
										</div>
									</div>

									<div className="grid grid-cols-2 gap-4">
										<div>
											<label htmlFor="contactPerson" className="block text-sm font-medium text-slate-700 mb-2">
												Contact Person
											</label>
											<input
												id="contactPerson"
												type="text"
												className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors"
												placeholder="John Doe"
												{...register('contactPerson')}
											/>
											{errors.contactPerson && (
												<p className="mt-1 text-sm text-red-600">{errors.contactPerson.message}</p>
											)}
										</div>
										<div>
											<label htmlFor="contactPhone" className="block text-sm font-medium text-slate-700 mb-2">
												Contact Phone
											</label>
											<input
												id="contactPhone"
												type="tel"
												className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors"
												placeholder="+61 451248244"
												{...register('contactPhone')}
											/>
											{errors.contactPhone && (
												<p className="mt-1 text-sm text-red-600">{errors.contactPhone.message}</p>
											)}
										</div>
									</div>

									<div>
										<label htmlFor="note" className="block text-sm font-medium text-slate-700 mb-2">
											Note
										</label>
										<textarea
											id="note"
											rows={4}
											className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors"
											placeholder="Additional notes about this client..."
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
											className="px-6 py-2.5 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors"
										>
											Cancel
										</button>
										<button
											type="submit"
											disabled={isSubmitting}
											className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
										>
											{isSubmitting ? 'Saving...' : editingClient ? 'Update' : 'Add Client'}
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


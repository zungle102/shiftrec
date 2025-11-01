"use client"
import { useSession } from 'next-auth/react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardSidebar } from '../../../components/DashboardSidebar'

const profileSchema = z.object({
	name: z.string().min(1, 'Business name is required').max(100, 'Business name is too long'),
	businessName: z.string().max(200, 'Contact person name is too long').optional().or(z.literal('')),
	streetAddress: z.string().max(200, 'Street address is too long').optional().or(z.literal('')),
	suburb: z.string().max(100, 'Suburb is too long').optional().or(z.literal('')),
	state: z.string().max(50, 'State is too long').optional().or(z.literal('')),
	postcode: z.string().max(10, 'Postcode is too long').optional().or(z.literal('')),
	phoneNumber: z.string().max(20, 'Phone number is too long').optional().or(z.literal('')),
	businessWebsite: z.string().url('Invalid website URL').max(200, 'Website URL is too long').optional().or(z.literal('')),
	businessABN: z.string().max(11, 'ABN must be 11 digits').regex(/^\d{11}$|^$/, 'ABN must be exactly 11 digits').optional().or(z.literal(''))
})

type ProfileFormValues = z.infer<typeof profileSchema>

export default function ProfilePage() {
	const { data: session, update: updateSession } = useSession()
	const router = useRouter()
	const [error, setError] = useState<string | null>(null)
	const [success, setSuccess] = useState(false)
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [loading, setLoading] = useState(true)
	const [profileData, setProfileData] = useState<any>(null)

		const { register, handleSubmit, formState: { errors }, reset } = useForm<ProfileFormValues>({
		resolver: zodResolver(profileSchema),
		defaultValues: {
			name: '',
			businessName: '',
			streetAddress: '',
			suburb: '',
			state: '',
			postcode: '',
			phoneNumber: '',
			businessWebsite: '',
			businessABN: ''
		}
	})

	// Fetch user profile data
	useEffect(() => {
		async function fetchProfile() {
			if (!session?.user?.email) return
			
			try {
				const { api } = await import('../../../lib/api')
				const data = await api.getProfile(session.user.email)
				setProfileData(data)
					reset({
						name: data.name || '',
						businessName: data.businessName || '',
						streetAddress: data.streetAddress || '',
						suburb: data.suburb || '',
						state: data.state || '',
						postcode: data.postcode || '',
						phoneNumber: data.phoneNumber || '',
						businessWebsite: data.businessWebsite || '',
						businessABN: data.businessABN || ''
					})
			} catch (err) {
				console.error('Failed to fetch profile:', err)
			} finally {
				setLoading(false)
			}
		}
		fetchProfile()
	}, [session, reset])

	if (!session) {
		router.push('/signin')
		return null
	}

	const onSubmit = async (values: ProfileFormValues) => {
		setError(null)
		setSuccess(false)
		setIsSubmitting(true)

		try {
			if (!session?.user?.email) {
				throw new Error('User email not found')
			}

			const { api } = await import('../../../lib/api')
			await api.updateProfile(session.user.email, {
				name: values.name,
				businessName: values.businessName || '',
				streetAddress: values.streetAddress || '',
				suburb: values.suburb || '',
				state: values.state || '',
				postcode: values.postcode || '',
				phoneNumber: values.phoneNumber || '',
				businessWebsite: values.businessWebsite || '',
				businessABN: values.businessABN || ''
			})

			// Update the session with new name
			await updateSession({
				...session,
				user: {
					...session.user,
					name: values.name
				}
			})

			setSuccess(true)
			setTimeout(() => setSuccess(false), 3000)
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to update profile')
		} finally {
			setIsSubmitting(false)
		}
	}

	return (
		<div className="flex min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
			<DashboardSidebar />
			<main className="flex-1 p-6 md:p-8 lg:p-12">
				<div className="max-w-2xl mx-auto">
					<div className="mb-12">
						<h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">Edit Profile</h1>
						<p className="text-base text-slate-500 font-light">Update your business information</p>
						{session?.user?.email && (
							<div className="mt-6 flex justify-center">
								<div className="inline-flex items-center px-4 py-2 border border-slate-300 bg-white">
									<svg className="w-5 h-5 text-slate-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
									</svg>
									<span className="text-sm font-normal text-slate-900">{session.user.email}</span>
								</div>
							</div>
						)}
					</div>

					<div className="bg-white border-2 border-blue-200 rounded-xl shadow-lg pb-12 p-8">
						<form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
							<div>
								<label htmlFor="name" className="block text-sm font-bold text-slate-900 mb-2">
									Business Name
								</label>
								<input
									id="name"
									type="text"
									className="w-full border-2 border-blue-200 px-4 py-3 text-slate-900 placeholder-slate-400 bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-300 transition-all duration-200 rounded-lg"
									placeholder="My Business Pty Ltd"
									{...register('name')}
								/>
								{errors.name && (
									<p className="mt-2 text-sm text-red-600 font-semibold">{errors.name.message}</p>
								)}
							</div>

							<div>
								<label htmlFor="streetAddress" className="block text-sm font-normal text-slate-900 mb-2">
									Street Address
								</label>
								<input
									id="streetAddress"
									type="text"
									className="w-full border-2 border-blue-200 px-4 py-3 text-slate-900 placeholder-slate-400 bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-300 transition-all duration-200 rounded-lg"
									placeholder="123 Main Street"
									{...register('streetAddress')}
								/>
								{errors.streetAddress && (
									<p className="mt-2 text-sm text-slate-600">{errors.streetAddress.message}</p>
								)}
							</div>

							<div>
								<label htmlFor="suburb" className="block text-sm font-normal text-slate-900 mb-2">
									Suburb
								</label>
								<input
									id="suburb"
									type="text"
									className="w-full border-2 border-blue-200 px-4 py-3 text-slate-900 placeholder-slate-400 bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-300 transition-all duration-200 rounded-lg"
									placeholder="Woodville Gardens"
									{...register('suburb')}
								/>
								{errors.suburb && (
									<p className="mt-2 text-sm text-slate-600">{errors.suburb.message}</p>
								)}
							</div>

							<div className="grid grid-cols-2 gap-4">
								<div>
									<label htmlFor="state" className="block text-sm font-normal text-slate-900 mb-2">
										State
									</label>
									<select
										id="state"
										className="w-full border border-slate-300 px-4 py-3 text-slate-900 bg-white focus:border-slate-900 focus:outline-none transition-colors duration-200"
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
										<p className="mt-2 text-sm text-slate-600">{errors.state.message}</p>
									)}
								</div>
								<div>
									<label htmlFor="postcode" className="block text-sm font-normal text-slate-900 mb-2">
										Postcode
									</label>
									<input
										id="postcode"
										type="text"
										className="w-full border-2 border-blue-200 px-4 py-3 text-slate-900 placeholder-slate-400 bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-300 transition-all duration-200 rounded-lg"
										placeholder="5012"
										maxLength={10}
										{...register('postcode')}
									/>
									{errors.postcode && (
										<p className="mt-2 text-sm text-slate-600">{errors.postcode.message}</p>
									)}
								</div>
							</div>

							<div>
								<label htmlFor="businessName" className="block text-sm font-normal text-slate-900 mb-2">
									Contact Person
								</label>
								<input
									id="businessName"
									type="text"
									className="w-full border-2 border-blue-200 px-4 py-3 text-slate-900 placeholder-slate-400 bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-300 transition-all duration-200 rounded-lg"
									placeholder="John Doe"
									{...register('businessName')}
								/>
								{errors.businessName && (
									<p className="mt-2 text-sm text-slate-600">{errors.businessName.message}</p>
								)}
							</div>

							<div>
								<label htmlFor="phoneNumber" className="block text-sm font-normal text-slate-900 mb-2">
									Phone Number
								</label>
								<input
									id="phoneNumber"
									type="tel"
									className="w-full border-2 border-blue-200 px-4 py-3 text-slate-900 placeholder-slate-400 bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-300 transition-all duration-200 rounded-lg"
									placeholder="+61 451248244"
									{...register('phoneNumber')}
								/>
								{errors.phoneNumber && (
									<p className="mt-2 text-sm text-slate-600">{errors.phoneNumber.message}</p>
								)}
							</div>

							<div>
								<label htmlFor="businessWebsite" className="block text-sm font-normal text-slate-900 mb-2">
									Business Website
								</label>
								<input
									id="businessWebsite"
									type="url"
									className="w-full border-2 border-blue-200 px-4 py-3 text-slate-900 placeholder-slate-400 bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-300 transition-all duration-200 rounded-lg"
									placeholder="https://www.example.com"
									{...register('businessWebsite')}
								/>
								{errors.businessWebsite && (
									<p className="mt-2 text-sm text-slate-600">{errors.businessWebsite.message}</p>
								)}
							</div>

							<div>
								<label htmlFor="businessABN" className="block text-sm font-normal text-slate-900 mb-2">
									Business ABN
								</label>
								<input
									id="businessABN"
									type="text"
									className="w-full border-2 border-blue-200 px-4 py-3 text-slate-900 placeholder-slate-400 bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-300 transition-all duration-200 rounded-lg"
									placeholder="12345678901"
									maxLength={11}
									{...register('businessABN')}
								/>
								{errors.businessABN && (
									<p className="mt-2 text-sm text-slate-600">{errors.businessABN.message}</p>
								)}
							</div>

							{error && (
								<div className="border-2 border-red-400 bg-red-100 p-4 rounded-lg">
									<p className="text-sm text-red-800 font-semibold">{error}</p>
								</div>
							)}

							{success && (
								<div className="border-2 border-green-400 bg-green-100 p-4 rounded-lg">
									<p className="text-sm text-green-800 font-semibold">Profile updated successfully!</p>
								</div>
							)}

							<div className="flex items-center justify-end space-x-4 pt-6">
								<button
									type="button"
									onClick={() => router.back()}
									className="px-8 py-4 border-2 border-blue-300 text-blue-700 font-bold bg-white hover:bg-blue-50 transition-colors duration-200 rounded-lg shadow-md"
								>
									Cancel
								</button>
								<button
									type="submit"
									disabled={isSubmitting}
									className="px-8 py-4 bg-orange-500 text-white font-bold hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 rounded-lg shadow-lg"
								>
									{isSubmitting ? 'Saving...' : 'Save Changes'}
								</button>
							</div>
						</form>
					</div>
				</div>
			</main>
		</div>
	)
}


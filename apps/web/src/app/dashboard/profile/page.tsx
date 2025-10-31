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
		<div className="flex min-h-screen bg-gray-50">
			<DashboardSidebar />
			<main className="flex-1 p-6">
				<div className="max-w-2xl mx-auto">
					<div className="mb-8">
						<h1 className="text-3xl font-bold text-gray-900 mb-2">Edit Profile</h1>
						<p className="text-gray-600">Update your personal information</p>
						{session?.user?.email && (
							<div className="mt-4 flex justify-center">
								<div className="inline-flex items-center px-4 py-2 rounded-lg bg-blue-50 border border-blue-200">
									<svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
									</svg>
									<span className="text-sm font-semibold text-blue-700">{session.user.email}</span>
								</div>
							</div>
						)}
					</div>

					<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
						<form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
							<div>
								<label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
									Business Name
								</label>
								<input
									id="name"
									type="text"
									className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors"
									placeholder="My Business Pty Ltd"
									{...register('name')}
								/>
								{errors.name && (
									<p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
								)}
							</div>

							<div>
								<label htmlFor="streetAddress" className="block text-sm font-medium text-gray-700 mb-2">
									Street Address
								</label>
								<input
									id="streetAddress"
									type="text"
									className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors"
									placeholder="123 Main Street"
									{...register('streetAddress')}
								/>
								{errors.streetAddress && (
									<p className="mt-1 text-sm text-red-600">{errors.streetAddress.message}</p>
								)}
							</div>

							<div className="grid grid-cols-2 gap-4">
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
								<div>
									<label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-2">
										State
									</label>
									<input
										id="state"
										type="text"
										className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors"
										placeholder="SA"
										{...register('state')}
									/>
									{errors.state && (
										<p className="mt-1 text-sm text-red-600">{errors.state.message}</p>
									)}
								</div>
							</div>

							<div>
								<label htmlFor="businessName" className="block text-sm font-medium text-gray-700 mb-2">
									Contact Person
								</label>
								<input
									id="businessName"
									type="text"
									className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors"
									placeholder="John Doe"
									{...register('businessName')}
								/>
								{errors.businessName && (
									<p className="mt-1 text-sm text-red-600">{errors.businessName.message}</p>
								)}
							</div>

							<div>
								<label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-2">
									Phone Number
								</label>
								<input
									id="phoneNumber"
									type="tel"
									className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors"
									placeholder="+61 451248244"
									{...register('phoneNumber')}
								/>
								{errors.phoneNumber && (
									<p className="mt-1 text-sm text-red-600">{errors.phoneNumber.message}</p>
								)}
							</div>

							<div>
								<label htmlFor="businessWebsite" className="block text-sm font-medium text-gray-700 mb-2">
									Business Website
								</label>
								<input
									id="businessWebsite"
									type="url"
									className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors"
									placeholder="https://www.example.com"
									{...register('businessWebsite')}
								/>
								{errors.businessWebsite && (
									<p className="mt-1 text-sm text-red-600">{errors.businessWebsite.message}</p>
								)}
							</div>

							<div>
								<label htmlFor="businessABN" className="block text-sm font-medium text-gray-700 mb-2">
									Business ABN
								</label>
								<input
									id="businessABN"
									type="text"
									className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors"
									placeholder="12345678901"
									maxLength={11}
									{...register('businessABN')}
								/>
								{errors.businessABN && (
									<p className="mt-1 text-sm text-red-600">{errors.businessABN.message}</p>
								)}
							</div>

							{error && (
								<div className="rounded-lg bg-red-50 border border-red-200 p-3">
									<p className="text-sm text-red-600">{error}</p>
								</div>
							)}

							{success && (
								<div className="rounded-lg bg-green-50 border border-green-200 p-3">
									<p className="text-sm text-green-600">Profile updated successfully!</p>
								</div>
							)}

							<div className="flex items-center justify-between pt-4">
								<button
									type="submit"
									disabled={isSubmitting}
									className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
								>
									{isSubmitting ? 'Saving...' : 'Save Changes'}
								</button>
								<button
									type="button"
									onClick={() => router.back()}
									className="px-6 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
								>
									Cancel
								</button>
							</div>
						</form>
					</div>
				</div>
			</main>
		</div>
	)
}


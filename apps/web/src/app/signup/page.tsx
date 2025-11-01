"use client"
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'

const schema = z.object({
	name: z.string().min(1),
	email: z.string().email(),
	password: z.string().min(8)
})

type FormValues = z.infer<typeof schema>

export default function SignupPage() {
	const router = useRouter()
	const { data: session, status } = useSession()
	const [error, setError] = useState<string | null>(null)
	const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
		resolver: zodResolver(schema)
	})

	// Redirect to homepage if already signed in
	useEffect(() => {
		if (status === 'authenticated' && session) {
			router.push('/')
		}
	}, [status, session, router])

	// Show loading state while checking session
	if (status === 'loading') {
		return (
			<main className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-6 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500">
				<div className="w-8 h-8 border-4 border-white border-t-orange-500 animate-spin rounded-full"></div>
			</main>
		)
	}

	// Don't render sign-up form if already authenticated (redirect will happen)
	if (status === 'authenticated') {
		return null
	}

	const onSubmit = async (values: FormValues) => {
		setError(null)
		try {
			const { api } = await import('../../lib/api')
			await api.signup(values)
			router.push('/signin')
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Sign up failed')
		}
	}

	return (
		<main className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-6 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500">
			<div className="w-full max-w-md">
				<div className="bg-white border-4 border-blue-300 rounded-xl shadow-2xl pb-12 px-8 pt-8">
					<div className="mb-12">
						<h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">Create your account</h1>
						<p className="text-base text-slate-700 font-medium">Sign up to get started with ShiftRec</p>
					</div>

					<form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
						<div>
							<label htmlFor="name" className="block text-sm font-bold text-slate-900 mb-2">
								Full name
							</label>
							<input
								id="name"
								className="w-full border-2 border-blue-200 px-4 py-3 text-slate-900 placeholder-slate-400 bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-300 transition-all duration-200 rounded-lg"
								type="text"
								placeholder="John Doe"
								{...register('name')}
							/>
							{errors.name && (
								<p className="mt-2 text-sm text-red-600 font-semibold">{errors.name.message}</p>
							)}
						</div>
						<div>
							<label htmlFor="email" className="block text-sm font-normal text-white mb-2">
								Email address
							</label>
							<input
								id="email"
								className="w-full border-2 border-blue-200 px-4 py-3 text-slate-900 placeholder-slate-400 bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-300 transition-all duration-200 rounded-lg"
								type="email"
								placeholder="you@example.com"
								{...register('email')}
							/>
							{errors.email && (
								<p className="mt-2 text-sm text-red-600 font-semibold">{errors.email.message}</p>
							)}
						</div>
						<div>
							<label htmlFor="password" className="block text-sm font-bold text-slate-900 mb-2">
								Password
							</label>
							<input
								id="password"
								className="w-full border-2 border-blue-200 px-4 py-3 text-slate-900 placeholder-slate-400 bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-300 transition-all duration-200 rounded-lg"
								type="password"
								placeholder="••••••••"
								{...register('password')}
							/>
							{errors.password && (
								<p className="mt-2 text-sm text-red-600 font-semibold">{errors.password.message}</p>
							)}
						</div>
						{error && (
							<div className="border-2 border-red-400 bg-red-100 p-4 rounded-lg">
								<p className="text-sm text-red-800 font-semibold">{error}</p>
							</div>
						)}
						<button
							type="submit"
							disabled={isSubmitting}
							className="w-full bg-orange-500 px-8 py-4 text-white font-bold hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 rounded-lg shadow-lg"
						>
							{isSubmitting ? 'Creating account...' : 'Create account'}
						</button>
					</form>

					<div className="mt-8 text-center">
						<p className="text-sm text-slate-700 font-medium">
							Already have an account?{' '}
							<a href="/signin" className="font-bold text-blue-600 hover:text-blue-700 transition-colors">
								Sign in
							</a>
						</p>
					</div>
				</div>
			</div>
		</main>
	)
}



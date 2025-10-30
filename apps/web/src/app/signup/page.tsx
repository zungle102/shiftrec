"use client"
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const schema = z.object({
	name: z.string().min(1),
	email: z.string().email(),
	password: z.string().min(8)
})

type FormValues = z.infer<typeof schema>

export default function SignupPage() {
	const router = useRouter()
	const [error, setError] = useState<string | null>(null)
	const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
		resolver: zodResolver(schema)
	})

	const onSubmit = async (values: FormValues) => {
		setError(null)
		const res = await fetch('/api/auth/signup', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(values)
		})
		if (res.ok) {
			router.push('/signin')
		} else {
			const data = await res.json().catch(() => ({}))
			setError(data.error ?? 'Sign up failed')
		}
	}

	return (
		<main className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-6">
			<div className="w-full max-w-md">
				<div className="bg-white rounded-lg shadow-lg border border-gray-200 p-8">
					<div className="mb-8">
						<h1 className="text-3xl font-bold text-gray-900 mb-2">Create your account</h1>
						<p className="text-gray-600">Sign up to get started with ShiftRec</p>
					</div>

					<form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
						<div>
							<label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
								Full name
							</label>
							<input
								id="name"
								className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors"
								type="text"
								placeholder="John Doe"
								{...register('name')}
							/>
							{errors.name && (
								<p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
							)}
						</div>
						<div>
							<label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
								Email address
							</label>
							<input
								id="email"
								className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors"
								type="email"
								placeholder="you@example.com"
								{...register('email')}
							/>
							{errors.email && (
								<p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
							)}
						</div>
						<div>
							<label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
								Password
							</label>
							<input
								id="password"
								className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors"
								type="password"
								placeholder="••••••••"
								{...register('password')}
							/>
							{errors.password && (
								<p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
							)}
						</div>
						{error && (
							<div className="rounded-lg bg-red-50 border border-red-200 p-3">
								<p className="text-sm text-red-600">{error}</p>
							</div>
						)}
						<button
							type="submit"
							disabled={isSubmitting}
							className="w-full rounded-lg bg-gray-900 px-4 py-3 text-white font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
						>
							{isSubmitting ? 'Creating account...' : 'Create account'}
						</button>
					</form>

					<div className="mt-6 text-center">
						<p className="text-sm text-gray-600">
							Already have an account?{' '}
							<a href="/signin" className="font-medium text-gray-900 hover:text-gray-700">
								Sign in
							</a>
						</p>
					</div>
				</div>
			</div>
		</main>
	)
}



"use client"
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'

const schema = z.object({
	email: z.string().email(),
	password: z.string().min(8)
})

type FormValues = z.infer<typeof schema>

export default function SigninPage() {
	const router = useRouter()
	const search = useSearchParams()
	const callbackUrl = search.get('callbackUrl') || '/'
	const [error, setError] = useState<string | null>(null)
	const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({ resolver: zodResolver(schema) })

	const onSubmit = async (values: FormValues) => {
		setError(null)
		const res = await signIn('credentials', { ...values, redirect: false, callbackUrl })
		if (res?.ok) {
			router.push(res.url || '/')
		} else {
			setError('Invalid credentials')
		}
	}

	return (
		<main className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-6">
			<div className="w-full max-w-md">
				<div className="bg-white rounded-lg shadow-lg border border-gray-200 p-8">
					<div className="mb-8">
						<h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back</h1>
						<p className="text-gray-600">Sign in to your account to continue</p>
					</div>

					<form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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
							{isSubmitting ? 'Signing in...' : 'Sign in'}
						</button>
					</form>
					
					<div className="relative my-6">
						<div className="absolute inset-0 flex items-center">
							<div className="w-full border-t border-gray-300"></div>
						</div>
						<div className="relative flex justify-center text-sm">
							<span className="bg-white px-4 text-gray-500">Or continue with</span>
						</div>
					</div>

					{/* OAuth Providers */}
					<div className="space-y-3">
						<button
							type="button"
							onClick={() => signIn('google', { callbackUrl })}
							className="w-full flex items-center justify-center gap-3 rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
						>
							<svg className="w-5 h-5" viewBox="0 0 24 24">
								<path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
								<path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
								<path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
								<path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
							</svg>
							Sign in with Google
						</button>
						<button
							type="button"
							onClick={() => signIn('github', { callbackUrl })}
							className="w-full flex items-center justify-center gap-3 rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
						>
							<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
								<path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd"/>
							</svg>
							Sign in with GitHub
						</button>
					</div>
					
					<div className="mt-6 text-center">
						<p className="text-sm text-gray-600">
							Don't have an account?{' '}
							<a href="/signup" className="font-medium text-gray-900 hover:text-gray-700">
								Sign up
							</a>
						</p>
					</div>
				</div>
			</div>
		</main>
	)
}



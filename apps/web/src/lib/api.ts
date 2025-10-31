// API client configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

export async function apiRequest<T>(
	endpoint: string,
	options: RequestInit = {},
	userEmail?: string
): Promise<T> {
	const headers: HeadersInit = {
		'Content-Type': 'application/json',
		...options.headers
	}

	if (userEmail) {
		headers['x-user-email'] = userEmail
	}

	try {
		const url = `${API_BASE_URL}${endpoint}`
		const response = await fetch(url, {
			...options,
			headers,
			credentials: 'include'
		})

		if (!response.ok) {
			// Handle 404 and other errors
			if (response.status === 404) {
				throw new Error(`API endpoint not found: ${url}. Make sure the backend server is running on ${API_BASE_URL}`)
			}
			
			let errorData
			try {
				errorData = await response.json()
			} catch {
				errorData = { error: `HTTP ${response.status}: ${response.statusText}` }
			}
			
			const errorMessage = errorData.error || errorData.message || `HTTP error! status: ${response.status}`
			throw new Error(errorMessage)
		}

		return response.json()
	} catch (error) {
		if (error instanceof Error) {
			// Check if it's a network error
			if (error.message.includes('fetch')) {
				throw new Error(`Cannot connect to API server at ${API_BASE_URL}. Make sure the backend is running.`)
			}
			throw error
		}
		throw new Error('Network error: Failed to reach API server')
	}
}

export const api = {
	signup: (data: { name: string; email: string; password: string }) =>
		apiRequest<{ ok: boolean }>('/auth/signup', {
			method: 'POST',
			body: JSON.stringify(data)
		}),

	getProfile: (userEmail: string) =>
		apiRequest<{
			name: string
			email: string
			businessName: string
			streetAddress: string
			suburb: string
			state: string
			phoneNumber: string
			businessWebsite: string
			businessABN: string
		}>('/user/profile', {
			method: 'GET'
		}, userEmail),

	updateProfile: (userEmail: string, data: any) =>
		apiRequest<{ ok: boolean }>('/user/profile', {
			method: 'PATCH',
			body: JSON.stringify(data)
		}, userEmail)
}


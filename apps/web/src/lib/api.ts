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
			postcode: string
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
		}, userEmail),

	// Team Members
		getTeamMembers: (userEmail: string, includeArchived?: boolean) =>
		apiRequest<Array<{
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
		}>>(`/team/members${includeArchived ? '?includeArchived=true' : ''}`, {
			method: 'GET'
		}, userEmail),

	createTeamMember: (userEmail: string, data: { name: string; email: string; phone?: string; idType?: string; idNumber?: string; address?: string; suburb?: string; state?: string; postcode?: string }) =>
		apiRequest<{
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
		}>('/team/members', {
			method: 'POST',
			body: JSON.stringify(data)
		}, userEmail),

	updateTeamMember: (userEmail: string, memberId: string, data: { name: string; email: string; phone?: string; idType?: string; idNumber?: string; address?: string; suburb?: string; state?: string; postcode?: string }) =>
		apiRequest<{
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
		}>(`/team/members/${memberId}`, {
			method: 'PATCH',
			body: JSON.stringify(data)
		}, userEmail),

	deleteTeamMember: (userEmail: string, memberId: string) =>
		apiRequest<{ success: boolean; archived: boolean }>(`/team/members/${memberId}`, {
			method: 'DELETE'
		}, userEmail),

	restoreTeamMember: (userEmail: string, memberId: string) =>
		apiRequest<{
			id: string
			archived: boolean
		}>(`/team/members/${memberId}/restore`, {
			method: 'PATCH'
		}, userEmail),

	toggleTeamMemberActive: (userEmail: string, memberId: string) =>
		apiRequest<{
			id: string
			active: boolean
		}>(`/team/members/${memberId}/toggle-active`, {
			method: 'PATCH'
		}, userEmail),

	// Shifts
		getShifts: (userEmail: string, includeArchived?: boolean) =>
		apiRequest<Array<{
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
			teamMemberId: string
			teamMemberName: string
			status: string
			note: string
			archived: boolean
			createdAt: string
			updatedAt: string
		}>>(`/shift/shifts${includeArchived ? '?includeArchived=true' : ''}`, {
			method: 'GET'
		}, userEmail),

	createShift: (userEmail: string, data: {
		serviceDate: string
		startTime: string
		endTime: string
		breakDuration?: string
		serviceType?: string
		clientName: string
		clientLocation?: string
		clientType?: string
		clientEmail?: string
		clientPhoneNumber?: string
		clientContactPerson?: string
		clientContactPhone?: string
		teamMemberId?: string
		note?: string
	}) =>
		apiRequest<{
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
			teamMemberId: string
			teamMemberName: string
			note: string
		}>('/shift/shifts', {
			method: 'POST',
			body: JSON.stringify(data)
		}, userEmail),

	updateShift: (userEmail: string, shiftId: string, data: {
		serviceDate: string
		startTime: string
		endTime: string
		breakDuration?: string
		serviceType?: string
		clientName: string
		clientLocation?: string
		clientType?: string
		clientEmail?: string
		clientPhoneNumber?: string
		clientContactPerson?: string
		clientContactPhone?: string
		teamMemberId?: string
		note?: string
	}) =>
		apiRequest<{
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
			teamMemberId: string
			teamMemberName: string
			note: string
		}>(`/shift/shifts/${shiftId}`, {
			method: 'PATCH',
			body: JSON.stringify(data)
		}, userEmail),

	deleteShift: (userEmail: string, shiftId: string) =>
		apiRequest<{ success: boolean; archived: boolean }>(`/shift/shifts/${shiftId}`, {
			method: 'DELETE'
		}, userEmail),

	restoreShift: (userEmail: string, shiftId: string) =>
		apiRequest<{
			success: boolean
			archived: boolean
		}>(`/shift/shifts/${shiftId}/restore`, {
			method: 'PATCH'
		}, userEmail),

	// Clients
	getClients: (userEmail: string, includeArchived?: boolean) =>
		apiRequest<Array<{
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
		}>>(`/client/clients${includeArchived ? '?includeArchived=true' : ''}`, {
			method: 'GET'
		}, userEmail),

	createClient: (userEmail: string, data: {
		name: string
		address?: string
		suburb?: string
		state?: string
		postcode?: string
		clientType?: string
		phoneNumber?: string
		contactPerson?: string
		contactPhone?: string
		email?: string
		note?: string
	}) =>
		apiRequest<{
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
		}>('/client/clients', {
			method: 'POST',
			body: JSON.stringify(data)
		}, userEmail),

	updateClient: (userEmail: string, clientId: string, data: {
		name: string
		address?: string
		suburb?: string
		state?: string
		postcode?: string
		clientType?: string
		phoneNumber?: string
		contactPerson?: string
		contactPhone?: string
		email?: string
		note?: string
		active?: boolean
	}) =>
		apiRequest<{
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
		}>(`/client/clients/${clientId}`, {
			method: 'PATCH',
			body: JSON.stringify(data)
		}, userEmail),

	deleteClient: (userEmail: string, clientId: string) =>
		apiRequest<{ success: boolean }>(`/client/clients/${clientId}`, {
			method: 'DELETE'
		}, userEmail),

	toggleClientActive: (userEmail: string, clientId: string) =>
		apiRequest<{
			id: string
			active: boolean
		}>(`/client/clients/${clientId}/toggle-active`, {
			method: 'PATCH'
		}, userEmail),

	restoreClient: (userEmail: string, clientId: string) =>
		apiRequest<{
			id: string
			archived: boolean
		}>(`/client/clients/${clientId}/restore`, {
			method: 'PATCH'
		}, userEmail)
}


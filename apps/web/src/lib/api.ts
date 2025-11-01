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
			
			let errorData: any
			try {
				errorData = await response.json()
				console.error('API Error Response:', JSON.stringify(errorData, null, 2))
				console.error('Error Status:', response.status)
			} catch (e) {
				console.error('Failed to parse error response as JSON:', e)
				errorData = { message: `HTTP ${response.status}: ${response.statusText}` }
			}
			
			// NestJS returns errors with 'message' field containing the actual error message
			// 'error' field contains the status text like "Bad Request"
			// The message might be a string or array of strings
			// When BadRequestException is thrown with an object, it includes 'message' and 'errors' fields
			let errorMessage = errorData.message
			if (Array.isArray(errorMessage)) {
				errorMessage = errorMessage.join(', ')
			}
			// If there are individual errors in the response, append them
			if (errorData.errors && Array.isArray(errorData.errors) && errorData.errors.length > 0) {
				errorMessage = errorMessage ? `${errorMessage}. Details: ${errorData.errors.join(', ')}` : errorData.errors.join(', ')
			}
			errorMessage = errorMessage || errorData.error || `HTTP error! status: ${response.status}`
			console.error('Extracted error message:', errorMessage)
			console.error('Full error data:', errorData)
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

	// Staff Members
		getStaffMembers: (userEmail: string, includeArchived?: boolean) =>
		apiRequest<Array<{
			id: string
			name: string
			email: string
			phone: string
			idType: string
			idTypeId: string
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

	createStaffMember: (userEmail: string, data: { name: string; email: string; phone?: string; idType?: string; idNumber?: string; address?: string; suburb?: string; state?: string; postcode?: string }) =>
		apiRequest<{
			id: string
			name: string
			email: string
			phone: string
			idType: string
			idTypeId: string
			idNumber: string
			address: string
			suburb: string
			state: string
			postcode: string
		}>('/team/members', {
			method: 'POST',
			body: JSON.stringify(data)
		}, userEmail),

	updateStaffMember: (userEmail: string, memberId: string, data: { name: string; email: string; phone?: string; idType?: string; idNumber?: string; address?: string; suburb?: string; state?: string; postcode?: string }) =>
		apiRequest<{
			id: string
			name: string
			email: string
			phone: string
			idType: string
			idTypeId: string
			idNumber: string
			address: string
			suburb: string
			state: string
			postcode: string
		}>(`/team/members/${memberId}`, {
			method: 'PATCH',
			body: JSON.stringify(data)
		}, userEmail),

	deleteStaffMember: (userEmail: string, memberId: string) =>
		apiRequest<{ success: boolean; archived: boolean }>(`/team/members/${memberId}`, {
			method: 'DELETE'
		}, userEmail),

	restoreStaffMember: (userEmail: string, memberId: string) =>
		apiRequest<{
			id: string
			archived: boolean
		}>(`/team/members/${memberId}/restore`, {
			method: 'PATCH'
		}, userEmail),

	toggleStaffMemberActive: (userEmail: string, memberId: string) =>
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
			clientTypeId: string
			clientEmail: string
			clientPhoneNumber: string
			clientContactPerson: string
			clientContactPhone: string
			staffMemberId: string
			staffMemberName: string
			notifiedStaffMemberIds?: string[]
			staffMemberNames?: string[]
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
		clientId: string
		staffMemberId?: string
		notifiedStaffMemberIds?: string[]
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
			clientTypeId: string
			clientEmail: string
			clientPhoneNumber: string
			clientContactPerson: string
			clientContactPhone: string
			staffMemberId: string
			staffMemberName: string
			note: string
		}>('/shift/shifts', {
			method: 'POST',
			body: JSON.stringify(data)
		}, userEmail),

	updateShift: (userEmail: string, shiftId: string, data: {
		serviceDate?: string
		startTime?: string
		endTime?: string
		breakDuration?: string
		serviceType?: string
		clientName?: string
		clientLocation?: string
		clientTypeId?: string
		clientEmail?: string
		clientPhoneNumber?: string
		clientContactPerson?: string
		clientContactPhone?: string
		staffMemberId?: string
		notifiedStaffMemberIds?: string[]
		status?: string
		note?: string
	}) =>
		apiRequest<{
			id: string
			serviceDate: string
			startTime: string
			endTime: string
			breakDuration: string
			serviceType: string
			clientId: string
			clientName: string
			clientLocation: string
			clientType: string
			clientEmail: string
			clientPhoneNumber: string
			clientContactPerson: string
			clientContactPhone: string
			staffMemberId: string
			staffMemberName: string
			notifiedStaffMemberIds?: string[]
			staffMemberNames?: string[]
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

	permanentlyDeleteShift: (userEmail: string, shiftId: string) =>
		apiRequest<{
			success: boolean
			deleted: boolean
		}>(`/shift/shifts/${shiftId}/permanent`, {
			method: 'DELETE'
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
			clientTypeId: string
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
		clientTypeId?: string
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
			clientTypeId: string
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
		clientTypeId?: string
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
			clientTypeId: string
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
		}, userEmail),

	permanentlyDeleteClient: (userEmail: string, clientId: string) =>
		apiRequest<{
			success: boolean
			deleted: boolean
		}>(`/client/clients/${clientId}/permanent`, {
			method: 'DELETE'
		}, userEmail),

	permanentlyDeleteStaffMember: (userEmail: string, memberId: string) =>
		apiRequest<{
			success: boolean
			deleted: boolean
		}>(`/team/members/${memberId}/permanent`, {
			method: 'DELETE'
		}, userEmail),

	// ID Types
	getIdTypes: () =>
		apiRequest<Array<{
			id: string
			name: string
			order: number
		}>>('/id-types', {
			method: 'GET'
		}),

	// Client Types
	getClientTypes: () =>
		apiRequest<Array<{
			id: string
			name: string
			order: number
		}>>('/client-types', {
			method: 'GET'
		})
}


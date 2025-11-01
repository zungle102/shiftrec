import { z } from 'zod'

export const createClientSchema = z.object({
	name: z.string().min(1, 'Client name is required').max(200, 'Client name is too long'),
	address: z.string().max(200).optional().or(z.literal('')),
	suburb: z.string().max(100).optional().or(z.literal('')),
	state: z.string().max(50).optional().or(z.literal('')),
	postcode: z.string().max(10).optional().or(z.literal('')),
	clientTypeId: z.string().max(50).optional().or(z.literal('')),
	phoneNumber: z.string().max(20).optional().or(z.literal('')),
	contactPerson: z.string().max(100).optional().or(z.literal('')),
	contactPhone: z.string().max(20).optional().or(z.literal('')),
	email: z.string().email('Invalid email address').max(200).optional().or(z.literal('')),
	note: z.string().max(1000).optional().or(z.literal('')),
	active: z.boolean().optional().default(true)
})

export const updateClientSchema = z.object({
	name: z.string().min(1, 'Client name is required').max(200, 'Client name is too long'),
	address: z.string().max(200).optional().or(z.literal('')),
	suburb: z.string().max(100).optional().or(z.literal('')),
	state: z.string().max(50).optional().or(z.literal('')),
	postcode: z.string().max(10).optional().or(z.literal('')),
	clientTypeId: z.string().max(50).optional().or(z.literal('')),
	phoneNumber: z.string().max(20).optional().or(z.literal('')),
	contactPerson: z.string().max(100).optional().or(z.literal('')),
	contactPhone: z.string().max(20).optional().or(z.literal('')),
	email: z.string().email('Invalid email address').max(200).optional().or(z.literal('')),
	note: z.string().max(1000).optional().or(z.literal('')),
	active: z.boolean().optional()
})

export class CreateClientDto {
	name!: string
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
}

export class UpdateClientDto {
	name!: string
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
}


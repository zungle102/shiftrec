import { z } from 'zod'

export const createStaffMemberSchema = z.object({
	name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
	email: z.string().email('Invalid email address').max(200),
	phone: z.string().max(20).optional().or(z.literal('')),
	idTypeId: z.string().max(50).optional().or(z.literal('')),
	idNumber: z.string().max(100).optional().or(z.literal('')),
	address: z.string().max(200).optional().or(z.literal('')),
	suburb: z.string().max(100).optional().or(z.literal('')),
	state: z.string().max(50).optional().or(z.literal('')),
	postcode: z.string().max(10).optional().or(z.literal(''))
})

export const updateStaffMemberSchema = z.object({
	name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
	email: z.string().email('Invalid email address').max(200),
	phone: z.string().max(20).optional().or(z.literal('')),
	idTypeId: z.string().max(50).optional().or(z.literal('')),
	idNumber: z.string().max(100).optional().or(z.literal('')),
	address: z.string().max(200).optional().or(z.literal('')),
	suburb: z.string().max(100).optional().or(z.literal('')),
	state: z.string().max(50).optional().or(z.literal('')),
	postcode: z.string().max(10).optional().or(z.literal(''))
})

export class CreateStaffMemberDto {
	name!: string
	email!: string
	phone?: string
	idTypeId?: string
	idNumber?: string
	address?: string
	suburb?: string
	state?: string
	postcode?: string
}

export class UpdateStaffMemberDto {
	name!: string
	email!: string
	phone?: string
	idTypeId?: string
	idNumber?: string
	address?: string
	suburb?: string
	state?: string
	postcode?: string
}


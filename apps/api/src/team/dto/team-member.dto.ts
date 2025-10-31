import { z } from 'zod'

export const createTeamMemberSchema = z.object({
	name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
	email: z.string().email('Invalid email address').max(200),
	phone: z.string().max(20).optional().or(z.literal('')),
	idType: z.string().max(50).optional().or(z.literal('')),
	idNumber: z.string().max(100).optional().or(z.literal('')),
	address: z.string().max(200).optional().or(z.literal('')),
	suburb: z.string().max(100).optional().or(z.literal('')),
	state: z.string().max(50).optional().or(z.literal('')),
	postcode: z.string().max(10).optional().or(z.literal(''))
})

export const updateTeamMemberSchema = z.object({
	name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
	email: z.string().email('Invalid email address').max(200),
	phone: z.string().max(20).optional().or(z.literal('')),
	idType: z.string().max(50).optional().or(z.literal('')),
	idNumber: z.string().max(100).optional().or(z.literal('')),
	address: z.string().max(200).optional().or(z.literal('')),
	suburb: z.string().max(100).optional().or(z.literal('')),
	state: z.string().max(50).optional().or(z.literal('')),
	postcode: z.string().max(10).optional().or(z.literal(''))
})

export class CreateTeamMemberDto {
	name!: string
	email!: string
	phone?: string
	idType?: string
	idNumber?: string
	address?: string
	suburb?: string
	state?: string
	postcode?: string
}

export class UpdateTeamMemberDto {
	name!: string
	email!: string
	phone?: string
	idType?: string
	idNumber?: string
	address?: string
	suburb?: string
	state?: string
	postcode?: string
}


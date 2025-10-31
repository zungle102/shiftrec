import { z } from 'zod'

export const updateProfileSchema = z.object({
	name: z.string().min(1).max(100),
	businessName: z.string().max(200).optional().or(z.literal('')),
	streetAddress: z.string().max(200).optional().or(z.literal('')),
	suburb: z.string().max(100).optional().or(z.literal('')),
	state: z.string().max(50).optional().or(z.literal('')),
	phoneNumber: z.string().max(20).optional().or(z.literal('')),
	businessWebsite: z.string().url().max(200).optional().or(z.literal('')),
	businessABN: z.string().max(11).regex(/^\d{11}$|^$/).optional().or(z.literal(''))
})

export class UpdateProfileDto {
	name!: string
	businessName?: string
	streetAddress?: string
	suburb?: string
	state?: string
	phoneNumber?: string
	businessWebsite?: string
	businessABN?: string
}


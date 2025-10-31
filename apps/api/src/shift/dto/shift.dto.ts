import { z } from 'zod'

const shiftStatusEnum = z.enum([
	'Planned',
	'Published',
	'Assigned',
	'Confirmed',
	'Declined',
	'In Progress',
	'Completed',
	'Missed',
	'Canceled',
	'Timesheet Submitted',
	'Approved'
])

export const createShiftSchema = z.object({
	serviceDate: z.string().min(1, 'Service date is required'),
	startTime: z.string().min(1, 'Start time is required'),
	endTime: z.string().min(1, 'End time is required'),
	breakDuration: z.string().optional().or(z.literal('')).transform((val) => val === '' ? '0' : val),
	serviceType: z.string().max(100).optional().or(z.literal('')),
	clientName: z.string().min(1, 'Client name is required').max(200, 'Client name is too long'),
	clientLocation: z.string().max(200).optional().or(z.literal('')),
	clientType: z.string().max(50).optional().or(z.literal('')),
	clientEmail: z.string().email('Invalid email address').max(200).optional().or(z.literal('')),
	clientPhoneNumber: z.string().max(20).optional().or(z.literal('')),
	clientContactPerson: z.string().max(100).optional().or(z.literal('')),
	clientContactPhone: z.string().max(20).optional().or(z.literal('')),
	teamMemberId: z.string().max(100).optional().or(z.literal('')),
	status: shiftStatusEnum.optional().default('Planned'),
	note: z.string().max(1000).optional().or(z.literal(''))
})

export const updateShiftSchema = z.object({
	serviceDate: z.string().min(1, 'Service date is required'),
	startTime: z.string().min(1, 'Start time is required'),
	endTime: z.string().min(1, 'End time is required'),
	breakDuration: z.string().optional().or(z.literal('')).transform((val) => val === '' ? '0' : val),
	serviceType: z.string().max(100).optional().or(z.literal('')),
	clientName: z.string().min(1, 'Client name is required').max(200, 'Client name is too long'),
	clientLocation: z.string().max(200).optional().or(z.literal('')),
	clientType: z.string().max(50).optional().or(z.literal('')),
	clientEmail: z.string().email('Invalid email address').max(200).optional().or(z.literal('')),
	clientPhoneNumber: z.string().max(20).optional().or(z.literal('')),
	clientContactPerson: z.string().max(100).optional().or(z.literal('')),
	clientContactPhone: z.string().max(20).optional().or(z.literal('')),
	teamMemberId: z.string().max(100).optional().or(z.literal('')),
	status: shiftStatusEnum.optional(),
	note: z.string().max(1000).optional().or(z.literal(''))
})

export class CreateShiftDto {
	serviceDate!: string
	startTime!: string
	endTime!: string
	breakDuration?: string
	serviceType?: string
	clientName!: string
	clientLocation?: string
	clientType?: string
	clientEmail?: string
	clientPhoneNumber?: string
	clientContactPerson?: string
	clientContactPhone?: string
	teamMemberId?: string
	status?: 'Planned' | 'Published' | 'Assigned' | 'Confirmed' | 'Declined' | 'In Progress' | 'Completed' | 'Missed' | 'Canceled' | 'Timesheet Submitted' | 'Approved'
	note?: string
}

export class UpdateShiftDto {
	serviceDate!: string
	startTime!: string
	endTime!: string
	breakDuration?: string
	serviceType?: string
	clientName!: string
	clientLocation?: string
	clientType?: string
	clientEmail?: string
	clientPhoneNumber?: string
	clientContactPerson?: string
	clientContactPhone?: string
	teamMemberId?: string
	status?: 'Planned' | 'Published' | 'Assigned' | 'Confirmed' | 'Declined' | 'In Progress' | 'Completed' | 'Missed' | 'Canceled' | 'Timesheet Submitted' | 'Approved'
	note?: string
}


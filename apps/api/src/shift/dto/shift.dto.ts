import { z } from 'zod'

const shiftStatusEnum = z.enum([
	'Drafted',
	'Pending',
	'Assigned',
	'Confirmed',
	'Declined',
	'In Progress',
	'Completed',
	'Missed',
	'Canceled',
	'Timesheet Submitted',
	'Timesheet Approved'
])

export const createShiftSchema = z.object({
	serviceDate: z.string().min(1, 'Service date is required'),
	startTime: z.string().min(1, 'Start time is required'),
	endTime: z.string().min(1, 'End time is required'),
	breakDuration: z.string().optional().or(z.literal('')).transform((val) => val === '' ? '0' : val),
	serviceType: z.string().max(100).optional().or(z.literal('')),
	clientId: z.string().min(1, 'Client ID is required').max(100),
	staffMemberId: z.string().max(100).optional().or(z.literal('')),
	notifiedStaffMemberIds: z.array(z.string().max(100)).optional(),
	status: shiftStatusEnum.optional().default('Drafted'),
	note: z.string().max(1000).optional().or(z.literal(''))
})

export const updateShiftSchema = z.object({
	serviceDate: z.string().min(1, 'Service date is required').optional(),
	startTime: z.string().min(1, 'Start time is required').optional(),
	endTime: z.string().min(1, 'End time is required').optional(),
	breakDuration: z.string().optional().or(z.literal('')).transform((val) => val === '' ? '0' : val),
	serviceType: z.string().max(100).optional().or(z.literal('')),
	clientId: z.string().max(100).optional().or(z.literal('')),
	staffMemberId: z.string().max(100).optional().or(z.literal('')),
	notifiedStaffMemberIds: z.array(z.string().max(100)).optional(),
	status: shiftStatusEnum.optional(),
	note: z.string().max(1000).optional().or(z.literal(''))
})

export class CreateShiftDto {
	serviceDate!: string
	startTime!: string
	endTime!: string
	breakDuration?: string
	serviceType?: string
	clientId!: string
	staffMemberId?: string
	notifiedStaffMemberIds?: string[]
	status?: 'Drafted' | 'Pending' | 'Assigned' | 'Confirmed' | 'Declined' | 'In Progress' | 'Completed' | 'Missed' | 'Canceled' | 'Timesheet Submitted' | 'Timesheet Approved'
	note?: string
}

export class UpdateShiftDto {
	serviceDate!: string
	startTime!: string
	endTime!: string
	breakDuration?: string
	serviceType?: string
	clientId?: string
	staffMemberId?: string
	notifiedStaffMemberIds?: string[]
	status?: 'Drafted' | 'Pending' | 'Assigned' | 'Confirmed' | 'Declined' | 'In Progress' | 'Completed' | 'Missed' | 'Canceled' | 'Timesheet Submitted' | 'Timesheet Approved'
	note?: string
}


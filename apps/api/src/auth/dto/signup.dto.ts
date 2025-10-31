import { z } from 'zod'

export const signupSchema = z.object({
	name: z.string().min(1).max(100),
	email: z.string().email(),
	password: z.string().min(8).max(128)
})

export class SignupDto {
	name!: string
	email!: string
	password!: string
}


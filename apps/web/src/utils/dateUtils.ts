/**
 * Date utility functions for calendar operations
 */

export function parseDateTime(dateStr: string, timeStr: string): Date {
	// dateStr format: YYYY-MM-DD, timeStr format: HH:mm
	const [year, month, day] = dateStr.split('-').map(Number)
	const [hour, minute] = timeStr.split(':').map(Number)
	return new Date(year, month - 1, day, hour, minute)
}

export function formatDate(date: Date, format: string = 'YYYY-MM-DD'): string {
	const year = date.getFullYear()
	const month = String(date.getMonth() + 1).padStart(2, '0')
	const day = String(date.getDate()).padStart(2, '0')
	const hours = String(date.getHours()).padStart(2, '0')
	const minutes = String(date.getMinutes()).padStart(2, '0')

	switch (format) {
		case 'YYYY-MM-DD':
			return `${year}-${month}-${day}`
		case 'HH:mm':
			return `${hours}:${minutes}`
		case 'MMM D':
			return `${getMonthName(date.getMonth())} ${date.getDate()}`
		case 'MMMM YYYY':
			return `${getMonthName(date.getMonth(), true)} ${year}`
		case 'MMMM D, YYYY':
			return `${getMonthName(date.getMonth(), true)} ${date.getDate()}, ${year}`
		case 'dddd, MMMM D, YYYY':
			return `${getDayName(date.getDay())}, ${getMonthName(date.getMonth(), true)} ${date.getDate()}, ${year}`
		default:
			return `${year}-${month}-${day}`
	}
}

export function getMonthName(monthIndex: number, full: boolean = false): string {
	const months = full
		? ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
		: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
	return months[monthIndex]
}

export function getDayName(dayIndex: number): string {
	const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
	return days[dayIndex]
}

export function getShortDayName(dayIndex: number): string {
	const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
	return days[dayIndex]
}

export function startOfMonth(date: Date): Date {
	return new Date(date.getFullYear(), date.getMonth(), 1)
}

export function endOfMonth(date: Date): Date {
	return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59)
}

export function startOfWeek(date: Date, startDay: number = 0): Date {
	const d = new Date(date)
	const day = d.getDay()
	const diff = d.getDate() - day + (day === 0 ? -6 : startDay) // Adjust when day is Sunday
	return new Date(d.setDate(diff))
}

export function endOfWeek(date: Date, startDay: number = 0): Date {
	const start = startOfWeek(date, startDay)
	const end = new Date(start)
	end.setDate(end.getDate() + 6)
	end.setHours(23, 59, 59)
	return end
}

export function startOfDay(date: Date): Date {
	const d = new Date(date)
	d.setHours(0, 0, 0, 0)
	return d
}

export function endOfDay(date: Date): Date {
	const d = new Date(date)
	d.setHours(23, 59, 59, 999)
	return d
}

export function isSameDay(date1: Date, date2: Date): boolean {
	return date1.getFullYear() === date2.getFullYear() &&
		date1.getMonth() === date2.getMonth() &&
		date1.getDate() === date2.getDate()
}

export function isSameMonth(date1: Date, date2: Date): boolean {
	return date1.getFullYear() === date2.getFullYear() &&
		date1.getMonth() === date2.getMonth()
}

export function addDays(date: Date, days: number): Date {
	const result = new Date(date)
	result.setDate(result.getDate() + days)
	return result
}

export function addMonths(date: Date, months: number): Date {
	const result = new Date(date)
	result.setMonth(result.getMonth() + months)
	return result
}

export function getDaysInMonth(date: Date): Date[] {
	const year = date.getFullYear()
	const month = date.getMonth()
	const firstDay = new Date(year, month, 1)
	const lastDay = new Date(year, month + 1, 0)
	const days: Date[] = []

	// Start from the first day of the week containing the first day of the month
	const startDate = startOfWeek(firstDay)
	const endDate = endOfWeek(lastDay)

	let currentDate = new Date(startDate)
	while (currentDate <= endDate) {
		days.push(new Date(currentDate))
		currentDate = addDays(currentDate, 1)
	}

	return days
}

export function getWeekDays(date: Date): Date[] {
	const start = startOfWeek(date)
	const days: Date[] = []
	for (let i = 0; i < 7; i++) {
		days.push(addDays(start, i))
	}
	return days
}


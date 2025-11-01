'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect, useMemo } from 'react'
import { DashboardSidebar } from '../../../components/DashboardSidebar'
import {
	parseDateTime,
	formatDate,
	getShortDayName,
	startOfMonth,
	endOfMonth,
	startOfWeek,
	endOfWeek,
	startOfDay,
	endOfDay,
	isSameDay,
	isSameMonth,
	getDaysInMonth,
	getWeekDays,
	addDays,
	addMonths
} from '../../../utils/dateUtils'

// Calendar component
interface CalendarEvent {
	id: string
	title: string
	start: Date
	end: Date
	status: string
	clientName: string
	staffMemberName?: string
	serviceType: string
	note: string
}

interface Shift {
	id: string
	serviceDate: string
	startTime: string
	endTime: string
	breakDuration: string
	serviceType: string
	clientName: string
	staffMemberName?: string
	status: string
	note: string
	archived?: boolean
}

type ViewType = 'month' | 'week' | 'day'

export default function CalendarPage() {
	const { data: session } = useSession()
	const router = useRouter()
	const [shifts, setShifts] = useState<Shift[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [currentDate, setCurrentDate] = useState(new Date())
	const [view, setView] = useState<ViewType>('month')

	// Fetch shifts from API
	const fetchShifts = async () => {
		if (!session?.user?.email) return

		setLoading(true)
		setError(null)
		try {
			const { api } = await import('../../../lib/api')
			const data = await api.getShifts(session.user.email)
			// Filter out archived shifts
			setShifts(data.filter(shift => shift.archived !== true))
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to load shifts')
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		if (session?.user?.email) {
			fetchShifts()
		}
	}, [session?.user?.email])

	// Convert shifts to calendar events
	const events = useMemo(() => {
		return shifts.map(shift => {
			// Parse date and time using utility function
			const startDateTime = parseDateTime(shift.serviceDate, shift.startTime)
			const endDateTime = parseDateTime(shift.serviceDate, shift.endTime)

			// Create event title
			const title = `${shift.clientName}${shift.staffMemberName ? ` - ${shift.staffMemberName}` : ''}`

			return {
				id: shift.id,
				title,
				start: startDateTime,
				end: endDateTime,
				status: shift.status,
				clientName: shift.clientName,
				staffMemberName: shift.staffMemberName,
				serviceType: shift.serviceType,
				note: shift.note
			}
		})
	}, [shifts])

	// Get status color
	const getStatusColor = (status: string) => {
		switch (status) {
			case 'Drafted':
				return 'bg-slate-100 text-slate-800 border-slate-300'
			case 'Pending':
				return 'bg-blue-100 text-blue-800 border-blue-300'
			case 'Assigned':
				return 'bg-purple-100 text-purple-800 border-purple-300'
			case 'Confirmed':
				return 'bg-green-100 text-green-800 border-green-300'
			case 'Declined':
				return 'bg-red-100 text-red-800 border-red-300'
			case 'In Progress':
				return 'bg-yellow-100 text-yellow-800 border-yellow-300'
			case 'Completed':
				return 'bg-emerald-100 text-emerald-800 border-emerald-300'
			case 'Missed':
				return 'bg-orange-100 text-orange-800 border-orange-300'
			case 'Canceled':
				return 'bg-gray-100 text-gray-800 border-gray-300'
			case 'Timesheet Submitted':
				return 'bg-indigo-100 text-indigo-800 border-indigo-300'
			case 'Timesheet Approved':
				return 'bg-teal-100 text-teal-800 border-teal-300'
			default:
				return 'bg-slate-100 text-slate-800 border-slate-300'
		}
	}

	// Navigation functions
	const navigateDate = (direction: 'prev' | 'next') => {
		setCurrentDate(prev => {
			if (view === 'month') {
				return addMonths(prev, direction === 'next' ? 1 : -1)
			} else if (view === 'week') {
				return addDays(prev, direction === 'next' ? 7 : -7)
			} else {
				return addDays(prev, direction === 'next' ? 1 : -1)
			}
		})
	}

	const goToToday = () => {
		setCurrentDate(new Date())
	}

	// Get events for current view
	const getEventsForView = () => {
		if (view === 'month') {
			const start = startOfMonth(currentDate)
			const end = endOfMonth(currentDate)
			return events.filter(event => event.start >= start && event.start <= end)
		} else if (view === 'week') {
			const start = startOfWeek(currentDate)
			const end = endOfWeek(currentDate)
			return events.filter(event => event.start >= start && event.start <= end)
		} else {
			const start = startOfDay(currentDate)
			const end = endOfDay(currentDate)
			return events.filter(event => event.start >= start && event.start <= end)
		}
	}

	const viewEvents = getEventsForView()
	const today = new Date()

	// Render month view
	const renderMonthView = () => {
		const days = getDaysInMonth(currentDate)
		const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
		const weeks = []
		for (let i = 0; i < days.length; i += 7) {
			weeks.push(days.slice(i, i + 7))
		}

		return (
			<div className="bg-white rounded-lg shadow-sm border border-slate-200">
				{/* Week day headers */}
				<div className="grid grid-cols-7 border-b border-slate-200">
					{weekDays.map(day => (
						<div key={day} className="px-3 py-2 text-sm font-semibold text-slate-700 bg-slate-50 text-center border-r border-slate-200 last:border-r-0">
							{day}
						</div>
					))}
				</div>

				{/* Calendar grid */}
				<div className="divide-y divide-slate-200">
					{weeks.map((week, weekIndex) => (
						<div key={weekIndex} className="grid grid-cols-7 divide-x divide-slate-200">
							{week.map((day, dayIndex) => {
								const dayEvents = events.filter(event => isSameDay(event.start, day))
								const isCurrentMonth = isSameMonth(day, currentDate)
								const isTodayDate = isSameDay(day, today)

								return (
									<div
										key={dayIndex}
										className={`min-h-32 p-2 ${isCurrentMonth ? 'bg-white' : 'bg-slate-50'} ${isTodayDate ? 'ring-2 ring-blue-500' : ''}`}
									>
										<div className={`text-sm font-semibold mb-1 ${isCurrentMonth ? 'text-slate-900' : 'text-slate-400'} ${isTodayDate ? 'text-blue-600' : ''}`}>
											{day.getDate()}
										</div>
										<div className="space-y-1">
											{dayEvents.slice(0, 3).map(event => (
												<div
													key={event.id}
													onClick={() => router.push(`/dashboard/shifts`)}
													className={`text-xs px-2 py-1 rounded border cursor-pointer hover:shadow-md transition-all ${getStatusColor(event.status)}`}
													title={`${event.title} - ${event.status}`}
												>
													<div className="font-medium truncate">{event.clientName}</div>
													<div className="text-xs opacity-75">{formatDate(event.start, 'HH:mm')}</div>
												</div>
											))}
											{dayEvents.length > 3 && (
												<div className="text-xs text-slate-600 px-2 py-1">
													+{dayEvents.length - 3} more
												</div>
											)}
										</div>
									</div>
								)
							})}
						</div>
					))}
				</div>
			</div>
		)
	}

	// Render week view
	const renderWeekView = () => {
		const days = getWeekDays(currentDate)
		const hours = Array.from({ length: 24 }, (_, i) => i)

		return (
			<div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-x-auto">
				<div className="min-w-[1200px]">
					{/* Day headers */}
					<div className="grid grid-cols-8 border-b border-slate-200">
						<div className="px-3 py-2 text-sm font-semibold text-slate-700 bg-slate-50 border-r border-slate-200"></div>
						{days.map(day => {
							const isTodayDate = isSameDay(day, today)
							return (
								<div
									key={formatDate(day, 'YYYY-MM-DD')}
									className={`px-3 py-2 text-sm font-semibold text-center border-r border-slate-200 last:border-r-0 ${isTodayDate ? 'bg-blue-50 text-blue-700' : 'bg-slate-50 text-slate-700'}`}
								>
									<div>{getShortDayName(day.getDay())}</div>
									<div className="text-xs font-normal">{day.getDate()}</div>
								</div>
							)
						})}
					</div>

					{/* Time slots */}
					<div className="divide-y divide-slate-100">
						{hours.map(hour => (
							<div key={hour} className="grid grid-cols-8 border-b border-slate-100">
								<div className="px-3 py-2 text-xs text-slate-500 border-r border-slate-200">
									{hour.toString().padStart(2, '0')}:00
								</div>
								{days.map(day => {
									const dayEvents = events.filter(event => {
										const eventHour = event.start.getHours()
										return isSameDay(event.start, day) && eventHour === hour
									})

									return (
										<div key={`${formatDate(day, 'YYYY-MM-DD')}-${hour}`} className="min-h-16 p-1 border-r border-slate-100 last:border-r-0">
											{dayEvents.map(event => (
												<div
													key={event.id}
													onClick={() => router.push(`/dashboard/shifts`)}
													className={`text-xs px-2 py-1 rounded mb-1 border cursor-pointer hover:shadow-md transition-all ${getStatusColor(event.status)}`}
													title={`${event.title} - ${event.status}`}
												>
													<div className="font-medium truncate">{event.clientName}</div>
													<div className="text-xs opacity-75">
														{formatDate(event.start, 'HH:mm')} - {formatDate(event.end, 'HH:mm')}
													</div>
												</div>
											))}
										</div>
									)
								})}
							</div>
						))}
					</div>
				</div>
			</div>
		)
	}

	// Render day view
	const renderDayView = () => {
		const day = currentDate
		const hours = Array.from({ length: 24 }, (_, i) => i)

		return (
			<div className="bg-white rounded-lg shadow-sm border border-slate-200">
				{/* Day header */}
				<div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
					<div className="text-lg font-semibold text-slate-900">
						{formatDate(day, 'dddd, MMMM D, YYYY')}
					</div>
				</div>

				{/* Time slots */}
				<div className="divide-y divide-slate-100">
					{hours.map(hour => {
						const hourEvents = events.filter(event => {
							const eventHour = event.start.getHours()
							return isSameDay(event.start, day) && eventHour === hour
						})

						return (
							<div key={hour} className="grid grid-cols-12 border-b border-slate-100">
								<div className="col-span-2 px-4 py-3 text-sm text-slate-500 font-medium border-r border-slate-200">
									{hour.toString().padStart(2, '0')}:00
								</div>
								<div className="col-span-10 p-2">
									{hourEvents.length > 0 ? (
										<div className="space-y-2">
											{hourEvents.map(event => (
												<div
													key={event.id}
													onClick={() => router.push(`/dashboard/shifts`)}
													className={`p-3 rounded-lg border cursor-pointer hover:shadow-md transition-all ${getStatusColor(event.status)}`}
												>
													<div className="flex items-start justify-between mb-2">
														<div className="font-semibold text-slate-900">{event.clientName}</div>
														<div className="text-xs font-medium px-2 py-1 rounded">{event.status}</div>
													</div>
													{event.staffMemberName && (
														<div className="text-sm text-slate-600 mb-1">Staff: {event.staffMemberName}</div>
													)}
													<div className="text-sm text-slate-600">
														{formatDate(event.start, 'HH:mm')} - {formatDate(event.end, 'HH:mm')}
													</div>
													{event.serviceType && (
														<div className="text-xs text-slate-500 mt-1">Service: {event.serviceType}</div>
													)}
													{event.note && (
														<div className="text-xs text-slate-500 mt-1 italic">Note: {event.note}</div>
													)}
												</div>
											))}
										</div>
									) : (
										<div className="text-xs text-slate-400 py-2">No shifts</div>
									)}
								</div>
							</div>
						)
					})}
				</div>
			</div>
		)
	}

	if (!session) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-center">
					<p className="text-slate-600">Please sign in to view the calendar.</p>
				</div>
			</div>
		)
	}

	return (
		<div className="min-h-screen bg-slate-50">
			<div className="flex">
				<DashboardSidebar />
				<main className="flex-1 p-6">
					<div className="max-w-7xl mx-auto">
						{/* Header */}
						<div className="mb-6">
							<h1 className="text-3xl font-bold text-slate-900 mb-2">Calendar View</h1>
							<p className="text-slate-600">Visual overview of all shifts</p>
						</div>

						{/* View controls */}
						<div className="mb-6 bg-white rounded-lg shadow-sm border border-slate-200 p-4">
							<div className="flex items-center justify-between flex-wrap gap-4">
								{/* View type buttons */}
								<div className="flex items-center gap-2">
									<button
										onClick={() => setView('month')}
										className={`px-4 py-2 rounded-lg font-semibold transition-all ${
											view === 'month'
												? 'bg-blue-500 text-white shadow-md'
												: 'bg-slate-100 text-slate-700 hover:bg-slate-200'
										}`}
									>
										Month
									</button>
									<button
										onClick={() => setView('week')}
										className={`px-4 py-2 rounded-lg font-semibold transition-all ${
											view === 'week'
												? 'bg-blue-500 text-white shadow-md'
												: 'bg-slate-100 text-slate-700 hover:bg-slate-200'
										}`}
									>
										Week
									</button>
									<button
										onClick={() => setView('day')}
										className={`px-4 py-2 rounded-lg font-semibold transition-all ${
											view === 'day'
												? 'bg-blue-500 text-white shadow-md'
												: 'bg-slate-100 text-slate-700 hover:bg-slate-200'
										}`}
									>
										Day
									</button>
								</div>

								{/* Navigation */}
								<div className="flex items-center gap-4">
									<button
										onClick={() => navigateDate('prev')}
										className="p-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all"
										aria-label="Previous"
									>
										<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
										</svg>
									</button>
									<button
										onClick={goToToday}
										className="px-4 py-2 rounded-lg bg-blue-500 text-white font-semibold hover:bg-blue-600 transition-all"
									>
										Today
									</button>
									<button
										onClick={() => navigateDate('next')}
										className="p-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all"
										aria-label="Next"
									>
										<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
										</svg>
									</button>
									<div className="text-lg font-semibold text-slate-900 min-w-[200px] text-center">
										{view === 'month' && formatDate(currentDate, 'MMMM YYYY')}
										{view === 'week' && `${formatDate(startOfWeek(currentDate), 'MMM D')} - ${formatDate(endOfWeek(currentDate), 'MMM D, YYYY')}`}
										{view === 'day' && formatDate(currentDate, 'MMMM D, YYYY')}
									</div>
								</div>
							</div>
						</div>

						{/* Calendar content */}
						{error && (
							<div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
								{error}
							</div>
						)}

						{loading ? (
							<div className="bg-white rounded-lg shadow-sm border border-slate-200 p-12 text-center">
								<div className="text-slate-600">Loading shifts...</div>
							</div>
						) : (
							<>
								{view === 'month' && renderMonthView()}
								{view === 'week' && renderWeekView()}
								{view === 'day' && renderDayView()}
							</>
						)}
					</div>
				</main>
			</div>
		</div>
	)
}

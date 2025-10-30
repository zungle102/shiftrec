import { auth } from '../../lib/auth'

export default async function DashboardPage() {
	const session = await auth()
	if (!session) {
		// In App Router, we can throw a redirect by returning notFound or use next/navigation
		// but since this is a server component, use a simple redirect helper
		const { redirect } = await import('next/navigation')
		redirect('/signin')
	}

	return (
		<main className="mx-auto max-w-2xl p-6">
			<h1 className="text-2xl font-semibold mb-2">Dashboard</h1>
			<p className="text-gray-700">Welcome, {session.user?.email}</p>
		</main>
	)
}



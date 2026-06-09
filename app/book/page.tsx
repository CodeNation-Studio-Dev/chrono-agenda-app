import { redirect } from 'next/navigation'

// The booking page is now business-scoped: /[businessSlug]/book
// This route exists only for backwards compatibility.
export default function BookPage() {
  redirect('/')
}

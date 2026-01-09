import './globals.css'
import { Toaster } from '@/components/ui/sonner'

export const metadata = {
  title: 'ExpertBridge - Find Verified Professionals',
  description: 'Global discovery marketplace connecting clients with verified professionals across 20+ categories',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background font-sans antialiased">
        {children}
        <Toaster position="top-right" />
      </body>
    </html>
  )
}
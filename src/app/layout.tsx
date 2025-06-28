import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Sui RPC Monitor',
  description: 'Real-time monitoring tool for Sui blockchain RPC nodes',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="font-sans">{children}</body>
    </html>
  )
}
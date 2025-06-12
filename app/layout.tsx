import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'HL7 Message Viewer',
  description: 'Advanced parsing and analysis tool for HL7 2.x messages',
  generator: 'v0.dev',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  )
}

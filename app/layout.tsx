import type { Metadata } from 'next'
import '../styles/globals.css'
import { ThemeProvider } from "@/components/theme-provider"
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'HL7 Message Viewer',
  description: 'A comprehensive tool for viewing and analyzing HL7 messages',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider 
          attribute="class" 
          defaultTheme="system" 
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Header from './components/Header'
import Footer from './components/Footer'
import FloatingContact from './components/FloatingContact' // Sahi relative path

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'India Tour Operators - Best Tour Packages, Cabs & Hotels',
  description: 'Book Cabs, Tours and Hotels directly from verified vendors across India',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} flex flex-col min-h-screen bg-gray-50 relative`}>
        {/* Header sabse upar rahega */}
        <Header />
        
        {/* Main Content */}
        <main className="flex-grow">
          {children}
        </main>
        
        {/* Footer sabse neeche rahega */}
        <Footer />

        {/* Floating Contact Button (WhatsApp & Helplines) */}
        <FloatingContact />
      </body>
    </html>
  )
}
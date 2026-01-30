import { Toaster } from 'sonner';
import StreamClientProvider from '@/providers/StreamClientProvider';
import { UserProvider } from '@/providers/UserProvider';
import { Inter } from "next/font/google";

import './globals.css'

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'HomeGuru | Os.',
  description: 'Professional video conferencing platform for education',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} h-screen w-screen overflow-hidden flex flex-col selection:bg-white/20 bg-black text-white`}>
        <UserProvider>
          <StreamClientProvider>
            {children}
            <Toaster theme="dark" position="top-center" />
          </StreamClientProvider>
        </UserProvider>
      </body>
    </html>
  )
}
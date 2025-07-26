import './globals.css'

export const metadata = {
  title: 'Animodo Dashboard',
  description: 'Canvas dashboard application',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
} 
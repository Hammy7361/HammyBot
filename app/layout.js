import "./globals.css"

export const metadata = {
  title: "Discord Role Bot",
  description: "A Discord bot for managing roles",
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

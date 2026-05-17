import '../src/index.css'
import '../src/App.css'
import { AppShell } from '../src/components/AppShell.jsx'

export const metadata = {
  title: 'BalamWiFi',
  description: 'Direktori WiFi publik Bandar Lampung',
}

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  )
}

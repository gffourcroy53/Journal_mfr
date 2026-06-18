import './globals.css'

export const metadata = {
  title: 'Journal du formateur — MFR La Pignerie',
  description: 'Gestion pédagogique et suivi des heures',
}

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>
        {children}
      </body>
    </html>
  )
}

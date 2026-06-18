'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV = [
  { href: '/',              label: 'Tableau de bord' },
  { href: '/journal',       label: 'Journal'         },
  { href: '/previsionnel',  label: 'Prévisionnel'    },
  { href: '/statistiques',  label: 'Statistiques'    },
  { href: '/documents',     label: 'Documents'       },
  { href: '/travaux',       label: 'Travaux'         },
  { href: '/exports',       label: 'Exports'         },
]

export default function AppLayout({ children }) {
  const pathname = usePathname()
  const today = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  })

  return (
    <>
      <header className="topbar">
        <div className="topbar-title">
          📒 Journal du formateur — MFR La Pignerie
        </div>
        <div className="topbar-right">
          <span style={{ textTransform: 'capitalize' }}>{today}</span>
        </div>
      </header>

      <nav className="navbar">
        {NAV.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={`nav-item${pathname === href ? ' active' : ''}`}
          >
            {label}
          </Link>
        ))}
      </nav>

      <main className="page-body">
        {children}
      </main>
    </>
  )
}

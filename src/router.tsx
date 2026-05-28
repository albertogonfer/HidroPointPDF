import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import { Suspense, lazy } from 'react'

const IntakePage = lazy(() => import('./adapters/pdf-renaming/pages/IntakePage'))
const HistoryPage = lazy(() => import('./adapters/pdf-renaming/pages/HistoryPage'))
const SettingsPage = lazy(() => import('./adapters/pdf-renaming/pages/SettingsPage'))

export function AppRouter() {
  return (
    <BrowserRouter>
      <div className="flex min-h-svh flex-col">
        {/* Header */}
        <header className="sticky top-0 z-10 border-b border-purple-100 bg-white/80 backdrop-blur-sm">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-0">
            {/* Logo */}
            <div className="flex items-center gap-2.5 py-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-600 shadow-sm">
                <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <span className="text-sm font-semibold tracking-tight text-gray-900">HidroPoint<span className="text-purple-600">PDF</span></span>
            </div>

            {/* Nav */}
            <nav className="flex items-center gap-1">
              {[
                { to: '/', label: 'Rename', end: true },
                { to: '/history', label: 'History' },
                { to: '/settings', label: 'Settings' },
              ].map(({ to, label, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    [
                      'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-purple-50 text-purple-700'
                        : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800',
                    ].join(' ')
                  }
                >
                  {label}
                </NavLink>
              ))}
            </nav>
          </div>
        </header>

        {/* Page content */}
        <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-8">
          <Suspense
            fallback={
              <div className="flex items-center justify-center py-20 text-sm text-gray-400">
                Loading…
              </div>
            }
          >
            <Routes>
              <Route path="/" element={<IntakePage />} />
              <Route path="/history" element={<HistoryPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Routes>
          </Suspense>
        </main>

        {/* Footer */}
        <footer className="border-t border-gray-100 px-6 py-4 text-center text-xs text-gray-400">
          HidroPoint Barcelona — all data stays in your browser
        </footer>
      </div>
    </BrowserRouter>
  )
}

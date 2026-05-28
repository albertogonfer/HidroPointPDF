import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import { Suspense, lazy } from 'react'

const IntakePage = lazy(() => import('./adapters/pdf-renaming/pages/IntakePage'))
const HistoryPage = lazy(() => import('./adapters/pdf-renaming/pages/HistoryPage'))
const SettingsPage = lazy(() => import('./adapters/pdf-renaming/pages/SettingsPage'))

export function AppRouter() {
  return (
    <BrowserRouter>
      <nav className="flex gap-4 border-b border-gray-200 bg-white px-6 py-3 text-sm font-medium">
        <NavLink
          to="/"
          end
          className={({ isActive }) => (isActive ? 'text-blue-600' : 'text-gray-500 hover:text-gray-900')}
        >
          Rename
        </NavLink>
        <NavLink
          to="/history"
          className={({ isActive }) => (isActive ? 'text-blue-600' : 'text-gray-500 hover:text-gray-900')}
        >
          History
        </NavLink>
        <NavLink
          to="/settings"
          className={({ isActive }) => (isActive ? 'text-blue-600' : 'text-gray-500 hover:text-gray-900')}
        >
          Settings
        </NavLink>
      </nav>
      <main className="mx-auto max-w-5xl px-6 py-8">
        <Suspense fallback={<div className="text-sm text-gray-400">Loading…</div>}>
          <Routes>
            <Route path="/" element={<IntakePage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </Suspense>
      </main>
    </BrowserRouter>
  )
}

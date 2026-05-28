import { useEffect } from 'react'
import { AppRouter } from './router'
import { initDb } from './infrastructure/db/index'

function App() {
  useEffect(() => {
    initDb().catch((err) => console.error('DB init failed:', err))
  }, [])

  return <AppRouter />
}

export default App

import { HashRouter, Routes, Route } from 'react-router-dom'
import { AppHeader } from './components/AppHeader'
import { LandingPage } from './pages/LandingPage'
import { DashboardPage } from './pages/DashboardPage'
import { NewIssuePage } from './pages/NewIssuePage'
import { IssueTimelinePage } from './pages/IssueTimelinePage'

function App() {
  return (
    <HashRouter>
      <div className="app-shell">
        <AppHeader />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/issues" element={<DashboardPage />} />
          <Route path="/issues/new" element={<NewIssuePage />} />
          <Route path="/issues/:id" element={<IssueTimelinePage />} />
        </Routes>
      </div>
    </HashRouter>
  )
}

export default App

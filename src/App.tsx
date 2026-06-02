import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Home } from './pages/Home'
import { Decks } from './pages/Decks'
import { DeckNew } from './pages/DeckNew'
import { DeckEdit } from './pages/DeckEdit'
import { DeckDetail } from './pages/DeckDetail'
import { Study } from './pages/Study'
import { CardForm } from './pages/CardForm'
import { Settings } from './pages/Settings'

function routerBasename(): string | undefined {
  const base = import.meta.env.BASE_URL
  if (base === '/') return undefined
  return base.replace(/\/$/, '')
}

export default function App() {
  return (
    <BrowserRouter basename={routerBasename()}>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="decks" element={<Decks />} />
          <Route path="decks/new" element={<DeckNew />} />
          <Route path="decks/edit" element={<DeckEdit />} />
          <Route path="decks/:deckId/edit" element={<DeckEdit />} />
          <Route path="decks/:deckId" element={<DeckDetail />} />
          <Route path="study" element={<Study />} />
          <Route path="cards/new" element={<CardForm />} />
          <Route path="cards/:cardId/edit" element={<CardForm />} />
          <Route path="settings" element={<Settings />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

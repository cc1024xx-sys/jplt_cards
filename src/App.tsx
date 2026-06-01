import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Home } from './pages/Home'
import { Decks } from './pages/Decks'
import { DeckNew } from './pages/DeckNew'
import { DeckDetail } from './pages/DeckDetail'
import { Study } from './pages/Study'
import { CardForm } from './pages/CardForm'
import { Settings } from './pages/Settings'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="decks" element={<Decks />} />
          <Route path="decks/new" element={<DeckNew />} />
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

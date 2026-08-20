import { AnimatePresence } from 'framer-motion';
import { Route, Routes } from 'react-router-dom';
import { Background } from './components/Background';
import { HomePage } from './pages/HomePage';
import { GamePage } from './pages/GamePage';
import { ICallOnLandingPage } from './pages/ICallOnLandingPage';
export default function App() {
  return (
    <>
      <Background />
      <AnimatePresence mode="wait">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/i-call-on" element={<ICallOnLandingPage />} />
          <Route path="/room/:code" element={<GamePage />} />
        </Routes>
      </AnimatePresence>
    </>
  );
}

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import Login from './pages/Login';
import ProfilePage from './pages/ProfilePage';
import EventDetail from './pages/EventDetail';
import Rooms from './pages/Rooms';
import Admin from './pages/Admin';
import AdminEventDetail from './pages/AdminEventDetail';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-screen flex flex-col">
          <Navbar />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/event/:eventId" element={<EventDetail />} />
              <Route path="/rooms" element={<Rooms />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/admin/event/:eventId" element={<AdminEventDetail />} />
            </Routes>
          </main>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

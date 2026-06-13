import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { UnreadProvider } from './context/UnreadContext';
import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import Login from './pages/Login';
import ProfilePage from './pages/ProfilePage';
import EventDetail from './pages/EventDetail';
import Rooms from './pages/Rooms';
import MyEvents from './pages/MyEvents';
import Admin from './pages/Admin';
import AdminEventDetail from './pages/AdminEventDetail';
import AdminLogin from './pages/AdminLogin';
import AdminRooms from './pages/AdminRooms';
import AdminRegister from './pages/AdminRegister';
import AdminSubAdminDetail from './pages/AdminSubAdminDetail';
import AdminSubAdminPortal from './pages/AdminSubAdminPortal';

// Hide the public navbar on all /admin/* routes
function Layout({ children }) {
  const { pathname } = useLocation();
  const isAdminRoute = pathname.startsWith('/admin');
  return (
    <div className="min-h-screen flex flex-col">
      {!isAdminRoute && <Navbar />}
      <main className="flex-1">{children}</main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <UnreadProvider>
        <Layout>
          <Routes>
            {/* Public */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/event/:eventId" element={<EventDetail />} />
            <Route path="/rooms" element={<Rooms />} />
            <Route path="/my-events" element={<MyEvents />} />

            {/* Admin — completely separate, not linked from public UI */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/register" element={<AdminRegister />} />
            <Route path="/admin/sub-admin" element={<AdminSubAdminPortal />} />
            <Route path="/admin/dashboard" element={<Admin />} />
            <Route path="/admin/rooms" element={<AdminRooms />} />
            <Route path="/admin/event/:eventId" element={<AdminEventDetail />} />
            <Route path="/admin/sub-admin/:userId" element={<AdminSubAdminDetail />} />
          </Routes>
        </Layout>
        </UnreadProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

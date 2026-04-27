import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { BookingPage } from './pages/BookingPage';
import { MyBookingsPage } from './pages/MyBookingsPage';
import { AdminLayout } from './pages/admin/AdminLayout';
import { DashboardPage } from './pages/admin/DashboardPage';
import { UserProvider } from './contexts/UserContext';

function App() {
  return (
    <BrowserRouter>
      <UserProvider>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<BookingPage />} />
            <Route path="my-bookings" element={<MyBookingsPage />} />
            <Route path="admin" element={<AdminLayout />}>
              <Route index element={<DashboardPage />} />
            </Route>
          </Route>
        </Routes>
      </UserProvider>
    </BrowserRouter>
  );
}

export default App;

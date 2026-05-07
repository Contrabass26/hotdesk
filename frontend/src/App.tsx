import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { BookingPage } from './pages/BookingPage';
import { MyBookingsPage } from './pages/MyBookingsPage';
import { AdminLayout } from './pages/admin/AdminLayout';
import { DashboardPage } from './pages/admin/DashboardPage';
import { DeskManagementPage } from './pages/admin/DeskManagementPage';
import { BookingsPage } from './pages/admin/BookingsPage';
import { UsersPage } from './pages/admin/UsersPage';
import { UserProvider } from './contexts/UserContext';
import { FloorsPage } from "./pages/admin/FloorsPage.tsx";

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
              <Route path="desks" element={<DeskManagementPage />} />
              <Route path="bookings" element={<BookingsPage />} />
              <Route path="users" element={<UsersPage />} />
              <Route path="floors" element={<FloorsPage />} />
            </Route>
          </Route>
        </Routes>
      </UserProvider>
    </BrowserRouter>
  );
}

export default App;

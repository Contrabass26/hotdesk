import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { BookingPage } from './pages/BookingPage';
import { MyBookingsPage } from './pages/MyBookingsPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<BookingPage />} />
          <Route path="my-bookings" element={<MyBookingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;

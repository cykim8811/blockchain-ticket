import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { BrowserRouter, Routes, Route } from "react-router";
import { AuthProvider } from './contexts/AuthContext';
import EventListView from './views/EventListView';
import TicketingView from './views/TicketingView';
import MyTicketsView from './views/MyTicketsView';
import AdminDashboardView from './views/AdminDashboardView';
import LoginView from './views/LoginView';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<EventListView />} />
          <Route path="/login" element={<LoginView />} />
          <Route path="/ticket/:id" element={<TicketingView />} />
          <Route path="/my-tickets" element={<MyTicketsView />} />
          <Route path="/admin" element={<AdminDashboardView />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </StrictMode>,
)

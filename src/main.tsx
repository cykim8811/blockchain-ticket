import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { BrowserRouter, Routes, Route } from "react-router";
import EventListView from './views/EventListView.tsx';
import TicketingView from './views/TicketingView.tsx';
import MyTicketsView from './views/MyTicketsView.tsx';
import AdminDashboardView from './views/AdminDashboardView.tsx';
import LoginView from './views/LoginView.tsx';
import { AuthProvider } from './contexts/AuthContext.tsx';
import Layout from './components/Layout.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<EventListView />} />
            <Route path="/login" element={<LoginView />} />
            <Route path="/ticketing/:id" element={<TicketingView />} />
            <Route path="/my-tickets" element={<MyTicketsView />} />
            <Route path="/admin" element={<AdminDashboardView />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </StrictMode>,
)

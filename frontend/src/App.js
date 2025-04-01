import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useWeb3 } from './contexts/Web3Context';

// Import pages
import Home from './pages/Home';
import Events from './pages/Events';
import EventDetails from './pages/EventDetails';
import MyTickets from './pages/MyTickets';
import Marketplace from './pages/Marketplace';

// Import components
import Navbar from './components/Navbar';
import ConnectWallet from './components/ConnectWallet';

function App() {
  const { account } = useWeb3();
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        {!account ? (
          <div className="max-w-md mx-auto mt-20">
            <ConnectWallet />
          </div>
        ) : (
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/events" element={<Events />} />
            <Route path="/events/:address" element={<EventDetails />} />
            <Route path="/my-tickets" element={<MyTickets />} />
            <Route path="/marketplace" element={<Marketplace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        )}
      </main>
      
      <footer className="bg-gray-100 py-6 mt-12">
        <div className="container mx-auto px-4 text-center text-gray-600">
          <p>© {new Date().getFullYear()} Ethereum Ticketing System</p>
        </div>
      </footer>
    </div>
  );
}

export default App; 
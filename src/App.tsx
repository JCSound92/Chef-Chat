import React from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Navigation } from './components/Navigation';
import { ChatControl } from './components/ChatControl';
import { HomePage } from './pages/HomePage';
import { SearchPage } from './pages/SearchPage';
import { ChatPage } from './pages/ChatPage';
import { RecentRecipesPage } from './pages/RecentRecipesPage';
import { SavedRecipesPage } from './pages/SavedRecipesPage';
import { ShoppingListPage } from './pages/ShoppingListPage';
import { CurrentMeal } from './components/CurrentMeal';
import { CookingModePage } from './pages/CookingModePage';
import { Toast } from './components/Toast';

// Wrapper component to conditionally render ChatControl
function AppContent() {
  const location = useLocation();
  const showChat = location.pathname !== '/';

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navigation />
      <main className="flex-1 flex flex-col mt-16 mb-20">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/recent" element={<RecentRecipesPage />} />
          <Route path="/saved" element={<SavedRecipesPage />} />
          <Route path="/current-meal" element={<CurrentMeal />} />
          <Route path="/shopping-list" element={<ShoppingListPage />} />
          <Route path="/cooking" element={<CookingModePage />} />
        </Routes>
      </main>
      {showChat && <ChatControl />}
      <Toast />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
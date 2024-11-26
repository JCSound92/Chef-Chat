import React, { useEffect } from 'react';
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

// Handle mobile viewport height
function setAppHeight() {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
  document.documentElement.style.setProperty('--app-height', `${window.innerHeight}px`);
}

// Wrapper component to conditionally render ChatControl
function AppContent() {
  const location = useLocation();
  const showChat = location.pathname !== '/';

  useEffect(() => {
    // Set initial height
    setAppHeight();

    // Update height on resize and orientation change
    window.addEventListener('resize', setAppHeight);
    window.addEventListener('orientationchange', () => {
      setTimeout(setAppHeight, 100);
    });

    // Handle iOS keyboard
    if (/iPad|iPhone|iPod/.test(navigator.platform)) {
      const visualViewport = window.visualViewport;
      if (visualViewport) {
        const resizeHandler = () => {
          const keyboardHeight = Math.max(0, window.innerHeight - visualViewport.height);
          document.documentElement.style.setProperty('--keyboard-height', `${keyboardHeight}px`);
          // Force a reflow to ensure the height is updated
          document.body.style.height = '100%';
          requestAnimationFrame(() => {
            document.body.style.height = '';
          });
        };
        visualViewport.addEventListener('resize', resizeHandler);
        return () => visualViewport.removeEventListener('resize', resizeHandler);
      }
    }

    return () => {
      window.removeEventListener('resize', setAppHeight);
      window.removeEventListener('orientationchange', setAppHeight);
    };
  }, []);

  return (
    <div className="h-full flex flex-col bg-gray-50">
      <Navigation />
      <main className="flex-1 flex flex-col relative">
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
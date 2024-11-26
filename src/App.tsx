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

// Wrapper component to conditionally render ChatControl
function AppContent() {
  const location = useLocation();
  const showChat = location.pathname !== '/' && location.pathname !== '/shopping-list';

  useEffect(() => {
    function setAppHeight() {
      const doc = document.documentElement;
      doc.style.setProperty('--app-height', `${window.innerHeight}px`);
    }

    // Set initial height
    setAppHeight();

    // Update height on resize and orientation change
    window.addEventListener('resize', setAppHeight);
    window.addEventListener('orientationchange', () => {
      setTimeout(setAppHeight, 100);
    });

    // Handle iOS keyboard
    if (/iPad|iPhone|iPod/.test(navigator.platform)) {
      if ('visualViewport' in window && window.visualViewport) {
        const viewport = window.visualViewport;
        let lastHeight = viewport.height;
        
        const handler = () => {
          // Only update if height actually changed (keyboard state changed)
          if (viewport.height !== lastHeight) {
            lastHeight = viewport.height;
            const offsetHeight = window.innerHeight - viewport.height;
            document.documentElement.style.setProperty(
              '--keyboard-height',
              `${offsetHeight}px`
            );
          }
        };

        viewport.addEventListener('resize', handler);
        viewport.addEventListener('scroll', handler);
        return () => {
          viewport.removeEventListener('resize', handler);
          viewport.removeEventListener('scroll', handler);
        };
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
      <main className="flex-1 flex flex-col overflow-hidden">
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
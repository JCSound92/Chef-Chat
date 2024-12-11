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
import { OnboardingModal } from './components/OnboardingModal';

// Store scroll positions for each route
const scrollPositions = new Map<string, number>();

function ScrollContainer({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Save scroll position when leaving a route
  useEffect(() => {
    return () => {
      if (containerRef.current) {
        scrollPositions.set(location.pathname, containerRef.current.scrollTop);
      }
    };
  }, [location.pathname]);

  // Restore scroll position when entering a route
  useEffect(() => {
    if (containerRef.current) {
      const savedPosition = scrollPositions.get(location.pathname) || 0;
      containerRef.current.scrollTop = savedPosition;
    }
  }, [location.pathname]);

  return (
    <div ref={containerRef} className="content-container">
      {children}
    </div>
  );
}

function AppContent() {
  const location = useLocation();
  const showChat = location.pathname !== '/' && location.pathname !== '/shopping-list';

  useEffect(() => {
    function setAppHeight() {
      const doc = document.documentElement;
      doc.style.setProperty('--app-height', `${window.innerHeight}px`);
    }

    setAppHeight();
    window.addEventListener('resize', setAppHeight);
    window.addEventListener('orientationchange', () => {
      setTimeout(setAppHeight, 100);
    });

    if (/iPad|iPhone|iPod/.test(navigator.platform)) {
      if ('visualViewport' in window && window.visualViewport) {
        const viewport = window.visualViewport;
        let lastHeight = viewport.height;
        
        const handler = () => {
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
      <div className="main-layout">
        <ScrollContainer>
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
        </ScrollContainer>
      </div>
      {showChat && <ChatControl />}
      <Toast />
      <OnboardingModal />
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
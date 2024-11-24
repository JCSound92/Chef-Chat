import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { ChevronLeft, ChevronRight, Utensils, ShoppingCart, Heart, Search, History, BookmarkCheck } from 'lucide-react';
import useMeasure from 'react-use-measure';
import { useLocation, useNavigate } from 'react-router-dom';

const STAGES = [
  { path: '/', title: 'Find Recipes', icon: Search },
  { path: '/recent', title: 'Recent Recipes', icon: History },
  { path: '/saved', title: 'Saved Recipes', icon: BookmarkCheck },
  { path: '/current-meal', title: "Tonight's Meal", icon: Heart },
  { path: '/shopping-list', title: 'Shopping List', icon: ShoppingCart },
  { path: '/cooking', title: 'Cooking Mode', icon: Utensils }
];

const PEEK_RATIO = 0.075;
const MAIN_RATIO = 0.85;

export function StageCarousel({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [ref, bounds] = useMeasure();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const scrollPositions = useRef<Record<string, number>>({});

  // Update current index when location changes
  useEffect(() => {
    const index = STAGES.findIndex(stage => stage.path === location.pathname);
    if (index !== -1) {
      setCurrentIndex(index);
    }
  }, [location]);

  // Save scroll position when leaving a view
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    scrollPositions.current[location.pathname] = target.scrollTop;
  };

  // Restore scroll position when entering a view
  useEffect(() => {
    const scrollContainer = document.querySelector('.stage-content');
    if (scrollContainer) {
      const savedPosition = scrollPositions.current[location.pathname] || 0;
      scrollContainer.scrollTop = savedPosition;
    }
  }, [location.pathname]);

  const navigateStage = (direction: number) => {
    const newIndex = Math.max(0, Math.min(currentIndex + direction, STAGES.length - 1));
    if (newIndex !== currentIndex) {
      setCurrentIndex(newIndex);
      navigate(STAGES[newIndex].path);
    }
  };

  const handleDragEnd = (e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setIsDragging(false);
    const threshold = bounds.width * PEEK_RATIO * 2;
    if (Math.abs(info.offset.x) > threshold) {
      navigateStage(info.offset.x < 0 ? 1 : -1);
    }
  };

  const mainCardWidth = bounds.width * MAIN_RATIO;
  const peekWidth = bounds.width * PEEK_RATIO;

  // Don't show carousel for detail views
  if (location.pathname.includes('/recipe/')) {
    return <div className="flex-1 overflow-auto">{children}</div>;
  }

  return (
    <div className="flex-1 flex flex-col px-4 pb-4" ref={ref}>
      <div className="flex-1 relative overflow-hidden">
        {currentIndex > 0 && (
          <button
            onClick={() => navigateStage(-1)}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-3 bg-white/80 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition-colors hidden md:block"
            aria-label="Previous stage"
          >
            <ChevronLeft className="w-6 h-6 text-gray-600" />
          </button>
        )}
        {currentIndex < STAGES.length - 1 && (
          <button
            onClick={() => navigateStage(1)}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-3 bg-white/80 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition-colors hidden md:block"
            aria-label="Next stage"
          >
            <ChevronRight className="w-6 h-6 text-gray-600" />
          </button>
        )}

        <motion.div
          className="flex h-full items-stretch"
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragStart={() => setIsDragging(true)}
          onDragEnd={handleDragEnd}
          style={{
            x: -currentIndex * (mainCardWidth + peekWidth * 2),
          }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          <AnimatePresence>
            {STAGES.map((stage, index) => {
              const Icon = stage.icon;
              const isActive = location.pathname === stage.path;
              return (
                <motion.div
                  key={stage.path}
                  className="px-2 flex-shrink-0"
                  style={{
                    width: mainCardWidth + peekWidth * 2,
                    pointerEvents: isDragging ? 'none' : 'auto',
                  }}
                >
                  <motion.div
                    className="h-full bg-white rounded-2xl shadow-lg overflow-hidden relative"
                    style={{
                      scale: currentIndex === index ? 1 : 0.95,
                      opacity: Math.abs(currentIndex - index) <= 1 ? 
                        currentIndex === index ? 1 : 0.6 : 0,
                    }}
                    transition={{ duration: 0.3 }}
                  >
                    {isActive && (
                      <div 
                        className="h-full overflow-auto no-scrollbar stage-content"
                        onScroll={handleScroll}
                      >
                        {children}
                      </div>
                    )}
                  </motion.div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      </div>

      <div className="flex justify-center gap-2 mt-4">
        {STAGES.map((stage, index) => (
          <button
            key={stage.path}
            onClick={() => navigateStage(index - currentIndex)}
            className={`h-2 rounded-full transition-all ${
              currentIndex === index
                ? 'bg-[#FF6B6B] w-8'
                : 'bg-gray-300 hover:bg-gray-400 w-2'
            }`}
            aria-label={`Go to ${stage.title}`}
          />
        ))}
      </div>
    </div>
  );
}
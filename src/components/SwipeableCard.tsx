import React, { useRef } from 'react';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { Plus } from 'lucide-react';

interface SwipeableCardProps {
  children: React.ReactNode;
  onAddToPlan: () => void;
  title: string;
}

export function SwipeableCard({ children, onAddToPlan, title }: SwipeableCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const opacity = useTransform(x, [-100, 0], [1, 0]);
  const scale = useTransform(x, [-100, 0], [1, 0.8]);

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.x < -50) {
      handleAdd();
    } else {
      x.set(0);
    }
  };

  const handleAdd = () => {
    onAddToPlan();
    setTimeout(() => x.set(0), 200);
  };

  const handleAddClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    handleAdd();
  };

  return (
    <div className="relative overflow-hidden rounded-xl">
      {/* Mobile swipe action button */}
      <motion.div
        className="absolute right-0 top-0 bottom-0 w-24 bg-[#FF6B6B] flex items-center justify-center md:hidden"
        style={{ opacity }}
      >
        <motion.div style={{ scale }} className="text-white">
          <Plus className="w-6 h-6" />
        </motion.div>
      </motion.div>

      {/* Desktop add button */}
      <button
        onClick={handleAddClick}
        className="hidden md:flex absolute right-4 bottom-4 z-10 items-center justify-center w-8 h-8 bg-[#FF6B6B] text-white rounded-full shadow-lg hover:bg-[#FF5252] transition-all duration-200 hover:scale-110"
      >
        <Plus className="w-5 h-5" />
      </button>

      {/* Card content */}
      <motion.div
        ref={cardRef}
        drag="x"
        dragConstraints={{ left: -100, right: 0 }}
        dragElastic={0.1}
        dragMomentum={false}
        onDragEnd={handleDragEnd}
        style={{ x }}
        className="bg-white cursor-grab active:cursor-grabbing md:cursor-pointer rounded-xl shadow-lg"
        whileHover={{ scale: 1.01 }}
        transition={{ type: "spring", stiffness: 300 }}
      >
        {children}
      </motion.div>
    </div>
  );
}
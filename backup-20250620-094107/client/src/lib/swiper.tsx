import { useState, useRef, useEffect } from "react";
import { motion, PanInfo } from "framer-motion";

interface SwipeProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeDown?: () => void;
  onSwipeUp?: () => void;
}

const SWIPE_THRESHOLD = 100; // Minimum swipe distance to trigger an action

export const Swiper = ({ 
  children, 
  onSwipeLeft, 
  onSwipeRight,
  onSwipeUp,
  onSwipeDown 
}: SwipeProps) => {
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragEnd, setDragEnd] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  const handleDragStart = () => {
    setIsDragging(true);
  };

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setIsDragging(false);
    setDragEnd({ x: info.offset.x, y: info.offset.y });

    const horizontalDistance = Math.abs(info.offset.x);
    const verticalDistance = Math.abs(info.offset.y);

    // Determine if the swipe was more horizontal or vertical
    if (horizontalDistance > verticalDistance) {
      // Horizontal swipe
      if (info.offset.x > SWIPE_THRESHOLD && onSwipeRight) {
        onSwipeRight();
      } else if (info.offset.x < -SWIPE_THRESHOLD && onSwipeLeft) {
        onSwipeLeft();
      }
    } else {
      // Vertical swipe
      if (info.offset.y > SWIPE_THRESHOLD && onSwipeDown) {
        onSwipeDown();
      } else if (info.offset.y < -SWIPE_THRESHOLD && onSwipeUp) {
        onSwipeUp();
      }
    }
  };

  // Function to calculate rotation based on drag position
  const calculateRotation = () => {
    if (!isDragging) return 0;
    // Return a rotation value based on horizontal drag
    return (dragEnd.x - dragStart.x) * 0.1;
  };

  return (
    <motion.div
      ref={elementRef}
      drag
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.7}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      style={{
        x: isDragging ? dragEnd.x - dragStart.x : 0,
        y: isDragging ? dragEnd.y - dragStart.y : 0,
        rotate: calculateRotation(),
      }}
      animate={
        isDragging
          ? {}
          : { x: 0, y: 0, rotate: 0 }
      }
      transition={{ type: "spring", damping: 20, stiffness: 300 }}
    >
      {children}
    </motion.div>
  );
};

export default Swiper;

import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "./ui/button";

interface MobileSidebarProps {
  children: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
}

export function MobileSidebar({ children, isOpen, onToggle }: MobileSidebarProps) {
  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    if (!isOpen) return;
    
    const handleClickOutside = (e: MouseEvent) => {
      const sidebar = document.getElementById("mobile-sidebar");
      const target = e.target as Node;
      
      if (sidebar && !sidebar.contains(target)) {
        onToggle();
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onToggle]);
  
  // Handle swipe gestures
  useEffect(() => {
    let touchStartX = 0;
    let touchEndX = 0;
    
    const handleTouchStart = (e: TouchEvent) => {
      touchStartX = e.changedTouches[0].screenX;
    };
    
    const handleTouchEnd = (e: TouchEvent) => {
      touchEndX = e.changedTouches[0].screenX;
      handleSwipe();
    };
    
    const handleSwipe = () => {
      const swipeThreshold = 50;
      const diff = touchEndX - touchStartX;
      
      // Swipe right to open (from left edge)
      if (diff > swipeThreshold && touchStartX < 50 && !isOpen) {
        onToggle();
      }
      
      // Swipe left to close
      if (diff < -swipeThreshold && isOpen) {
        onToggle();
      }
    };
    
    document.addEventListener("touchstart", handleTouchStart);
    document.addEventListener("touchend", handleTouchEnd);
    
    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [isOpen, onToggle]);
  
  return (
    <>
      {/* Hamburger button - only visible on mobile */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 lg:hidden bg-background/80 backdrop-blur-sm"
        onClick={onToggle}
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>
      
      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}
      
      {/* Sidebar */}
      <aside
        id="mobile-sidebar"
        className={`
          fixed top-0 left-0 h-full z-50 bg-background border-r
          transition-transform duration-300 ease-in-out
          lg:relative lg:translate-x-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {children}
      </aside>
    </>
  );
}

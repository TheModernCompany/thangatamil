import React, { useEffect, useRef, useState, useCallback } from 'react';
import axios from 'axios';

interface MarqueeItem {
  id: string;
  text: string;
  highlight?: boolean;
}

interface MarqueeProps {
  items?: MarqueeItem[];
  speed?: number; // pixels per second
  gap?: number;
  className?: string;
  pauseOnHover?: boolean;
  apiUrl?: string;
  refreshInterval?: number;
}

const API_BASE_URL = '';

const Marquee: React.FC<MarqueeProps> = ({
  items: propItems,
  speed = 50,
  gap = 60,
  className = '',
  pauseOnHover = true,
  apiUrl = `${API_BASE_URL}/api/scrolling-ads`,
  refreshInterval = 60000,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [items, setItems] = useState<MarqueeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const animationRef = useRef<number | null>(null);
  const positionRef = useRef(0);
  const lastTimeRef = useRef<number>(0);
  const contentWidthRef = useRef(0);
  const containerWidthRef = useRef(0);
  const totalWidthRef = useRef(0);

  const fetchAds = useCallback(async () => {
    // If items are provided via props, use them directly
    if (propItems) {
      setItems(propItems);
      setLoading(false);
      setError(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(apiUrl);
      
      // Filter active ads
      if (response.data && Array.isArray(response.data)) {
        const activeAds = response.data
          .filter((ad: any) => ad.isActive === true)
          .map((ad: any) => ({
            id: ad.id || String(Math.random()),
            text: ad.text || '',
            highlight: ad.highlight || false,
          }));
        
        if (activeAds.length > 0) {
          setItems(activeAds);
        } else {
          setItems([]);
          setError('No active ads available');
        }
      } else {
        setItems([]);
        setError('No active ads available');
      }
    } catch (error) {
      console.error('Error fetching scrolling ads:', error);
      setError('Failed to load ads');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [apiUrl, propItems]);

  useEffect(() => {
    fetchAds();
    
    let interval: NodeJS.Timeout | null = null;
    if (!propItems) {
      interval = setInterval(fetchAds, refreshInterval);
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [fetchAds, refreshInterval, propItems]);

  // Setup continuous scrolling animation (right to left)
  useEffect(() => {
    const container = containerRef.current;
    if (!container || loading || items.length === 0) return;

    // Clear previous content
    container.innerHTML = '';

    // Create a single item element
    const createItemElement = (item: MarqueeItem, showSeparator: boolean = true) => {
      const wrapper = document.createElement('div');
      wrapper.className = 'flex items-center';
      wrapper.style.display = 'flex';
      wrapper.style.alignItems = 'center';
      wrapper.style.gap = `${gap}px`;

      const span = document.createElement('span');
      span.className = `inline-block text-sm sm:text-base font-bold tracking-wide whitespace-nowrap ${
        item.highlight
          ? 'text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-red-600'
          : 'text-gray-700'
      }`;
      span.textContent = item.text;
      wrapper.appendChild(span);

      if (showSeparator) {
        const separator = document.createElement('span');
        separator.className = 'text-gray-400 font-light';
        separator.textContent = '•';
        wrapper.appendChild(separator);
      }

      return wrapper;
    };

    // Create the entire marquee content with multiple copies
    const createMarqueeContent = () => {
      const wrapper = document.createElement('div');
      wrapper.className = 'flex';
      wrapper.style.display = 'flex';
      wrapper.style.alignItems = 'center';
      wrapper.style.gap = `${gap}px`;
      
      // Create enough copies to fill the screen multiple times
      // For single item, create many copies; for multiple items, create enough copies
      const copyCount = items.length === 1 ? 20 : 4;
      
      for (let i = 0; i < copyCount; i++) {
        // Create a group of all items
        const group = document.createElement('div');
        group.className = 'flex items-center';
        group.style.display = 'flex';
        group.style.alignItems = 'center';
        group.style.gap = `${gap}px`;

        items.forEach((item, index) => {
          const isLastItem = index === items.length - 1;
          // Only show separator if not the last item in the group
          const itemWrapper = createItemElement(item, !isLastItem);
          group.appendChild(itemWrapper);
        });

        wrapper.appendChild(group);

        // Add separator between groups (except last)
        if (i < copyCount - 1) {
          const groupSeparator = document.createElement('span');
          groupSeparator.className = 'text-gray-400 font-light';
          groupSeparator.textContent = '•';
          wrapper.appendChild(groupSeparator);
        }
      }

      return wrapper;
    };

    const contentWrapper = createMarqueeContent();
    container.appendChild(contentWrapper);

    // Calculate total width
    const calculateWidths = () => {
      // Get the width of all content
      const totalWidth = contentWrapper.scrollWidth;
      const containerWidth = container.parentElement?.offsetWidth || window.innerWidth;
      return { totalWidth, containerWidth };
    };

    // Get widths after render
    requestAnimationFrame(() => {
      const { totalWidth, containerWidth } = calculateWidths();
      totalWidthRef.current = totalWidth;
      containerWidthRef.current = containerWidth;
      positionRef.current = 0;
      lastTimeRef.current = 0;
      container.style.transform = 'translateX(0px)';
    });

    // Animation loop - Continuous Right to Left scrolling
    const animate = (timestamp: number) => {
      if (!isPaused) {
        if (lastTimeRef.current === 0) {
          lastTimeRef.current = timestamp;
        }

        const delta = (timestamp - lastTimeRef.current) / 1000;
        lastTimeRef.current = timestamp;

        // Move position backward (right to left)
        positionRef.current -= delta * speed;

        // Continuous scrolling - never reset, just keep going
        // The content has enough copies to always fill the screen
        // We use modulo to keep the position within bounds
        const totalWidth = totalWidthRef.current;
        
        // If position goes too far left, wrap it around
        if (positionRef.current < -totalWidth) {
          // Add totalWidth to wrap around
          positionRef.current += totalWidth;
        }
        
        // If position goes too far right (shouldn't happen with negative movement)
        if (positionRef.current > 0) {
          positionRef.current -= totalWidth;
        }

        // Apply transform
        container.style.transform = `translateX(${positionRef.current}px)`;
      } else {
        lastTimeRef.current = timestamp;
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    // Handle resize
    const handleResize = () => {
      const { totalWidth, containerWidth } = calculateWidths();
      totalWidthRef.current = totalWidth;
      containerWidthRef.current = containerWidth;
    };

    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    
    if (container.parentElement) {
      resizeObserver.observe(container.parentElement);
    }

    window.addEventListener('resize', handleResize);
    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      window.removeEventListener('resize', handleResize);
      resizeObserver.disconnect();
    };
  }, [items, speed, gap, isPaused, loading]);

  const handleMouseEnter = () => {
    if (pauseOnHover) {
      setIsPaused(true);
    }
  };

  const handleMouseLeave = () => {
    if (pauseOnHover) {
      setIsPaused(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className={`relative overflow-hidden bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 py-3 border-y-2 border-amber-200 shadow-inner ${className}`}>
        <div className="flex justify-center items-center h-8">
          <div className="animate-pulse text-gray-400">Loading ads...</div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`relative overflow-hidden bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 py-3 border-y-2 border-amber-200 shadow-inner ${className}`}>
        <div className="flex justify-center items-center h-8">
          <span className="text-gray-400 text-sm">{error}</span>
        </div>
      </div>
    );
  }

  // Empty state
  if (items.length === 0) {
    return (
      <div className={`relative overflow-hidden bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 py-3 border-y-2 border-amber-200 shadow-inner ${className}`}>
        <div className="flex justify-center items-center h-8">
          <span className="text-gray-400 text-sm">No active ads available</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 py-3 border-y-2 border-amber-200 shadow-inner ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div
        ref={containerRef}
        className="flex will-change-transform"
        style={{ 
          willChange: 'transform',
          transition: 'none',
          display: 'flex',
          minWidth: '100%'
        }}
      />
    </div>
  );
};

export default Marquee;
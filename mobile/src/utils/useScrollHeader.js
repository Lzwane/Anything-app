import { useState, useRef } from "react";

export default function useScrollHeader(threshold = 10) {
  const [showHeaderBorder, setShowHeaderBorder] = useState(false);
  const scrollViewRef = useRef(null);

  const handleScroll = (event) => {
    const scrollY = event.nativeEvent.contentOffset.y;
    const shouldShowBorder = scrollY > threshold;

    if (shouldShowBorder !== showHeaderBorder) {
      setShowHeaderBorder(shouldShowBorder);
    }
  };

  return {
    showHeaderBorder,
    handleScroll,
    scrollViewRef,
  };
}

import { useCallback, useEffect, useState } from 'react';

export function useLiveRenderSlot() {
  const [slotEl, setSlotEl] = useState<HTMLDivElement | null>(null);
  const [slotRect, setSlotRect] = useState<DOMRect | null>(null);

  const registerSlot = useCallback((el: HTMLDivElement | null) => setSlotEl(el), []);

  useEffect(() => {
    if (!slotEl) {
      setSlotRect(null);
      return;
    }
    const update = () => setSlotRect(slotEl.getBoundingClientRect());
    update();
    const resizeObserver = new ResizeObserver(update);
    resizeObserver.observe(slotEl);
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [slotEl]);

  return { registerSlot, slotRect };
}

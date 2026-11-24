export const navigateToSection = (
  targetId: string,
  studioTab?: 'gps' | 'detailing' | 'webrtc' | 'multitenant',
  e?: React.MouseEvent
) => {
  if (e) {
    e.preventDefault();
  }

  if (typeof window === "undefined") return;

  // If a specific studio tab is requested, broadcast the event
  if (studioTab) {
    window.dispatchEvent(
      new CustomEvent('mediqbyte-studio-tab', { detail: studioTab })
    );
  }

  if (targetId === 'top' || targetId === 'hero' || targetId === '') {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    try {
      history.pushState(null, '', ' ');
    } catch {
      // ignore
    }
    return;
  }

  const el = document.getElementById(targetId);
  if (el) {
    const headerOffset = 85;
    const elementPosition = el.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

    window.scrollTo({
      top: Math.max(0, offsetPosition),
      behavior: 'smooth',
    });

    try {
      history.pushState(null, '', `#${targetId}`);
    } catch {
      // ignore
    }
  }
};

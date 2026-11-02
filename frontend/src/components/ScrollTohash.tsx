import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollToHash = () => {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    // Si hay hash, ir a la sección
    if (hash) {
      const id = hash.replace('#', '');
      const element = document.getElementById(id);

      if (element) {
        // Pequeño delay para que el DOM se pinte antes de scrollear
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
        return;
      }
    }

    // Si no hay hash, ir al inicio de la página
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [pathname, hash]);

  return null;
};

export default ScrollToHash;
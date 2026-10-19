import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Prevent mouse cursor wheel and up/down arrow keys from auto-incrementing or decrementing number input fields
if (typeof window !== 'undefined') {
  // 1. Prevent wheel scroll from changing number inputs
  window.addEventListener(
    'wheel',
    (e: WheelEvent) => {
      const target = e.target;
      if (target instanceof HTMLInputElement && target.type === 'number') {
        target.blur();
        e.preventDefault();
      }
    },
    { passive: false }
  );

  // 2. Prevent keyboard ArrowUp & ArrowDown from auto-incrementing / decrementing number inputs
  window.addEventListener(
    'keydown',
    (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        const target = e.target;
        if (target instanceof HTMLInputElement && target.type === 'number') {
          e.preventDefault();
        }
      }
    },
    { capture: true }
  );
}

createRoot(document.getElementById('root')!).render(<App />);

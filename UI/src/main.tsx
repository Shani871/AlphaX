import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Filter non-critical Three.js r186+ Clock deprecation warning invoked by @react-three/fiber
const threeClockMsg = 'THREE.Clock: This module has been deprecated';
const origWarn = console.warn;
const origLog  = console.log;
console.warn = function (...args: any[]) {
  if (typeof args[0] === 'string' && args[0].includes(threeClockMsg)) return;
  origWarn.apply(console, args);
};
console.log = function (...args: any[]) {
  if (typeof args[0] === 'string' && args[0].includes(threeClockMsg)) return;
  origLog.apply(console, args);
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);


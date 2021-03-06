import React from 'react';
import { render } from 'react-dom';
import App from './App';

render(<App />, document.getElementById('root'));

if (module.hot) {
  module.hot.accept();
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js').then(registration => {
      console.log('SW registered: ', registration);
    }).catch(registrationError => {
      console.log('SW registration failed: ', registrationError);
    });
  });
}
import '@testing-library/jest-dom/vitest';

if (!('scrollIntoView' in window.HTMLElement.prototype)) {
  window.HTMLElement.prototype.scrollIntoView = () => {};
}

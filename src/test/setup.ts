import '@testing-library/jest-dom/vitest';

declare global {
  interface HTMLElement {
    scrollIntoView: () => void;
  }
}

if (!HTMLElement.prototype.scrollIntoView) {
  HTMLElement.prototype.scrollIntoView = () => {};
}

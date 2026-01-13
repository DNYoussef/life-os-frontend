import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from '../App';

describe('App', () => {
  it('renders the main header', () => {
    render(<App />);
    expect(screen.getByText('Life OS Dashboard')).toBeInTheDocument();
  });
});

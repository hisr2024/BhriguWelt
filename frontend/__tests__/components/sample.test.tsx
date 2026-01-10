/**
 * Sample component test
 * This serves as a template for testing React components
 */
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import GenZButton from '@/app/components/GenZButton';

describe('Component Tests', () => {
  describe('GenZButton', () => {
    it('renders provided label', () => {
      render(<GenZButton>Cosmic Action</GenZButton>);

      expect(screen.getByRole('button', { name: 'Cosmic Action' })).toBeInTheDocument();
    });

    it('disables the button when loading', () => {
      render(<GenZButton loading>Sending</GenZButton>);

      expect(screen.getByRole('button', { name: 'Sending' })).toBeDisabled();
    });
  });
});

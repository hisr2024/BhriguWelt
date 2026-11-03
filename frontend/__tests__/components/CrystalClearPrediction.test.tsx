/**
 * CrystalClearPrediction Component Tests
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import CrystalClearPrediction from '@/components/predictions/CrystalClearPrediction';

// Mock framer-motion so content renders without animation styles.
// In jsdom animations never run, leaving elements stuck at their
// `initial` styles (opacity: 0, height: 0), which breaks visibility checks.
jest.mock('framer-motion', () => {
  const ReactLib = require('react');
  const MOTION_PROPS = [
    'initial',
    'animate',
    'exit',
    'transition',
    'variants',
    'whileHover',
    'whileTap',
    'whileFocus',
    'whileInView',
    'layout',
  ];
  const componentCache = new Map<string, unknown>();
  const createMotionComponent = (tag: string) => {
    if (!componentCache.has(tag)) {
      componentCache.set(
        tag,
        ReactLib.forwardRef((props: Record<string, unknown>, ref: unknown) => {
          const domProps: Record<string, unknown> = { ...props };
          MOTION_PROPS.forEach((key) => delete domProps[key]);
          return ReactLib.createElement(tag, { ...domProps, ref });
        })
      );
    }
    return componentCache.get(tag);
  };
  return {
    motion: new Proxy(
      {},
      { get: (_target, tag) => createMotionComponent(String(tag)) }
    ),
    AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
  };
});

const mockPrediction = {
  summary: 'Your soul has a unique purpose to fulfill in this lifetime.',
  astrologicalSummary: 'Jupiter in the 10th house indicates success in career and public life.',
  remedy: 'Practice daily meditation and gratitude to align with your higher purpose.',
};

describe('CrystalClearPrediction', () => {
  describe('Rendering', () => {
    it('renders without crashing', () => {
      render(<CrystalClearPrediction prediction={mockPrediction} />);
      expect(screen.getByText(/Summary/i)).toBeInTheDocument();
    });

    it('displays all three sections', () => {
      render(<CrystalClearPrediction prediction={mockPrediction} />);

      expect(screen.getByText('Summary')).toBeInTheDocument();
      expect(screen.getByText('Astrological Insights')).toBeInTheDocument();
      expect(screen.getByText('Guidance & Remedies')).toBeInTheDocument();
    });

    it('displays category when provided', () => {
      render(
        <CrystalClearPrediction
          prediction={mockPrediction}
          category="Karmic Journey"
        />
      );

      expect(screen.getByText('Karmic Journey')).toBeInTheDocument();
    });

    it('displays confidence score when provided', () => {
      render(
        <CrystalClearPrediction
          prediction={mockPrediction}
          confidence={0.95}
        />
      );

      expect(screen.getByText(/Confidence: 95%/i)).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('shows loading skeleton when loading is true', () => {
      render(
        <CrystalClearPrediction
          prediction={mockPrediction}
          loading={true}
        />
      );

      const loadingElements = screen.getAllByRole('status');
      expect(loadingElements.length).toBeGreaterThan(0);
    });

    it('shows 3 loading cards', () => {
      const { container } = render(
        <CrystalClearPrediction
          prediction={mockPrediction}
          loading={true}
        />
      );

      const loadingCards = container.querySelectorAll('.animate-pulse');
      expect(loadingCards.length).toBeGreaterThan(0);
    });
  });

  describe('Error State', () => {
    it('displays error message when error is provided', () => {
      render(
        <CrystalClearPrediction
          prediction={mockPrediction}
          error="Failed to load prediction"
        />
      );

      expect(screen.getByText(/Unable to Load Prediction/i)).toBeInTheDocument();
      expect(screen.getByText(/Failed to load prediction/i)).toBeInTheDocument();
    });

    it('shows error alert with correct styling', () => {
      const { container } = render(
        <CrystalClearPrediction
          prediction={mockPrediction}
          error="Test error"
        />
      );

      const errorAlert = container.querySelector('[role="alert"]');
      expect(errorAlert).toBeInTheDocument();
    });
  });

  describe('Section Interaction', () => {
    it('toggles section expansion on click', async () => {
      render(<CrystalClearPrediction prediction={mockPrediction} />);

      const summaryButton = screen.getByText('Summary').closest('button');

      // Initially expanded - should show content
      expect(screen.getByText(mockPrediction.summary)).toBeVisible();

      // Click to collapse
      fireEvent.click(summaryButton!);

      // Collapsed content is removed from the DOM
      await waitFor(() => {
        expect(screen.queryByText(mockPrediction.summary)).not.toBeInTheDocument();
      });
    });

    it('shows "Click to expand" text for collapsed sections', async () => {
      render(<CrystalClearPrediction prediction={mockPrediction} />);

      const summaryButton = screen.getByText('Summary').closest('button');
      fireEvent.click(summaryButton!);

      await waitFor(() => {
        expect(screen.getByText(/Click to expand/i)).toBeInTheDocument();
      });
    });
  });

  describe('Copy Functionality', () => {
    beforeEach(() => {
      // Mock clipboard API
      Object.assign(navigator, {
        clipboard: {
          writeText: jest.fn(() => Promise.resolve()),
        },
      });
    });

    it('copies section content to clipboard', async () => {
      render(<CrystalClearPrediction prediction={mockPrediction} />);

      const copyButtons = screen.getAllByLabelText(/Copy/i);
      const summaryCopyButton = copyButtons[0];

      fireEvent.click(summaryCopyButton);

      await waitFor(() => {
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
          mockPrediction.summary
        );
      });
    });

    it('shows "Copied!" feedback after copying', async () => {
      render(<CrystalClearPrediction prediction={mockPrediction} />);

      const copyButtons = screen.getAllByLabelText(/Copy/i);
      fireEvent.click(copyButtons[0]);

      await waitFor(() => {
        expect(screen.getByText(/Copied!/i)).toBeInTheDocument();
      });
    });

    it('resets copied state after 2 seconds', async () => {
      jest.useFakeTimers();

      render(<CrystalClearPrediction prediction={mockPrediction} />);

      const copyButtons = screen.getAllByLabelText(/Copy/i);
      fireEvent.click(copyButtons[0]);

      await waitFor(() => {
        expect(screen.getByText(/Copied!/i)).toBeInTheDocument();
      });

      jest.advanceTimersByTime(2000);

      await waitFor(() => {
        expect(screen.queryByText(/Copied!/i)).not.toBeInTheDocument();
      });

      jest.useRealTimers();
    });
  });

  describe('Action Callbacks', () => {
    it('calls onCopy callback when copy button is clicked', () => {
      const onCopy = jest.fn();

      render(
        <CrystalClearPrediction
          prediction={mockPrediction}
          onCopy={onCopy}
        />
      );

      const copyButton = screen.getByLabelText('Copy prediction');
      fireEvent.click(copyButton);

      expect(onCopy).toHaveBeenCalledTimes(1);
    });

    it('calls onShare callback when share button is clicked', () => {
      const onShare = jest.fn();

      render(
        <CrystalClearPrediction
          prediction={mockPrediction}
          onShare={onShare}
        />
      );

      const shareButton = screen.getByLabelText('Share prediction');
      fireEvent.click(shareButton);

      expect(onShare).toHaveBeenCalledTimes(1);
    });

    it('calls onDownload callback when download button is clicked', () => {
      const onDownload = jest.fn();

      render(
        <CrystalClearPrediction
          prediction={mockPrediction}
          onDownload={onDownload}
        />
      );

      const downloadButton = screen.getByLabelText('Download prediction');
      fireEvent.click(downloadButton);

      expect(onDownload).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes for sections', () => {
      render(<CrystalClearPrediction prediction={mockPrediction} />);

      const summaryButton = screen.getByText('Summary').closest('button');

      expect(summaryButton).toHaveAttribute('aria-expanded');
      expect(summaryButton).toHaveAttribute('aria-controls');
    });

    it('has proper role for loading state', () => {
      render(
        <CrystalClearPrediction
          prediction={mockPrediction}
          loading={true}
        />
      );

      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('has proper role for error state', () => {
      render(
        <CrystalClearPrediction
          prediction={mockPrediction}
          error="Test error"
        />
      );

      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('has keyboard accessible buttons', () => {
      render(<CrystalClearPrediction prediction={mockPrediction} />);

      const summaryButton = screen.getByText('Summary').closest('button');

      expect(summaryButton).toHaveAttribute('type');
    });
  });

  describe('Visual Styling', () => {
    it('applies different gradient colors for each section', () => {
      const { container } = render(
        <CrystalClearPrediction prediction={mockPrediction} />
      );

      // Check for gradient classes
      const sections = container.querySelectorAll('[class*="gradient"]');
      expect(sections.length).toBeGreaterThan(0);
    });

    it('applies custom className when provided', () => {
      const { container } = render(
        <CrystalClearPrediction
          prediction={mockPrediction}
          className="custom-class"
        />
      );

      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  describe('Content Display', () => {
    it('preserves whitespace in prediction content', () => {
      const predictionWithNewlines = {
        ...mockPrediction,
        summary: 'Line 1\n\nLine 2\n\nLine 3',
      };

      render(<CrystalClearPrediction prediction={predictionWithNewlines} />);

      const summaryContent = screen.getByText(/Line 1/);
      expect(summaryContent).toHaveClass('whitespace-pre-wrap');
    });

    it('displays footer note about guidance', () => {
      render(<CrystalClearPrediction prediction={mockPrediction} />);

      expect(
        screen.getByText(/This guidance is based on Vedic astrology principles/i)
      ).toBeInTheDocument();
    });
  });
});

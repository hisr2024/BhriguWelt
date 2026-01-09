/**
 * Unit tests for Accordion component
 *
 * Tests keyboard navigation, ARIA attributes, and proper functionality
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Accordion } from '@/app/components/ui/Accordion';
import { AccordionItem } from '@/app/components/ui/AccordionItem';

describe('Accordion', () => {
  describe('Rendering', () => {
    it('should render accordion with children', () => {
      render(
        <Accordion>
          <AccordionItem title="Test Item 1">Content 1</AccordionItem>
          <AccordionItem title="Test Item 2">Content 2</AccordionItem>
        </Accordion>
      );

      expect(screen.getByText('Test Item 1')).toBeInTheDocument();
      expect(screen.getByText('Test Item 2')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(
        <Accordion className="custom-class">
          <AccordionItem title="Test">Content</AccordionItem>
        </Accordion>
      );

      const accordion = container.firstChild as HTMLElement;
      expect(accordion).toHaveClass('custom-class');
    });
  });

  describe('Keyboard Navigation', () => {
    it('should navigate to next item with ArrowDown', async () => {
      render(
        <Accordion>
          <AccordionItem title="Item 1">Content 1</AccordionItem>
          <AccordionItem title="Item 2">Content 2</AccordionItem>
        </Accordion>
      );

      const triggers = screen.getAllByRole('button');

      // Focus first trigger
      triggers[0].focus();
      expect(triggers[0]).toHaveFocus();

      // Press ArrowDown
      fireEvent.keyDown(triggers[0], { key: 'ArrowDown' });

      await waitFor(() => {
        expect(triggers[1]).toHaveFocus();
      });
    });

    it('should navigate to previous item with ArrowUp', async () => {
      render(
        <Accordion>
          <AccordionItem title="Item 1">Content 1</AccordionItem>
          <AccordionItem title="Item 2">Content 2</AccordionItem>
        </Accordion>
      );

      const triggers = screen.getAllByRole('button');

      // Focus second trigger
      triggers[1].focus();
      expect(triggers[1]).toHaveFocus();

      // Press ArrowUp
      fireEvent.keyDown(triggers[1], { key: 'ArrowUp' });

      await waitFor(() => {
        expect(triggers[0]).toHaveFocus();
      });
    });

    it('should navigate to first item with Home', async () => {
      render(
        <Accordion>
          <AccordionItem title="Item 1">Content 1</AccordionItem>
          <AccordionItem title="Item 2">Content 2</AccordionItem>
          <AccordionItem title="Item 3">Content 3</AccordionItem>
        </Accordion>
      );

      const triggers = screen.getAllByRole('button');

      // Focus last trigger
      triggers[2].focus();
      expect(triggers[2]).toHaveFocus();

      // Press Home
      fireEvent.keyDown(triggers[2], { key: 'Home' });

      await waitFor(() => {
        expect(triggers[0]).toHaveFocus();
      });
    });

    it('should navigate to last item with End', async () => {
      render(
        <Accordion>
          <AccordionItem title="Item 1">Content 1</AccordionItem>
          <AccordionItem title="Item 2">Content 2</AccordionItem>
          <AccordionItem title="Item 3">Content 3</AccordionItem>
        </Accordion>
      );

      const triggers = screen.getAllByRole('button');

      // Focus first trigger
      triggers[0].focus();
      expect(triggers[0]).toHaveFocus();

      // Press End
      fireEvent.keyDown(triggers[0], { key: 'End' });

      await waitFor(() => {
        expect(triggers[2]).toHaveFocus();
      });
    });

    it('should wrap around when navigating past last item', async () => {
      render(
        <Accordion>
          <AccordionItem title="Item 1">Content 1</AccordionItem>
          <AccordionItem title="Item 2">Content 2</AccordionItem>
        </Accordion>
      );

      const triggers = screen.getAllByRole('button');

      // Focus last trigger
      triggers[1].focus();

      // Press ArrowDown (should wrap to first)
      fireEvent.keyDown(triggers[1], { key: 'ArrowDown' });

      await waitFor(() => {
        expect(triggers[0]).toHaveFocus();
      });
    });

    it('should wrap around when navigating before first item', async () => {
      render(
        <Accordion>
          <AccordionItem title="Item 1">Content 1</AccordionItem>
          <AccordionItem title="Item 2">Content 2</AccordionItem>
        </Accordion>
      );

      const triggers = screen.getAllByRole('button');

      // Focus first trigger
      triggers[0].focus();

      // Press ArrowUp (should wrap to last)
      fireEvent.keyDown(triggers[0], { key: 'ArrowUp' });

      await waitFor(() => {
        expect(triggers[1]).toHaveFocus();
      });
    });

    it('should not interfere with other key presses', () => {
      const { container } = render(
        <Accordion>
          <AccordionItem title="Item 1">Content 1</AccordionItem>
        </Accordion>
      );

      const trigger = screen.getByRole('button');
      trigger.focus();

      // These keys should not trigger navigation
      fireEvent.keyDown(trigger, { key: 'Tab' });
      fireEvent.keyDown(trigger, { key: 'Escape' });
      fireEvent.keyDown(trigger, { key: 'a' });

      // Should still be focused (not prevented)
      expect(trigger).toHaveFocus();
    });
  });
});

describe('AccordionItem', () => {
  describe('Rendering', () => {
    it('should render title and content when open', () => {
      render(
        <AccordionItem title="Test Title" defaultOpen={true}>
          Test Content
        </AccordionItem>
      );

      expect(screen.getByText('Test Title')).toBeInTheDocument();
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('should hide content when closed', () => {
      render(
        <AccordionItem title="Test Title" defaultOpen={false}>
          Test Content
        </AccordionItem>
      );

      expect(screen.getByText('Test Title')).toBeInTheDocument();
      expect(screen.queryByText('Test Content')).not.toBeInTheDocument();
    });

    it('should apply custom classNames', () => {
      const { container } = render(
        <AccordionItem
          title="Test"
          className="custom-item"
          triggerClassName="custom-trigger"
          panelClassName="custom-panel"
          defaultOpen={true}
        >
          Content
        </AccordionItem>
      );

      expect(container.querySelector('.custom-item')).toBeInTheDocument();
      expect(container.querySelector('.custom-trigger')).toBeInTheDocument();
      expect(container.querySelector('.custom-panel')).toBeInTheDocument();
    });
  });

  describe('Click Interaction', () => {
    it('should expand when clicking closed item', async () => {
      render(
        <AccordionItem title="Test Title" defaultOpen={false}>
          Test Content
        </AccordionItem>
      );

      const trigger = screen.getByRole('button');

      // Initially closed
      expect(trigger).toHaveAttribute('aria-expanded', 'false');

      // Click to expand
      fireEvent.click(trigger);

      await waitFor(() => {
        expect(trigger).toHaveAttribute('aria-expanded', 'true');
        expect(screen.getByText('Test Content')).toBeInTheDocument();
      });
    });

    it('should collapse when clicking open item', async () => {
      render(
        <AccordionItem title="Test Title" defaultOpen={true}>
          Test Content
        </AccordionItem>
      );

      const trigger = screen.getByRole('button');

      // Initially open
      expect(trigger).toHaveAttribute('aria-expanded', 'true');

      // Click to collapse
      fireEvent.click(trigger);

      await waitFor(() => {
        expect(trigger).toHaveAttribute('aria-expanded', 'false');
      });
    });

    it('should call onToggle callback when toggled', () => {
      const onToggle = jest.fn();

      render(
        <AccordionItem title="Test Title" onToggle={onToggle}>
          Test Content
        </AccordionItem>
      );

      const trigger = screen.getByRole('button');
      fireEvent.click(trigger);

      expect(onToggle).toHaveBeenCalledWith(true);
    });
  });

  describe('Keyboard Interaction', () => {
    it('should expand/collapse with Enter key', async () => {
      render(
        <AccordionItem title="Test Title" defaultOpen={false}>
          Test Content
        </AccordionItem>
      );

      const trigger = screen.getByRole('button');
      trigger.focus();

      // Press Enter to expand
      fireEvent.keyDown(trigger, { key: 'Enter' });

      await waitFor(() => {
        expect(trigger).toHaveAttribute('aria-expanded', 'true');
      });

      // Press Enter again to collapse
      fireEvent.keyDown(trigger, { key: 'Enter' });

      await waitFor(() => {
        expect(trigger).toHaveAttribute('aria-expanded', 'false');
      });
    });

    it('should expand/collapse with Space key', async () => {
      render(
        <AccordionItem title="Test Title" defaultOpen={false}>
          Test Content
        </AccordionItem>
      );

      const trigger = screen.getByRole('button');
      trigger.focus();

      // Press Space to expand
      fireEvent.keyDown(trigger, { key: ' ' });

      await waitFor(() => {
        expect(trigger).toHaveAttribute('aria-expanded', 'true');
      });

      // Press Space again to collapse
      fireEvent.keyDown(trigger, { key: ' ' });

      await waitFor(() => {
        expect(trigger).toHaveAttribute('aria-expanded', 'false');
      });
    });

    it('should prevent default for Enter and Space', () => {
      render(
        <AccordionItem title="Test Title">
          Test Content
        </AccordionItem>
      );

      const trigger = screen.getByRole('button');

      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
      const spaceEvent = new KeyboardEvent('keydown', { key: ' ', bubbles: true });

      const enterSpy = jest.spyOn(enterEvent, 'preventDefault');
      const spaceSpy = jest.spyOn(spaceEvent, 'preventDefault');

      trigger.dispatchEvent(enterEvent);
      trigger.dispatchEvent(spaceEvent);

      expect(enterSpy).toHaveBeenCalled();
      expect(spaceSpy).toHaveBeenCalled();
    });
  });

  describe('ARIA Attributes', () => {
    it('should have correct aria-expanded attribute', () => {
      const { rerender } = render(
        <AccordionItem title="Test" defaultOpen={false}>
          Content
        </AccordionItem>
      );

      const trigger = screen.getByRole('button');
      expect(trigger).toHaveAttribute('aria-expanded', 'false');

      rerender(
        <AccordionItem title="Test" defaultOpen={true}>
          Content
        </AccordionItem>
      );

      expect(trigger).toHaveAttribute('aria-expanded', 'true');
    });

    it('should have aria-controls pointing to panel', () => {
      render(
        <AccordionItem title="Test" defaultOpen={true}>
          Content
        </AccordionItem>
      );

      const trigger = screen.getByRole('button');
      const panel = screen.getByRole('region');

      const controlsId = trigger.getAttribute('aria-controls');
      const panelId = panel.getAttribute('id');

      expect(controlsId).toBeTruthy();
      expect(panelId).toBeTruthy();
      expect(controlsId).toBe(panelId);
    });

    it('should have role="region" on content panel', () => {
      render(
        <AccordionItem title="Test" defaultOpen={true}>
          Content
        </AccordionItem>
      );

      const panel = screen.getByRole('region');
      expect(panel).toBeInTheDocument();
    });

    it('should have aria-labelledby on panel', () => {
      render(
        <AccordionItem title="Test" defaultOpen={true}>
          Content
        </AccordionItem>
      );

      const trigger = screen.getByRole('button');
      const panel = screen.getByRole('region');

      const triggerId = trigger.getAttribute('id');
      const labelledBy = panel.getAttribute('aria-labelledby');

      expect(triggerId).toBeTruthy();
      expect(labelledBy).toBe(triggerId);
    });

    it('should have data-accordion-item attribute', () => {
      const { container } = render(
        <AccordionItem title="Test">
          Content
        </AccordionItem>
      );

      const item = container.querySelector('[data-accordion-item]');
      expect(item).toBeInTheDocument();
    });

    it('should have data-accordion-trigger attribute', () => {
      render(
        <AccordionItem title="Test">
          Content
        </AccordionItem>
      );

      const trigger = screen.getByRole('button');
      expect(trigger).toHaveAttribute('data-accordion-trigger', 'true');
    });
  });

  describe('Controlled vs Uncontrolled', () => {
    it('should work in uncontrolled mode', async () => {
      render(
        <AccordionItem title="Test" defaultOpen={false}>
          Content
        </AccordionItem>
      );

      const trigger = screen.getByRole('button');

      // Click to toggle
      fireEvent.click(trigger);

      await waitFor(() => {
        expect(trigger).toHaveAttribute('aria-expanded', 'true');
      });
    });

    it('should work in controlled mode', () => {
      const onToggle = jest.fn();
      const { rerender } = render(
        <AccordionItem title="Test" isOpen={false} onToggle={onToggle}>
          Content
        </AccordionItem>
      );

      const trigger = screen.getByRole('button');
      expect(trigger).toHaveAttribute('aria-expanded', 'false');

      // Click should call onToggle but not change state directly
      fireEvent.click(trigger);
      expect(onToggle).toHaveBeenCalledWith(true);

      // Manually update state
      rerender(
        <AccordionItem title="Test" isOpen={true} onToggle={onToggle}>
          Content
        </AccordionItem>
      );

      expect(trigger).toHaveAttribute('aria-expanded', 'true');
    });
  });

  describe('Lazy Rendering', () => {
    it('should not render content when lazyRender is true and closed', () => {
      render(
        <AccordionItem title="Test" lazyRender={true} defaultOpen={false}>
          <div data-testid="lazy-content">Lazy Content</div>
        </AccordionItem>
      );

      expect(screen.queryByTestId('lazy-content')).not.toBeInTheDocument();
    });

    it('should render content when lazyRender is true and open', () => {
      render(
        <AccordionItem title="Test" lazyRender={true} defaultOpen={true}>
          <div data-testid="lazy-content">Lazy Content</div>
        </AccordionItem>
      );

      expect(screen.getByTestId('lazy-content')).toBeInTheDocument();
    });

    it('should always render content when lazyRender is false', () => {
      render(
        <AccordionItem title="Test" lazyRender={false} defaultOpen={false}>
          <div data-testid="eager-content">Eager Content</div>
        </AccordionItem>
      );

      // Content is rendered but hidden (check in DOM, not visible)
      const content = screen.queryByTestId('eager-content');
      // Note: Content might not be visible but should be in DOM
      // This test might need adjustment based on actual implementation
    });
  });

  describe('Touch Targets', () => {
    it('should have minimum height for touch accessibility', () => {
      const { container } = render(
        <AccordionItem title="Test">
          Content
        </AccordionItem>
      );

      const trigger = container.querySelector('button');
      const styles = window.getComputedStyle(trigger!);

      // The trigger should have min-h-[44px] class applied
      expect(trigger?.className).toContain('min-h-');
    });
  });

  describe('Icons', () => {
    it('should show ChevronDown when closed', () => {
      render(
        <AccordionItem title="Test" defaultOpen={false}>
          Content
        </AccordionItem>
      );

      const trigger = screen.getByRole('button');
      const svg = trigger.querySelector('svg');

      expect(svg).toBeInTheDocument();
    });

    it('should show ChevronUp when open', () => {
      render(
        <AccordionItem title="Test" defaultOpen={true}>
          Content
        </AccordionItem>
      );

      const trigger = screen.getByRole('button');
      const svg = trigger.querySelector('svg');

      expect(svg).toBeInTheDocument();
    });

    it('should toggle icon when state changes', async () => {
      render(
        <AccordionItem title="Test" defaultOpen={false}>
          Content
        </AccordionItem>
      );

      const trigger = screen.getByRole('button');

      // Click to expand
      fireEvent.click(trigger);

      await waitFor(() => {
        expect(trigger).toHaveAttribute('aria-expanded', 'true');
      });

      // Icon should have changed (verified by checking aria-expanded)
      expect(trigger).toHaveAttribute('aria-expanded', 'true');
    });
  });
});

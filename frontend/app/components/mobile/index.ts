// Mobile Component Library
// Comprehensive mobile-first UI components for BhriguWelt

// Sheet & Drawer Components
export { default as MobileSheet, MobileActionSheet } from './MobileSheet';
export { default as MobileDrawer, MobileNavDrawer } from './MobileDrawer';

// Header & Navigation
export { default as MobileHeader, MobileCompactHeader } from './MobileHeader';

// Layout Components
export {
  default as MobileLayout,
  MobileContainer,
  MobileSection,
  MobileGrid,
  MobileStack,
  MobileRow,
  MobileDivider,
  MobileSpacer,
} from './MobileLayout';

// Input Components
export {
  MobileInput,
  MobileTextarea,
  MobileSearchInput,
  MobileSelect,
  MobileDateInput,
} from './MobileInput';

// Button Components
export {
  MobileButton,
  MobileIconButton,
  MobileFAB,
  MobileButtonGroup,
  MobileSegmentedControl,
} from './MobileButton';

// Card Components
export {
  MobileCard,
  MobileListItem,
  MobileFeatureCard,
  MobileStatCard,
  MobileCardStack,
} from './MobileCard';

// Gesture Hooks
export {
  useSwipeGesture,
  usePullToRefresh,
  useLongPress,
  useDoubleTap,
  usePinchZoom,
} from './hooks/useGestures';

// Scroll Hooks
export {
  useScrollDirection,
  useScrollPosition,
  useInfiniteScroll,
  useScrollTo,
  useScrollLock,
  useInView,
} from './hooks/useScroll';

// Utility Hooks
export {
  useHapticFeedback,
  useMobileDetection,
  useViewportSize,
  useSafeAreaInsets,
  useReducedMotion,
  useNetworkStatus,
  useKeyboardVisibility,
  useColorScheme,
} from './hooks/useMobileUtils';

// Type exports
export type { NavItem } from './MobileDrawer';

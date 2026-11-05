'use client';

import { memo } from 'react';

/**
 * Nadi Gold keeps the night-sky backdrop on <body> (globals.css); pages no
 * longer layer animated orbs or floating emoji on top. These exports stay so
 * existing screens keep compiling, and render nothing.
 */
function AnimatedBackground() {
  return null;
}

export const FloatingElements = memo(function FloatingElements() {
  return null;
});

export default memo(AnimatedBackground);

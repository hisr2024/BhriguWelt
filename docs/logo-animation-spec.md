# BhriguWelt Animated Logo Specification

## Overview
This document specifies the design requirements and implementation guidelines for the BhriguWelt animated logo, which should embody sacred geometry principles and mystical Vedic aesthetics while maintaining optimal performance.

---

## Logo Format Requirements

### Primary Format: SVG
- **Resolution-independent** vector graphics
- **Inline SVG** preferred for CSS animation support
- **Optimized** with SVGO or similar tools
- **File size target**: < 20KB uncompressed
- **Viewbox**: `0 0 200 200` (recommended)
- **Color space**: RGB or HSL for web compatibility

### Secondary Format: PNG
- **Fallback** for environments where SVG is not supported
- **Resolutions**:
  - `logo@1x.png` (200×200px) - Standard
  - `logo@2x.png` (400×400px) - Retina/HiDPI
  - `logo@3x.png` (600×600px) - Ultra-high resolution displays
- **Format**: PNG-24 with alpha transparency
- **Optimization**: Use TinyPNG or similar tools
- **File size target**: < 50KB per resolution

### Monochrome Variant
- **Purpose**: Email signatures, print materials, and dark/light theme adaptations
- **Formats**: Both SVG and PNG
- **Colors**:
  - Pure white (`#FFFFFF`) for dark backgrounds
  - Pure black (`#000000`) for light backgrounds
  - Cosmic gray (`#2D3748`) for neutral contexts

---

## Animation Specification

### Animation Engine: Lottie JSON (Preferred)

**Why Lottie?**
- Industry-standard for complex web animations
- Exported from Adobe After Effects or similar tools
- JSON format allows programmatic control
- Cross-platform compatibility

**Technical Requirements:**
- **File format**: `.json` (Lottie/BodyMovin format)
- **Performance budget**: < 150KB compressed
- **Frame rate**: 30-60 fps (depending on complexity)
- **Duration**: 3-6 seconds loop
- **Easing**: Use sacred geometry-inspired easings (e.g., golden ratio curves)
- **Layers**: Minimize to < 20 layers for optimal performance
- **Export settings**:
  - ✅ Compress JSON
  - ✅ Include metadata
  - ✅ Optimize expressions
  - ❌ No external image assets (inline only)

**Lottie Library:**
```javascript
import lottie from 'lottie-web';
// or use @lottiefiles/react-lottie-player for React
```

### Fallback: Pure CSS Animation

**When to use:**
- Lottie file not available or too large
- Performance constraints on low-end devices
- Simplified animation requirements

**CSS Animation Principles:**
```css
@keyframes bhrigu-sacred-spin {
  0% {
    transform: rotate(0deg) scale(1);
    filter: drop-shadow(0 0 8px rgba(77, 238, 234, 0.6));
  }
  50% {
    transform: rotate(180deg) scale(1.05);
    filter: drop-shadow(0 0 16px rgba(190, 242, 100, 0.8));
  }
  100% {
    transform: rotate(360deg) scale(1);
    filter: drop-shadow(0 0 8px rgba(77, 238, 234, 0.6));
  }
}

.logo-animated {
  animation: bhrigu-sacred-spin 6s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite;
}
```

---

## Motion Language & Design Principles

### Sacred Geometry Inspiration
- **Sri Yantra patterns**: Concentric triangles and lotus petals
- **Mandala rotation**: Smooth, meditative 360° rotations
- **Golden ratio (φ = 1.618)**: Use in timing curves and scaling
- **Fibonacci sequence**: Layer animation offsets (1, 1, 2, 3, 5, 8...)

### Visual Effects
1. **Subtle Glow**:
   - Pulsing neon cyan (`#4DEEEA`) → neon lime (`#BEF264`) gradient
   - Opacity range: 40%-80%
   - Pulse duration: 2-3 seconds

2. **Particle Trails** (optional for advanced version):
   - Star-like particles following logo curves
   - Color: `#FACC15` (neon yellow)
   - Fade out over 1.5 seconds

3. **Geometric Transformations**:
   - **Scale**: 1.0 → 1.08 → 1.0 (breathing effect)
   - **Rotation**: Smooth 360° rotation over 6 seconds
   - **Opacity**: Stable at 100% (no flickering)

### Accessibility Considerations
- **Respect `prefers-reduced-motion`**:
  ```css
  @media (prefers-reduced-motion: reduce) {
    .logo-animated {
      animation: none !important;
    }
  }
  ```
- **Pause/Play controls**: Provide user toggle for animation
- **Alt text**: "BhriguWelt - Ancient Vedic Astrology Platform"

---

## Performance Budget

### Load Impact
- **First Contentful Paint (FCP)**: < 1.5s
- **Logo load time**: < 1.0s
- **Animation initialization**: < 500ms
- **CPU usage**: < 5% on average desktop
- **Memory footprint**: < 10MB

### Optimization Techniques
1. **Lazy loading**: Load animation after critical content
2. **Intersection Observer**: Trigger animation only when logo is visible
3. **Web Workers** (for complex Lottie): Offload JSON parsing
4. **Preload hint**:
   ```html
   <link rel="preload" href="/logo.json" as="fetch" crossorigin />
   ```

---

## Placement Rules

### Homepage Header
- **Position**: Top-left corner
- **Desktop size**: 80px × 80px (min) to 120px × 120px (max)
- **Mobile size**: 60px × 60px (min) to 80px × 80px (max)
- **Margin**: 16px from viewport edges
- **Z-index**: 1000 (above most content, below modals)

### Responsive Scaling
```css
.logo-container {
  width: clamp(60px, 10vw, 120px);
  height: clamp(60px, 10vw, 120px);
}
```

### Dark/Light Theme Adaptation
- **Dark theme** (default): Neon cyan/lime gradients
- **Light theme**: Deeper purples and blues with reduced glow
- **Automatic switching**: Based on CSS `prefers-color-scheme`

---

## Asset Checklist

### Required Files
- [ ] `logo.svg` - Primary SVG source (optimized)
- [ ] `logo.json` - Lottie animation file
- [ ] `logo@1x.png`, `logo@2x.png`, `logo@3x.png` - PNG fallbacks
- [ ] `logo-mono-white.svg` - Monochrome white variant
- [ ] `logo-mono-black.svg` - Monochrome black variant
- [ ] `logo-static.svg` - Static version for print/email

### Optional/Advanced
- [ ] `logo-particle-trail.json` - Enhanced version with particles
- [ ] `logo-frames/` - Frame-by-frame sprite sheet (for GIF export)
- [ ] `logo.webp` - WebP format for modern browsers

---

## Implementation Example

### React Component
```tsx
'use client';

import { useEffect, useRef, useState } from 'react';

export function AnimatedLogo() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [useFallback, setUseFallback] = useState(false);

  useEffect(() => {
    const loadLottie = async () => {
      try {
        const lottie = await import('lottie-web');
        const response = await fetch('/logo.json');
        const animationData = await response.json();

        if (containerRef.current) {
          lottie.default.loadAnimation({
            container: containerRef.current,
            animationData,
            loop: true,
            autoplay: true,
            renderer: 'svg',
          });
        }
      } catch (error) {
        console.warn('Lottie failed to load, using CSS fallback', error);
        setUseFallback(true);
      }
    };

    void loadLottie();
  }, []);

  if (useFallback) {
    return (
      <div className="logo-fallback">
        <svg className="logo-animated" viewBox="0 0 200 200">
          {/* SVG path data */}
        </svg>
      </div>
    );
  }

  return <div ref={containerRef} className="logo-container" aria-label="BhriguWelt Logo" />;
}
```

---

## Font Choices (for logo text if applicable)

### Primary Font: **Cinzel** (Serif)
- **Weight**: 600 (Semi-bold)
- **Purpose**: Sacred, classical feel for "BhriguWelt"
- **Fallback**: Georgia, Times New Roman, serif

### Secondary Font: **Inter** (Sans-serif)
- **Weight**: 500 (Medium)
- **Purpose**: Taglines or modern UI contexts
- **Fallback**: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif

### Devanagari Font (for Sanskrit text): **Noto Sans Devanagari**
- **Weight**: 400 (Regular)
- **Purpose**: Om symbol (ॐ) or Sanskrit mantras
- **Fallback**: System Devanagari fonts

---

## Version Control & Iteration

### Versioning Scheme
- **v1.0**: Initial static SVG logo
- **v1.1**: CSS-animated version
- **v2.0**: Lottie-based animation with sacred geometry
- **v2.1**: Enhanced with particle trails
- **v3.0**: Interactive logo responding to mouse hover/scroll

### Design Review Checklist
1. ✅ Aligns with Bhrigu Samhita mystical aesthetic
2. ✅ Performance budget met (< 150KB, < 1s load)
3. ✅ Accessible (reduced motion support)
4. ✅ Responsive across devices
5. ✅ Brand consistency across variants
6. ✅ Animation loop is smooth and non-distracting

---

## Contact & Collaboration

For design assets, please provide:
- **Adobe Illustrator** (.ai) or **Figma** source files
- **After Effects** project (.aep) for Lottie export
- **Color palette** reference (hex codes)
- **Animation storyboard** or reference videos

---

**Last Updated**: 2026-01-01
**Maintained By**: BhriguWelt Design Team

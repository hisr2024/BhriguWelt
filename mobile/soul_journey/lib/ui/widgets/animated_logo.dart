import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../theme/app_theme.dart';

/// Animated Logo Widget - Sacred Geometry Design
///
/// Recreates the beautiful animated logo from the web frontend:
/// - Sacred triangles (Shiva/Shakti energy)
/// - Concentric circles (cosmic boundary)
/// - Om symbol in center
/// - Gradient colors matching brand
/// - Smooth rotation and pulse animations
class AnimatedLogo extends StatefulWidget {
  final double size;
  final bool animate;

  const AnimatedLogo({
    Key? key,
    this.size = 120,
    this.animate = true,
  }) : super(key: key);

  @override
  State<AnimatedLogo> createState() => _AnimatedLogoState();
}

class _AnimatedLogoState extends State<AnimatedLogo>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _rotationAnimation;
  late Animation<double> _pulseAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(seconds: 6),
      vsync: this,
    );

    _rotationAnimation = Tween<double>(
      begin: 0,
      end: 2 * math.pi,
    ).animate(CurvedAnimation(
      parent: _controller,
      curve: Curves.easeInOut,
    ));

    _pulseAnimation = Tween<double>(
      begin: 0.6,
      end: 1.0,
    ).animate(CurvedAnimation(
      parent: _controller,
      curve: Curves.easeInOut,
    ));

    if (widget.animate) {
      _controller.repeat();
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: widget.size,
      height: widget.size,
      child: AnimatedBuilder(
        animation: _controller,
        builder: (context, child) {
          return Transform.rotate(
            angle: widget.animate ? _rotationAnimation.value : 0,
            child: CustomPaint(
              painter: _SacredGeometryPainter(
                pulseValue: widget.animate ? _pulseAnimation.value : 0.8,
              ),
              size: Size(widget.size, widget.size),
            ),
          );
        },
      ),
    );
  }
}

/// Custom painter for sacred geometry logo
class _SacredGeometryPainter extends CustomPainter {
  final double pulseValue;

  _SacredGeometryPainter({required this.pulseValue});

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = size.width / 2;

    // Create gradient shader
    final gradientShader = const LinearGradient(
      colors: [AppColors.cyan, AppColors.purple, AppColors.lime],
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
    ).createShader(Rect.fromCircle(center: center, radius: radius));

    // Outer circle - cosmic boundary
    final outerCirclePaint = Paint()
      ..shader = gradientShader
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2
      ..color = AppColors.cyan.withOpacity(0.6 * pulseValue);

    canvas.drawCircle(
      center,
      radius * 0.9,
      outerCirclePaint,
    );

    // Inner circle
    final innerCirclePaint = Paint()
      ..shader = gradientShader
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.5
      ..color = AppColors.purple.withOpacity(0.4 * pulseValue);

    canvas.drawCircle(
      center,
      radius * 0.7,
      innerCirclePaint,
    );

    // Sacred triangles - upward (Shiva energy)
    final upwardTrianglePaint = Paint()
      ..shader = gradientShader
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2
      ..color = AppColors.cyan.withOpacity(pulseValue);

    final upwardTriangle = Path()
      ..moveTo(center.dx, center.dy - radius * 0.7) // Top
      ..lineTo(center.dx + radius * 0.4, center.dy + radius * 0.1) // Bottom right
      ..lineTo(center.dx - radius * 0.4, center.dy + radius * 0.1) // Bottom left
      ..close();

    canvas.drawPath(upwardTriangle, upwardTrianglePaint);

    // Downward triangle (Shakti energy)
    final downwardTrianglePaint = Paint()
      ..shader = gradientShader
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2
      ..color = AppColors.purple.withOpacity(pulseValue);

    final downwardTriangle = Path()
      ..moveTo(center.dx, center.dy + radius * 0.7) // Bottom
      ..lineTo(center.dx - radius * 0.4, center.dy - radius * 0.1) // Top left
      ..lineTo(center.dx + radius * 0.4, center.dy - radius * 0.1) // Top right
      ..close();

    canvas.drawPath(downwardTriangle, downwardTrianglePaint);

    // Central hexagram
    final hexagonPaint = Paint()
      ..shader = gradientShader
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2
      ..color = AppColors.lime.withOpacity(pulseValue);

    final hexagonFillPaint = Paint()
      ..color = AppColors.cyan.withOpacity(0.1 * pulseValue)
      ..style = PaintingStyle.fill;

    final hexagon = Path()
      ..moveTo(center.dx, center.dy - radius * 0.4) // Top
      ..lineTo(center.dx + radius * 0.3, center.dy) // Right
      ..lineTo(center.dx, center.dy + radius * 0.4) // Bottom
      ..lineTo(center.dx - radius * 0.3, center.dy) // Left
      ..close();

    canvas.drawPath(hexagon, hexagonFillPaint);
    canvas.drawPath(hexagon, hexagonPaint);

    // Draw Om symbol in center using TextPainter
    final omTextPainter = TextPainter(
      text: TextSpan(
        text: 'ॐ',
        style: TextStyle(
          fontSize: radius * 0.4,
          fontFamily: 'NotoSansDevanagari',
          fontWeight: FontWeight.w600,
          foreground: Paint()..shader = gradientShader,
        ),
      ),
      textDirection: TextDirection.ltr,
    );

    omTextPainter.layout();
    omTextPainter.paint(
      canvas,
      Offset(
        center.dx - omTextPainter.width / 2,
        center.dy - omTextPainter.height / 2,
      ),
    );

    // Small decorative circles at cardinal points
    final decorativeCirclePaint = Paint()
      ..style = PaintingStyle.fill;

    // Top - cyan
    decorativeCirclePaint.color = AppColors.cyan.withOpacity(0.8 * pulseValue);
    canvas.drawCircle(
      Offset(center.dx, center.dy - radius * 0.9),
      radius * 0.03,
      decorativeCirclePaint,
    );

    // Right - purple
    decorativeCirclePaint.color = AppColors.purple.withOpacity(0.8 * pulseValue);
    canvas.drawCircle(
      Offset(center.dx + radius * 0.9, center.dy),
      radius * 0.03,
      decorativeCirclePaint,
    );

    // Bottom - lime
    decorativeCirclePaint.color = AppColors.lime.withOpacity(0.8 * pulseValue);
    canvas.drawCircle(
      Offset(center.dx, center.dy + radius * 0.9),
      radius * 0.03,
      decorativeCirclePaint,
    );

    // Left - yellow
    decorativeCirclePaint.color = AppColors.yellow.withOpacity(0.8 * pulseValue);
    canvas.drawCircle(
      Offset(center.dx - radius * 0.9, center.dy),
      radius * 0.03,
      decorativeCirclePaint,
    );
  }

  @override
  bool shouldRepaint(covariant _SacredGeometryPainter oldDelegate) {
    return oldDelegate.pulseValue != pulseValue;
  }
}

/// Simplified logo for smaller sizes (app bar, etc.)
class SimpleLogo extends StatelessWidget {
  final double size;

  const SimpleLogo({
    Key? key,
    this.size = 32,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return AnimatedLogo(
      size: size,
      animate: false,
    );
  }
}

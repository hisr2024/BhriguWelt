import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../theme/app_theme.dart';
import '../widgets/animated_logo.dart';

/// Home Screen - Main entry point after authentication
///
/// Features:
/// - Animated logo matching web frontend
/// - Staggered card animations
/// - Gradient text effects
/// - Profile list
/// - Navigation to create new profile or view wisdom library
class HomeScreen extends StatelessWidget {
  const HomeScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          child: Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Hero Section with Animated Logo
                _buildHeroSection(context)
                    .animate()
                    .fadeIn(duration: 800.ms, delay: 100.ms)
                    .scale(begin: const Offset(0.5, 0.5), end: const Offset(1, 1)),

                const SizedBox(height: 32),

                // Welcome Card
                _buildWelcomeCard(context)
                    .animate()
                    .fadeIn(duration: 600.ms, delay: 300.ms)
                    .slideY(begin: 0.2, end: 0),

                const SizedBox(height: 24),

                // About Bhrigu Samhita Card
                _buildBhriguCard(context)
                    .animate()
                    .fadeIn(duration: 600.ms, delay: 450.ms)
                    .slideY(begin: 0.2, end: 0),

                const SizedBox(height: 24),

                // About Nadi Jyotisha Card
                _buildNadiCard(context)
                    .animate()
                    .fadeIn(duration: 600.ms, delay: 600.ms)
                    .slideY(begin: 0.2, end: 0),

                const SizedBox(height: 24),

                // Action Buttons
                _buildActionButtons(context)
                    .animate()
                    .fadeIn(duration: 600.ms, delay: 750.ms)
                    .slideY(begin: 0.2, end: 0),

                const SizedBox(height: 32),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildHeroSection(BuildContext context) {
    return Column(
      children: [
        const SizedBox(height: 32),

        // Animated Logo
        const AnimatedLogo(size: 150)
            .animate(onPlay: (controller) => controller.repeat())
            .scale(
              duration: 1000.ms,
              begin: const Offset(1, 1),
              end: const Offset(1.03, 1.03),
              curve: Curves.easeInOut,
            )
            .then()
            .scale(
              duration: 1000.ms,
              begin: const Offset(1.03, 1.03),
              end: const Offset(1, 1),
              curve: Curves.easeInOut,
            ),

        const SizedBox(height: 24),

        // Title with Gradient
        const GradientText(
          text: 'Soul Journey',
          style: TextStyle(
            fontSize: 36,
            fontWeight: FontWeight.w800,
          ),
        )
            .animate()
            .fadeIn(duration: 800.ms, delay: 300.ms)
            .slideY(begin: 0.3, end: 0),

        const SizedBox(height: 12),

        // Subtitle
        Text(
          'Ancient Vedic Wisdom Meets Modern Insight',
          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                color: AppColors.purple,
                fontWeight: FontWeight.w600,
              ),
          textAlign: TextAlign.center,
        )
            .animate()
            .fadeIn(duration: 800.ms, delay: 500.ms),
      ],
    );
  }

  Widget _buildWelcomeCard(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        gradient: AppColors.cardGradient1,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: AppColors.cyan.withOpacity(0.3),
          width: 1,
        ),
      ),
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text(
                '🙏',
                style: Theme.of(context).textTheme.displayMedium,
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Text(
                  'Welcome, Seeker',
                  style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                        color: AppColors.purple,
                        fontWeight: FontWeight.w700,
                      ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Text(
            'Discover your soul\'s journey through ancient wisdom. All your data remains encrypted and secure on your device.',
            style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                  height: 1.6,
                ),
          ),
        ],
      ),
    );
  }

  Widget _buildBhriguCard(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0x144DEEEA), Color(0x148A5CF6)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: AppColors.cyan.withOpacity(0.3),
          width: 1,
        ),
      ),
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text(
                '📜',
                style: Theme.of(context).textTheme.displayMedium,
              )
                  .animate(onPlay: (controller) => controller.repeat())
                  .rotate(
                    duration: 4000.ms,
                    begin: 0,
                    end: 1,
                    curve: Curves.easeInOut,
                  )
                  .scale(
                    duration: 4000.ms,
                    begin: const Offset(1, 1),
                    end: const Offset(1.1, 1.1),
                    curve: Curves.easeInOut,
                  )
                  .then()
                  .scale(
                    duration: 4000.ms,
                    begin: const Offset(1.1, 1.1),
                    end: const Offset(1, 1),
                    curve: Curves.easeInOut,
                  ),
              const SizedBox(width: 16),
              Expanded(
                child: Text(
                  'About Bhrigu Samhita',
                  style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                        color: AppColors.purple,
                        fontWeight: FontWeight.w700,
                      ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Text(
            'The Bhrigu Samhita is one of the most revered ancient texts in Vedic astrology, attributed to Maharishi Bhrigu. This sacred manuscript contains detailed horoscopes compiled over 5,000 years ago.',
            style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                  height: 1.6,
                ),
          ),
          const SizedBox(height: 16),
          _buildFeatureChips([
            '🌟 Ancient Wisdom',
            '🔮 Precise Predictions',
            '🕉️ Karmic Insights',
          ]),
        ],
      ),
    );
  }

  Widget _buildNadiCard(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        gradient: AppColors.cardGradient2,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: AppColors.purple.withOpacity(0.3),
          width: 1,
        ),
      ),
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text(
                '🌙',
                style: Theme.of(context).textTheme.displayMedium,
              )
                  .animate(onPlay: (controller) => controller.repeat())
                  .slideY(
                    duration: 3000.ms,
                    begin: 0,
                    end: -0.1,
                    curve: Curves.easeInOut,
                  )
                  .rotate(
                    duration: 3000.ms,
                    begin: 0,
                    end: 0.02,
                    curve: Curves.easeInOut,
                  )
                  .then()
                  .slideY(
                    duration: 3000.ms,
                    begin: -0.1,
                    end: 0,
                    curve: Curves.easeInOut,
                  )
                  .rotate(
                    duration: 3000.ms,
                    begin: 0.02,
                    end: -0.02,
                    curve: Curves.easeInOut,
                  )
                  .then()
                  .rotate(
                    duration: 3000.ms,
                    begin: -0.02,
                    end: 0,
                    curve: Curves.easeInOut,
                  ),
              const SizedBox(width: 16),
              Expanded(
                child: Text(
                  'About Nadi Jyotisha',
                  style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                        color: AppColors.purple,
                        fontWeight: FontWeight.w700,
                      ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Text(
            'Nadi Jyotisha is an ancient form of Hindu astrology practiced in Tamil Nadu. It is based on the belief that ancient sages wrote the life patterns of every human being on palm leaves thousands of years ago.',
            style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                  height: 1.6,
                ),
          ),
          const SizedBox(height: 16),
          _buildFeatureChips([
            '📚 Palm Leaf Manuscripts',
            '🎯 Personal Destiny',
            '🌸 Remedial Solutions',
          ]),
        ],
      ),
    );
  }

  Widget _buildFeatureChips(List<String> features) {
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: features
          .map(
            (feature) => Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: AppColors.white.withOpacity(0.5),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(
                  color: AppColors.purple.withOpacity(0.15),
                ),
              ),
              child: Text(
                feature,
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ),
          )
          .toList(),
    );
  }

  Widget _buildActionButtons(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        ElevatedButton.icon(
          onPressed: () {
            // TODO: Navigate to create profile screen
          },
          icon: const Icon(Icons.add_circle_outline),
          label: const Text('Create New Profile'),
          style: ElevatedButton.styleFrom(
            padding: const EdgeInsets.all(20),
          ),
        )
            .animate()
            .scale(
              duration: 300.ms,
              curve: Curves.easeOut,
            )
            .shimmer(
              duration: 2000.ms,
              delay: 1000.ms,
            ),

        const SizedBox(height: 12),

        OutlinedButton.icon(
          onPressed: () {
            // TODO: Navigate to profiles list
          },
          icon: const Icon(Icons.people_outline),
          label: const Text('View Saved Profiles'),
          style: OutlinedButton.styleFrom(
            padding: const EdgeInsets.all(20),
          ),
        )
            .animate()
            .fadeIn(duration: 600.ms, delay: 900.ms),

        const SizedBox(height: 12),

        OutlinedButton.icon(
          onPressed: () {
            // TODO: Navigate to wisdom library
          },
          icon: const Icon(Icons.library_books_outlined),
          label: const Text('Wisdom Library'),
          style: OutlinedButton.styleFrom(
            padding: const EdgeInsets.all(20),
          ),
        )
            .animate()
            .fadeIn(duration: 600.ms, delay: 1050.ms),
      ],
    );
  }
}

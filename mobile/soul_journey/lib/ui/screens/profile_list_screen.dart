import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../theme/app_theme.dart';
import '../../data/repositories/profile_repository.dart';
import '../../data/repositories/report_repository.dart';
import '../../data/models/profile_model.dart';
import '../../data/models/report_model.dart';
import '../../data/database/database_helper.dart';

/// Riverpod Providers
final profileRepositoryProvider = Provider((ref) {
  return ProfileRepository(DatabaseHelper());
});

final reportRepositoryProvider = Provider((ref) {
  return ReportRepository(dbHelper: DatabaseHelper());
});

final profilesProvider = FutureProvider.autoDispose<List<ProfileModel>>((ref) async {
  final repository = ref.watch(profileRepositoryProvider);
  return repository.getAllProfiles();
});

/// Profile list screen showing all saved profiles
///
/// Features:
/// - Display list of profiles with birth details
/// - Show age calculation
/// - Tap to view/generate report
/// - Delete profile with confirmation
/// - Search profiles
class ProfileListScreen extends ConsumerStatefulWidget {
  const ProfileListScreen({Key? key}) : super(key: key);

  @override
  ConsumerState<ProfileListScreen> createState() => _ProfileListScreenState();
}

class _ProfileListScreenState extends ConsumerState<ProfileListScreen> {
  final _searchController = TextEditingController();
  List<ProfileModel> _filteredProfiles = [];

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _filterProfiles(List<ProfileModel> profiles) {
    final query = _searchController.text.toLowerCase();
    if (query.isEmpty) {
      setState(() => _filteredProfiles = profiles);
    } else {
      setState(() {
        _filteredProfiles = profiles
            .where((profile) => profile.name.toLowerCase().contains(query))
            .toList();
      });
    }
  }

  Future<void> _deleteProfile(ProfileModel profile) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Profile?'),
        content: Text(
          'Are you sure you want to delete ${profile.name}\'s profile? This action cannot be undone.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            style: TextButton.styleFrom(
              foregroundColor: AppColors.error,
            ),
            child: const Text('Delete'),
          ),
        ],
      ),
    );

    if (confirm ?? false) {
      try {
        final repository = ref.read(profileRepositoryProvider);
        await repository.deleteProfile(profile.id);

        if (mounted) {
          ref.refresh(profilesProvider);
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Profile deleted')),
          );
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Failed to delete profile: $e')),
          );
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final profilesAsync = ref.watch(profilesProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Saved Profiles'),
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.add_circle_outline),
            onPressed: () async {
              final result = await Navigator.of(context)
                  .pushNamed('/create-profile');
              if (result != null && mounted) {
                ref.refresh(profilesProvider);
              }
            },
          ),
        ],
      ),
      body: SafeArea(
        child: profilesAsync.when(
          data: (profiles) {
            _filterProfiles(profiles);

            if (profiles.isEmpty) {
              return _buildEmptyState(context);
            }

            return Column(
              children: [
                // Search Bar
                _buildSearchBar(context),

                const SizedBox(height: 16),

                // Profiles List
                Expanded(
                  child: _filteredProfiles.isEmpty
                      ? _buildNoResultsState(context)
                      : ListView.builder(
                    itemCount: _filteredProfiles.length,
                    itemBuilder: (context, index) {
                      final profile = _filteredProfiles[index];
                      return _buildProfileCard(context, profile, index);
                    },
                  ),
                ),
              ],
            );
          },
          loading: () => _buildLoadingState(),
          error: (error, stack) => _buildErrorState(context, error),
        ),
      ),
    );
  }

  Widget _buildSearchBar(BuildContext context) {
    return Container(
      margin: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.white,
        border: Border.all(color: AppColors.gray300),
        borderRadius: BorderRadius.circular(8),
      ),
      child: TextField(
        controller: _searchController,
        onChanged: (value) {
          setState(() {});
        },
        decoration: InputDecoration(
          hintText: 'Search profiles...',
          prefixIcon: const Icon(Icons.search),
          suffixIcon: _searchController.text.isNotEmpty
              ? IconButton(
            icon: const Icon(Icons.clear),
            onPressed: () {
              _searchController.clear();
              setState(() {});
            },
          )
              : null,
          border: InputBorder.none,
          contentPadding: const EdgeInsets.symmetric(
            horizontal: 16,
            vertical: 12,
          ),
        ),
      ),
    );
  }

  Widget _buildProfileCard(
      BuildContext context,
      ProfileModel profile,
      int index,
      ) {
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: InkWell(
        onTap: () {
          Navigator.of(context).pushNamed(
            '/report-viewer',
            arguments: profile,
          );
        },
        child: Container(
          decoration: BoxDecoration(
            gradient: index.isEven
                ? AppColors.cardGradient1
                : AppColors.cardGradient2,
            borderRadius: BorderRadius.circular(12),
          ),
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header
              Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          profile.name,
                          style: Theme.of(context)
                              .textTheme
                              .titleLarge
                              ?.copyWith(
                            color: AppColors.purple,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Age ${profile.age} • ${profile.placeOfBirth}',
                          style: Theme.of(context)
                              .textTheme
                              .bodySmall
                              ?.copyWith(
                            color: AppColors.textSecondary,
                          ),
                        ),
                      ],
                    ),
                  ),
                  PopupMenuButton(
                    itemBuilder: (context) => [
                      PopupMenuItem(
                        child: const Text('Delete'),
                        onTap: () {
                          Future.delayed(Duration.zero, () {
                            _deleteProfile(profile);
                          });
                        },
                      ),
                    ],
                  ),
                ],
              ),

              const SizedBox(height: 12),

              // Birth Details
              _buildDetailRow(
                context,
                icon: Icons.calendar_today_outlined,
                label: 'DOB',
                value:
                '${profile.dateOfBirth.day}/${profile.dateOfBirth.month}/${profile.dateOfBirth.year}',
              ),

              const SizedBox(height: 8),

              _buildDetailRow(
                context,
                icon: Icons.schedule_outlined,
                label: 'Time',
                value: profile.timeOfBirth,
              ),

              const SizedBox(height: 12),

              // View Report Button
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: () {
                    Navigator.of(context).pushNamed(
                      '/report-viewer',
                      arguments: profile,
                    );
                  },
                  icon: const Icon(Icons.description_outlined, size: 18),
                  label: const Text('View Report'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.purple,
                    foregroundColor: AppColors.white,
                    padding: const EdgeInsets.symmetric(vertical: 12),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    )
        .animate(key: ValueKey(profile.id))
        .fadeIn(duration: 400.ms, delay: Duration(milliseconds: 50 * index))
        .slideX(begin: 0.2, end: 0);
  }

  Widget _buildDetailRow(
    BuildContext context, {
    required IconData icon,
    required String label,
    required String value,
  }) {
    return Row(
      children: [
        Icon(icon, size: 16, color: AppColors.textSecondary),
        const SizedBox(width: 8),
        Text(
          label,
          style: Theme.of(context).textTheme.bodySmall?.copyWith(
            color: AppColors.textSecondary,
            fontWeight: FontWeight.w500,
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Text(
            value,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
              color: AppColors.textPrimary,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildEmptyState(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 100,
            height: 100,
            decoration: BoxDecoration(
              color: AppColors.purple.withOpacity(0.1),
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.person_add_alt_outline,
              size: 48,
              color: AppColors.purple,
            ),
          ),
          const SizedBox(height: 24),
          Text(
            'No Profiles Yet',
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
              color: AppColors.purple,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Create your first profile to explore your soul journey',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: AppColors.textSecondary,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 32),
          ElevatedButton.icon(
            onPressed: () async {
              final result = await Navigator.of(context)
                  .pushNamed('/create-profile');
              if (result != null && mounted) {
                ref.refresh(profilesProvider);
              }
            },
            icon: const Icon(Icons.add),
            label: const Text('Create Profile'),
          ),
        ],
      ),
    )
        .animate()
        .fadeIn(duration: 600.ms)
        .scale(begin: const Offset(0.8, 0.8), end: const Offset(1, 1));
  }

  Widget _buildNoResultsState(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(
            Icons.search_off,
            size: 48,
            color: AppColors.gray400,
          ),
          const SizedBox(height: 16),
          Text(
            'No profiles found',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
              color: AppColors.textSecondary,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLoadingState() {
    return const Center(
      child: CircularProgressIndicator(
        valueColor: AlwaysStoppedAnimation<Color>(AppColors.purple),
      ),
    );
  }

  Widget _buildErrorState(BuildContext context, Object error) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(
            Icons.error_outline,
            size: 48,
            color: AppColors.error,
          ),
          const SizedBox(height: 16),
          Text(
            'Failed to load profiles',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
              color: AppColors.error,
            ),
          ),
          const SizedBox(height: 24),
          ElevatedButton(
            onPressed: () => ref.refresh(profilesProvider),
            child: const Text('Retry'),
          ),
        ],
      ),
    );
  }
}

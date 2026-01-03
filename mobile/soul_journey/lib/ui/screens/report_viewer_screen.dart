import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../theme/app_theme.dart';
import '../../data/repositories/report_repository.dart';
import '../../data/repositories/wisdom_card_repository.dart';
import '../../data/models/profile_model.dart';
import '../../data/models/report_model.dart';
import '../../data/database/database_helper.dart';
import '../../domain/engine/interpretation_engine.dart';
import '../../core/utils/pdf_generator.dart';

/// Riverpod Providers
final reportRepositoryProvider = Provider((ref) {
  return ReportRepository(dbHelper: DatabaseHelper());
});

final wisdomCardRepositoryProvider = Provider((ref) {
  return WisdomCardRepository(DatabaseHelper());
});

final reportProvider = FutureProvider.autoDispose
    .family<ReportModel, (String, ProfileModel)>((ref, params) async {
  final (profileId, profile) = params;
  final repository = ref.watch(reportRepositoryProvider);
  var report = await repository.getLatestReportByProfileId(profileId);

  if (report == null) {
    // Generate new report
    final wisdomCardRepository = ref.watch(wisdomCardRepositoryProvider);
    final wisdomCards = await wisdomCardRepository.getAllWisdomCards();
    final engine = InterpretationEngine();

    report = await engine.generateReport(profile, wisdomCards);
    await repository.createReport(report);
  }

  return report;
});

/// Report viewer screen with tabbed interface
///
/// Features:
/// - 7 report pages in tabs
/// - PDF export functionality
/// - Share report
/// - Print report
/// - Smooth page transitions
class ReportViewerScreen extends ConsumerStatefulWidget {
  final ProfileModel profile;

  const ReportViewerScreen({
    Key? key,
    required this.profile,
  }) : super(key: key);

  @override
  ConsumerState<ReportViewerScreen> createState() => _ReportViewerScreenState();
}

class _ReportViewerScreenState extends ConsumerState<ReportViewerScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  bool _isExporting = false;

  final List<String> _pageNames = [
    'Soul Signature',
    'Past Life',
    'Present Karma',
    'Future',
    'Relationships',
    'Remedies',
    'Summary',
  ];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 7, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _exportPdf(ReportModel report) async {
    setState(() => _isExporting = true);

    try {
      final pdfGenerator = PdfGenerator();
      final pdfFile = await pdfGenerator.generateReportPdf(
        report,
        widget.profile,
      );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('PDF saved: ${pdfFile.path}'),
            action: SnackBarAction(
              label: 'Share',
              onPressed: () async {
                try {
                  await pdfGenerator.sharePdf(pdfFile);
                } catch (e) {
                  if (mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text('Failed to share: $e')),
                    );
                  }
                }
              },
            ),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to export PDF: $e'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    } finally {
      setState(() => _isExporting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final reportAsync = ref.watch(reportProvider((widget.profile.id, widget.profile)));

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text(widget.profile.name),
        elevation: 0,
        actions: [
          reportAsync.whenData((report) {
            return IconButton(
              icon: _isExporting
                  ? const SizedBox(
                height: 24,
                width: 24,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  valueColor: AlwaysStoppedAnimation<Color>(
                    AppColors.purple,
                  ),
                ),
              )
                  : const Icon(Icons.download_outlined),
              onPressed: _isExporting ? null : () async => await _exportPdf(report),
              tooltip: 'Export PDF',
            );
          }).data ?? const SizedBox(),
        ],
      ),
      body: reportAsync.when(
        data: (report) {
          return Column(
            children: [
              // Tab Bar
              Container(
                color: AppColors.white,
                child: TabBar(
                  controller: _tabController,
                  isScrollable: true,
                  indicator: UnderlineTabIndicator(
                    borderSide: const BorderSide(
                      color: AppColors.purple,
                      width: 3,
                    ),
                    insets: const EdgeInsets.symmetric(horizontal: 16),
                  ),
                  labelColor: AppColors.purple,
                  unselectedLabelColor: AppColors.textSecondary,
                  labelStyle: Theme.of(context).textTheme.titleSmall?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
                  tabs: _pageNames
                      .map((name) => Tab(text: name))
                      .toList(),
                ),
              ),

              // Tab View
              Expanded(
                child: TabBarView(
                  controller: _tabController,
                  children: [
                    _buildReportPage(
                      context,
                      report.soulSignature,
                      0,
                    ),
                    _buildReportPage(
                      context,
                      report.pastLifeThreads,
                      1,
                    ),
                    _buildReportPage(
                      context,
                      report.presentKarmicPhase,
                      2,
                    ),
                    _buildReportPage(
                      context,
                      report.futureOutlook,
                      3,
                    ),
                    _buildReportPage(
                      context,
                      report.relationshipsKarma,
                      4,
                    ),
                    _buildReportPage(
                      context,
                      report.remediesPractices,
                      5,
                    ),
                    _buildReportPage(
                      context,
                      report.completeSummary,
                      6,
                    ),
                  ],
                ),
              ),
            ],
          );
        },
        loading: () => _buildLoadingState(),
        error: (error, stack) => _buildErrorState(context, error),
      ),
    );
  }

  Widget _buildReportPage(
    BuildContext context,
    ReportPage page,
    int pageIndex,
  ) {
    return SingleChildScrollView(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Page Title with Icon
            Row(
              children: [
                Container(
                  width: 50,
                  height: 50,
                  decoration: BoxDecoration(
                    gradient: pageIndex.isEven
                        ? AppColors.cardGradient1
                        : AppColors.cardGradient2,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Center(
                    child: Text(
                      (pageIndex + 1).toString(),
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        color: AppColors.purple,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Text(
                    page.title,
                    style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                      color: AppColors.purple,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
              ],
            )
                .animate()
                .fadeIn(duration: 400.ms)
                .slideX(begin: -0.2, end: 0),

            const SizedBox(height: 20),

            // Main Content
            Text(
              page.content,
              style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                color: AppColors.textPrimary,
                height: 1.7,
              ),
            )
                .animate()
                .fadeIn(duration: 400.ms, delay: 100.ms)
                .slideY(begin: 0.1, end: 0),

            // Bullet Points
            if (page.bulletPoints?.isNotEmpty ?? false) ...[
              const SizedBox(height: 24),
              Text(
                'Key Insights',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  color: AppColors.purple,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 12),
              ...page.bulletPoints!.asMap().entries.map((entry) {
                return _buildBulletPoint(
                  context,
                  entry.value,
                  entry.key,
                )
                    .animate()
                    .fadeIn(duration: 300.ms, delay: Duration(milliseconds: 150 * entry.key))
                    .slideX(begin: 0.2, end: 0);
              }),
            ],

            // Highlights
            if (page.highlights?.isNotEmpty ?? false) ...[
              const SizedBox(height: 24),
              Text(
                'Highlights',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  color: AppColors.purple,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 12),
              ...page.highlights!.entries.map((entry) {
                return _buildHighlightCard(
                  context,
                  entry.key,
                  entry.value,
                );
              }),
            ],

            // Warnings
            if (page.warnings?.isNotEmpty ?? false) ...[
              const SizedBox(height: 24),
              _buildAlertCard(
                context,
                'Warnings',
                page.warnings!,
                AppColors.warning,
                Icons.warning_amber_rounded,
              ),
            ],

            // Blessings
            if (page.blessings?.isNotEmpty ?? false) ...[
              const SizedBox(height: 24),
              _buildAlertCard(
                context,
                'Blessings',
                page.blessings!,
                AppColors.success,
                Icons.star_rounded,
              ),
            ],

            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }

  Widget _buildBulletPoint(BuildContext context, String text, int index) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 24,
            height: 24,
            decoration: const BoxDecoration(
              shape: BoxShape.circle,
              color: AppColors.cyan,
            ),
            child: Center(
              child: Text(
                '•',
                style: Theme.of(context).textTheme.titleSmall?.copyWith(
                  color: AppColors.white,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              text,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: AppColors.textPrimary,
                height: 1.5,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHighlightCard(
    BuildContext context,
    String title,
    String value,
  ) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.cyan.withOpacity(0.1),
        border: Border.all(color: AppColors.cyan.withOpacity(0.3)),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: Theme.of(context).textTheme.titleSmall?.copyWith(
              color: AppColors.purple,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            value,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: AppColors.textPrimary,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAlertCard(
    BuildContext context,
    String title,
    List<String> items,
    Color color,
    IconData icon,
  ) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        border: Border.all(color: color.withOpacity(0.3)),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, color: color, size: 20),
              const SizedBox(width: 12),
              Text(
                title,
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  color: color,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          ...items.map((item) {
            return Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: Text(
                '• $item',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: AppColors.textPrimary,
                ),
              ),
            );
          }),
        ],
      ),
    );
  }

  Widget _buildLoadingState() {
    return const Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          CircularProgressIndicator(
            valueColor: AlwaysStoppedAnimation<Color>(AppColors.purple),
          ),
          SizedBox(height: 16),
          Text('Generating your report...'),
        ],
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
            'Failed to load report',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
              color: AppColors.error,
            ),
          ),
          const SizedBox(height: 24),
          ElevatedButton(
            onPressed: () => ref.refresh(reportProvider(widget.profile.id)),
            child: const Text('Retry'),
          ),
        ],
      ),
    );
  }
}

import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../data/database/database_helper.dart';
import '../../data/models/wisdom_card_model.dart';
import '../../data/repositories/wisdom_card_repository.dart';
import '../theme/app_theme.dart';

/// Wisdom Library screen to browse and search wisdom cards
class WisdomLibraryScreen extends StatefulWidget {
  const WisdomLibraryScreen({Key? key}) : super(key: key);

  @override
  State<WisdomLibraryScreen> createState() => _WisdomLibraryScreenState();
}

class _WisdomLibraryScreenState extends State<WisdomLibraryScreen> {
  final WisdomCardRepository _repository =
      WisdomCardRepository(dbHelper: DatabaseHelper());
  final TextEditingController _searchController = TextEditingController();
  List<WisdomCardModel> _cards = [];
  bool _isLoading = true;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _loadCards();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadCards({String query = ''}) async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      await _repository.initializeDemoCards();
      final cards = query.trim().isEmpty
          ? await _repository.getAllWisdomCards()
          : await _repository.searchWisdomCards(query);

      if (!mounted) return;
      setState(() => _cards = cards);
    } catch (error) {
      if (!mounted) return;
      setState(() => _errorMessage = error.toString());
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  Widget _buildSearchBar() {
    return TextField(
      controller: _searchController,
      onChanged: (value) => _loadCards(query: value),
      decoration: InputDecoration(
        hintText: 'Search wisdom cards...',
        prefixIcon: const Icon(Icons.search),
        filled: true,
        fillColor: AppColors.surface,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide.none,
        ),
      ),
    );
  }

  Widget _buildCard(WisdomCardModel card) {
    return Card(
      color: AppColors.surface,
      elevation: 1,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              card.topic,
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w700,
                    color: AppColors.purple,
                  ),
            ),
            const SizedBox(height: 6),
            Text(
              card.tradition,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: AppColors.textSecondary,
                  ),
            ),
            if (card.tags.isNotEmpty) ...[
              const SizedBox(height: 10),
              Wrap(
                spacing: 6,
                runSpacing: 6,
                children: card.tags
                    .map((tag) => Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 10,
                            vertical: 4,
                          ),
                          decoration: BoxDecoration(
                            color: AppColors.purple.withOpacity(0.15),
                            borderRadius: BorderRadius.circular(999),
                          ),
                          child: Text(
                            tag,
                            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                  color: AppColors.purple,
                                  fontWeight: FontWeight.w600,
                                ),
                          ),
                        ))
                    .toList(),
              ),
            ],
            const SizedBox(height: 12),
            Text(
              card.ruleText,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: AppColors.textSecondary,
                  ),
            ),
          ],
        ),
      ),
    ).animate().fadeIn(duration: 200.ms).slideY(begin: 0.1, end: 0);
  }

  Widget _buildBody() {
    if (_isLoading) {
      return const Center(
        child: CircularProgressIndicator(
          valueColor: AlwaysStoppedAnimation<Color>(AppColors.purple),
        ),
      );
    }

    if (_errorMessage != null) {
      return Center(
        child: Text(
          _errorMessage!,
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: AppColors.error,
              ),
          textAlign: TextAlign.center,
        ),
      );
    }

    if (_cards.isEmpty) {
      return Center(
        child: Text(
          'No wisdom cards found.',
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: AppColors.textSecondary,
              ),
        ),
      );
    }

    return ListView.separated(
      itemCount: _cards.length,
      padding: const EdgeInsets.only(top: 8, bottom: 24),
      separatorBuilder: (_, __) => const SizedBox(height: 12),
      itemBuilder: (context, index) => _buildCard(_cards[index]),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Wisdom Library'),
        backgroundColor: AppColors.background,
        foregroundColor: AppColors.textPrimary,
        elevation: 0,
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            children: [
              _buildSearchBar(),
              const SizedBox(height: 16),
              Expanded(child: _buildBody()),
            ],
          ),
        ),
      ),
    );
  }
}

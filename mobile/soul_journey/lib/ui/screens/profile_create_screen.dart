import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../theme/app_theme.dart';
import '../../data/repositories/profile_repository.dart';
import '../../data/repositories/city_repository.dart';
import '../../data/models/profile_model.dart';
import '../../data/database/database_helper.dart';

/// Riverpod Providers
final cityRepositoryProvider = Provider((ref) {
  return CityRepository();
});

final profileRepositoryProvider = Provider((ref) {
  return ProfileRepository(DatabaseHelper());
});

/// Profile creation form screen
///
/// Features:
/// - Name input field
/// - Date of birth picker
/// - Time of birth input
/// - City search with autocomplete
/// - Validation and error handling
/// - Save profile to database
class ProfileCreateScreen extends ConsumerStatefulWidget {
  const ProfileCreateScreen({Key? key}) : super(key: key);

  @override
  ConsumerState<ProfileCreateScreen> createState() => _ProfileCreateScreenState();
}

class _ProfileCreateScreenState extends ConsumerState<ProfileCreateScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _timeController = TextEditingController();
  final _cityController = TextEditingController();

  DateTime? _selectedDate;
  CityData? _selectedCity;
  List<CityModel> _citySuggestions = [];
  bool _showCitySuggestions = false;
  bool _isLoading = false;
  String? _errorMessage;

  @override
  void dispose() {
    _nameController.dispose();
    _timeController.dispose();
    _cityController.dispose();
    super.dispose();
  }

  Future<void> _selectDate(BuildContext context) async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _selectedDate ?? DateTime.now(),
      firstDate: DateTime(1900),
      lastDate: DateTime.now(),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: const ColorScheme.light(
              primary: AppColors.purple,
              onPrimary: AppColors.white,
              surface: AppColors.white,
              onSurface: AppColors.textPrimary,
            ),
          ),
          child: child!,
        );
      },
    );

    if (picked != null && picked != _selectedDate) {
      setState(() => _selectedDate = picked);
    }
  }

  Future<void> _searchCities(String query) async {
    if (query.isEmpty) {
      setState(() => _citySuggestions = []);
      return;
    }

    try {
      final cityRepository = ref.read(cityRepositoryProvider);
      final suggestions = await cityRepository.searchCities(query);
      setState(() {
        _citySuggestions = suggestions;
        _showCitySuggestions = true;
      });
    } catch (e) {
      setState(() => _errorMessage = 'Failed to search cities');
    }
  }

  Future<void> _createProfile() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    if (_selectedDate == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select date of birth')),
      );
      return;
    }

    if (_selectedCity == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select birth place')),
      );
      return;
    }

    setState(() => _isLoading = true);
    setState(() => _errorMessage = null);

    try {
      final profile = ProfileModel.create(
        name: _nameController.text.trim(),
        dateOfBirth: _selectedDate!,
        timeOfBirth: _timeController.text.trim(),
        placeOfBirth: _selectedCity!.displayName,
        cityData: _selectedCity!,
      );

      final profileRepository = ref.read(profileRepositoryProvider);
      await profileRepository.createProfile(profile);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Profile created successfully')),
        );
        Navigator.of(context).pop(profile);
      }
    } catch (e) {
      setState(() => _errorMessage = 'Failed to create profile: ${e.toString()}');
    } finally {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Create New Profile'),
        elevation: 0,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          child: Padding(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Info Card
                _buildInfoCard(context)
                    .animate()
                    .fadeIn(duration: 600.ms, delay: 100.ms)
                    .slideY(begin: 0.2, end: 0),

                const SizedBox(height: 32),

                // Form
                Form(
                  key: _formKey,
                  child: _buildForm(context)
                      .animate()
                      .fadeIn(duration: 600.ms, delay: 200.ms)
                      .slideY(begin: 0.2, end: 0),
                ),

                // Error Message
                if (_errorMessage != null)
                  Padding(
                    padding: const EdgeInsets.only(top: 24),
                    child: Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: AppColors.error.withOpacity(0.1),
                        border: Border.all(
                          color: AppColors.error.withOpacity(0.3),
                        ),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Row(
                        children: [
                          const Icon(
                            Icons.error_outline,
                            color: AppColors.error,
                            size: 20,
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Text(
                              _errorMessage!,
                              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                color: AppColors.error,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),

                const SizedBox(height: 32),

                // Action Buttons
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton(
                        onPressed: _isLoading
                            ? null
                            : () => Navigator.of(context).pop(),
                        child: const Text('Cancel'),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: ElevatedButton(
                        onPressed: _isLoading ? null : _createProfile,
                        child: _isLoading
                            ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            valueColor: AlwaysStoppedAnimation<Color>(
                              Colors.white,
                            ),
                          ),
                        )
                            : const Text('Create'),
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 24),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildInfoCard(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0x144DEEEA), Color(0x148A5CF6)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: AppColors.cyan.withOpacity(0.3),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Birth Information',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
              color: AppColors.purple,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Provide accurate birth details for accurate insights. Your data is encrypted and stays on your device.',
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
              color: AppColors.textSecondary,
              height: 1.5,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildForm(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // Name Field
        _buildFormField(
          context,
          label: 'Full Name',
          icon: Icons.person_outline,
          controller: _nameController,
          hint: 'Enter your full name',
          validator: (value) {
            if (value?.isEmpty ?? true) {
              return 'Name is required';
            }
            if ((value?.length ?? 0) < 2) {
              return 'Name must be at least 2 characters';
            }
            return null;
          },
        ),

        const SizedBox(height: 24),

        // Date of Birth Field
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Date of Birth',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 8),
            GestureDetector(
              onTap: () => _selectDate(context),
              child: Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 16,
                ),
                decoration: BoxDecoration(
                  color: AppColors.gray50,
                  border: Border.all(color: AppColors.gray300),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  children: [
                    const Icon(
                      Icons.calendar_today_outlined,
                      color: AppColors.textSecondary,
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        _selectedDate == null
                            ? 'Select date'
                            : '${_selectedDate!.day}/${_selectedDate!.month}/${_selectedDate!.year}',
                        style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                          color: _selectedDate == null
                              ? AppColors.textTertiary
                              : AppColors.textPrimary,
                        ),
                      ),
                    ),
                    const Icon(
                      Icons.arrow_forward_ios,
                      size: 16,
                      color: AppColors.textSecondary,
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),

        const SizedBox(height: 24),

        // Time of Birth Field
        _buildFormField(
          context,
          label: 'Time of Birth (HH:MM)',
          icon: Icons.schedule_outlined,
          controller: _timeController,
          hint: 'e.g., 14:30',
          validator: (value) {
            if (value?.isEmpty ?? true) {
              return 'Time is required';
            }
            final parts = value!.split(':');
            if (parts.length != 2) {
              return 'Use format HH:MM';
            }
            final hour = int.tryParse(parts[0]);
            final minute = int.tryParse(parts[1]);
            if (hour == null || minute == null || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
              return 'Invalid time format';
            }
            return null;
          },
        ),

        const SizedBox(height: 24),

        // City Search Field
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Birth Place',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 8),
            TextField(
              controller: _cityController,
              onChanged: (value) {
                _searchCities(value);
                setState(() => _showCitySuggestions = value.isNotEmpty);
              },
              decoration: InputDecoration(
                hintText: 'Search city',
                prefixIcon: const Icon(Icons.location_on_outlined),
                suffixIcon: _selectedCity != null
                    ? const Icon(Icons.check_circle, color: AppColors.success)
                    : null,
              ),
            ),
            const SizedBox(height: 8),
            if (_showCitySuggestions && _citySuggestions.isNotEmpty)
              Container(
                decoration: BoxDecoration(
                  border: Border.all(color: AppColors.gray300),
                  borderRadius: BorderRadius.circular(8),
                ),
                constraints: const BoxConstraints(maxHeight: 200),
                child: ListView.builder(
                  shrinkWrap: true,
                  itemCount: _citySuggestions.length,
                  itemBuilder: (context, index) {
                    final city = _citySuggestions[index];
                    return Material(
                      child: InkWell(
                        onTap: () {
                          setState(() {
                            _selectedCity = CityData(
                              name: city.name,
                              country: city.country,
                              latitude: city.latitude,
                              longitude: city.longitude,
                              timezone: city.timezone,
                            );
                            _cityController.text = city.displayName;
                            _showCitySuggestions = false;
                            _citySuggestions = [];
                          });
                        },
                        child: Padding(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 16,
                            vertical: 12,
                          ),
                          child: Text(
                            city.displayName,
                            style: Theme.of(context).textTheme.bodyMedium,
                          ),
                        ),
                      ),
                    );
                  },
                ),
              ),
            if (_showCitySuggestions && _citySuggestions.isEmpty)
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 16),
                child: Text(
                  'No cities found',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: AppColors.textTertiary,
                  ),
                  textAlign: TextAlign.center,
                ),
              ),
            if (_selectedCity != null && !_showCitySuggestions)
              Padding(
                padding: const EdgeInsets.only(top: 8),
                child: Row(
                  children: [
                    const Icon(
                      Icons.check_circle,
                      color: AppColors.success,
                      size: 18,
                    ),
                    const SizedBox(width: 8),
                    Text(
                      _selectedCity!.displayName,
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: AppColors.success,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ),
          ],
        ),
      ],
    );
  }

  Widget _buildFormField(
    BuildContext context, {
    required String label,
    required IconData icon,
    required TextEditingController controller,
    required String hint,
    String? Function(String?)? validator,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: Theme.of(context).textTheme.titleMedium?.copyWith(
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 8),
        TextFormField(
          controller: controller,
          validator: validator,
          decoration: InputDecoration(
            hintText: hint,
            prefixIcon: Icon(icon),
          ),
        ),
      ],
    );
  }
}

/// Import for CityModel
import '../../data/repositories/city_repository.dart' show CityModel;

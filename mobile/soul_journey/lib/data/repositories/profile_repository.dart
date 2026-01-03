import '../database/database_helper.dart';
import '../models/profile_model.dart';

/// Repository for Profile database operations
class ProfileRepository {
  final DatabaseHelper _db;

  ProfileRepository(this._db);

  /// Create a new profile
  Future<void> createProfile(ProfileModel profile) async {
    final database = await _db.database;
    await database.insert('profiles', profile.toDatabase());
  }

  /// Get all profiles
  Future<List<ProfileModel>> getAllProfiles() async {
    final database = await _db.database;
    final List<Map<String, dynamic>> maps = await database.query(
      'profiles',
      orderBy: 'created_at DESC',
    );

    return maps.map((map) => ProfileModel.fromDatabase(map)).toList();
  }

  /// Get profile by ID
  Future<ProfileModel?> getProfileById(String id) async {
    final database = await _db.database;
    final List<Map<String, dynamic>> maps = await database.query(
      'profiles',
      where: 'id = ?',
      whereArgs: [id],
    );

    if (maps.isEmpty) return null;
    return ProfileModel.fromDatabase(maps.first);
  }

  /// Update profile
  Future<void> updateProfile(ProfileModel profile) async {
    final database = await _db.database;
    await database.update(
      'profiles',
      profile.toDatabase(),
      where: 'id = ?',
      whereArgs: [profile.id],
    );
  }

  /// Delete profile
  Future<void> deleteProfile(String id) async {
    final database = await _db.database;
    await database.delete(
      'profiles',
      where: 'id = ?',
      whereArgs: [id],
    );
  }

  /// Search profiles by name
  Future<List<ProfileModel>> searchProfiles(String query) async {
    final database = await _db.database;
    final List<Map<String, dynamic>> maps = await database.query(
      'profiles',
      where: 'name LIKE ?',
      whereArgs: ['%$query%'],
      orderBy: 'created_at DESC',
    );

    return maps.map((map) => ProfileModel.fromDatabase(map)).toList();
  }
}

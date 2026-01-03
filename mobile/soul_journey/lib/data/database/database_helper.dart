import 'dart:async';
import 'dart:convert';
import 'package:crypto/crypto.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:path/path.dart';
import 'package:sqflite_sqlcipher/sqflite.dart';
import '../../core/constants/app_constants.dart';

/// Database helper with SQLCipher encryption
///
/// Security Features:
/// - Encrypted database using SQLCipher
/// - Encryption key stored in secure storage (Keychain/Keystore)
/// - Full-text search support (FTS5) for Wisdom Cards
/// - Automatic database initialization and migrations
class DatabaseHelper {
  static DatabaseHelper? _instance;
  static Database? _database;
  static const FlutterSecureStorage _secureStorage = FlutterSecureStorage(
    aOptions: AndroidOptions(encryptedSharedPreferences: true),
    iOptions: IOSOptions(accessibility: KeychainAccessibility.first_unlock),
  );

  DatabaseHelper._();

  factory DatabaseHelper() {
    _instance ??= DatabaseHelper._();
    return _instance!;
  }

  /// Get the database instance
  Future<Database> get database async {
    if (_database != null) return _database!;
    _database = await _initDatabase();
    return _database!;
  }

  /// Initialize encrypted database
  Future<Database> _initDatabase() async {
    final databasesPath = await getDatabasesPath();
    final path = join(databasesPath, AppConstants.databaseName);

    // Get or create encryption key
    final password = await _getOrCreateEncryptionKey();

    return await openDatabase(
      path,
      version: AppConstants.databaseVersion,
      password: password,
      onCreate: _onCreate,
      onUpgrade: _onUpgrade,
      onConfigure: _onConfigure,
    );
  }

  /// Generate or retrieve encryption key from secure storage
  Future<String> _getOrCreateEncryptionKey() async {
    String? key = await _secureStorage.read(key: AppConstants.encryptionKeyAlias);

    if (key == null) {
      // Generate a new 256-bit key
      final timestamp = DateTime.now().millisecondsSinceEpoch.toString();
      final randomBytes = utf8.encode('$timestamp-soul-journey-${DateTime.now().microsecond}');
      key = sha256.convert(randomBytes).toString();
      await _secureStorage.write(key: AppConstants.encryptionKeyAlias, value: key);
    }

    return key;
  }

  /// Configure database settings
  Future<void> _onConfigure(Database db) async {
    await db.execute('PRAGMA foreign_keys = ON');
    await db.execute('PRAGMA journal_mode = WAL'); // Write-Ahead Logging for better concurrency
  }

  /// Create database tables
  Future<void> _onCreate(Database db, int version) async {
    // Profiles table
    await db.execute('''
      CREATE TABLE profiles (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        date_of_birth TEXT NOT NULL,
        time_of_birth TEXT NOT NULL,
        place_of_birth TEXT NOT NULL,
        city_data TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )
    ''');

    // Reports table
    await db.execute('''
      CREATE TABLE reports (
        id TEXT PRIMARY KEY,
        profile_id TEXT NOT NULL,
        soul_signature TEXT NOT NULL,
        past_life_threads TEXT NOT NULL,
        present_karmic_phase TEXT NOT NULL,
        future_outlook TEXT NOT NULL,
        relationships_karma TEXT NOT NULL,
        remedies_practices TEXT NOT NULL,
        complete_summary TEXT NOT NULL,
        generated_at INTEGER NOT NULL,
        FOREIGN KEY (profile_id) REFERENCES profiles (id) ON DELETE CASCADE
      )
    ''');

    // Wisdom Cards table
    await db.execute('''
      CREATE TABLE wisdom_cards (
        id TEXT PRIMARY KEY,
        tradition TEXT NOT NULL,
        topic TEXT NOT NULL,
        tags TEXT NOT NULL,
        conditions_json TEXT NOT NULL,
        rule_text TEXT NOT NULL,
        output_template TEXT NOT NULL,
        priority INTEGER NOT NULL DEFAULT 0,
        created_at INTEGER NOT NULL
      )
    ''');

    // Wisdom Cards FTS5 virtual table for full-text search
    await db.execute('''
      CREATE VIRTUAL TABLE wisdom_cards_fts USING fts5(
        id UNINDEXED,
        tradition,
        topic,
        tags,
        rule_text,
        output_template,
        content=wisdom_cards,
        content_rowid=rowid
      )
    ''');

    // Triggers to keep FTS table in sync
    await db.execute('''
      CREATE TRIGGER wisdom_cards_fts_insert AFTER INSERT ON wisdom_cards BEGIN
        INSERT INTO wisdom_cards_fts(rowid, id, tradition, topic, tags, rule_text, output_template)
        VALUES (new.rowid, new.id, new.tradition, new.topic, new.tags, new.rule_text, new.output_template);
      END
    ''');

    await db.execute('''
      CREATE TRIGGER wisdom_cards_fts_delete AFTER DELETE ON wisdom_cards BEGIN
        DELETE FROM wisdom_cards_fts WHERE rowid = old.rowid;
      END
    ''');

    await db.execute('''
      CREATE TRIGGER wisdom_cards_fts_update AFTER UPDATE ON wisdom_cards BEGIN
        DELETE FROM wisdom_cards_fts WHERE rowid = old.rowid;
        INSERT INTO wisdom_cards_fts(rowid, id, tradition, topic, tags, rule_text, output_template)
        VALUES (new.rowid, new.id, new.tradition, new.topic, new.tags, new.rule_text, new.output_template);
      END
    ''');

    // Create indexes for better query performance
    await db.execute('CREATE INDEX idx_reports_profile_id ON reports(profile_id)');
    await db.execute('CREATE INDEX idx_wisdom_cards_tradition ON wisdom_cards(tradition)');
    await db.execute('CREATE INDEX idx_wisdom_cards_topic ON wisdom_cards(topic)');
    await db.execute('CREATE INDEX idx_wisdom_cards_priority ON wisdom_cards(priority)');
  }

  /// Handle database migrations
  Future<void> _onUpgrade(Database db, int oldVersion, int newVersion) async {
    // Future migrations will be handled here
    if (oldVersion < 2) {
      // Example: await db.execute('ALTER TABLE ...');
    }
  }

  /// Full-text search in Wisdom Cards
  Future<List<Map<String, dynamic>>> searchWisdomCards(String query) async {
    final db = await database;

    // FTS5 match query
    final results = await db.rawQuery('''
      SELECT wisdom_cards.*
      FROM wisdom_cards
      JOIN wisdom_cards_fts ON wisdom_cards.rowid = wisdom_cards_fts.rowid
      WHERE wisdom_cards_fts MATCH ?
      ORDER BY wisdom_cards.priority DESC, wisdom_cards.created_at DESC
    ''', [query]);

    return results;
  }

  /// Close the database
  Future<void> close() async {
    final db = await database;
    await db.close();
    _database = null;
  }

  /// Delete the database (for testing or reset)
  Future<void> deleteDatabase() async {
    final databasesPath = await getDatabasesPath();
    final path = join(databasesPath, AppConstants.databaseName);
    await databaseFactory.deleteDatabase(path);
    _database = null;
  }

  /// Export database encryption key (for backup purposes - requires PIN re-auth)
  Future<String?> exportEncryptionKey() async {
    return await _secureStorage.read(key: AppConstants.encryptionKeyAlias);
  }

  /// Import database encryption key (for restore purposes - requires PIN re-auth)
  Future<void> importEncryptionKey(String key) async {
    await _secureStorage.write(key: AppConstants.encryptionKeyAlias, value: key);
  }

  /// Get database file path (for debugging)
  Future<String> getDatabasePath() async {
    final databasesPath = await getDatabasesPath();
    return join(databasesPath, AppConstants.databaseName);
  }

  /// Get database size in bytes
  Future<int?> getDatabaseSize() async {
    try {
      final db = await database;
      final result = await db.rawQuery('SELECT page_count * page_size as size FROM pragma_page_count(), pragma_page_size()');
      return result.first['size'] as int?;
    } catch (e) {
      return null;
    }
  }

  /// Optimize database (VACUUM command)
  Future<void> optimizeDatabase() async {
    final db = await database;
    await db.execute('VACUUM');
  }
}

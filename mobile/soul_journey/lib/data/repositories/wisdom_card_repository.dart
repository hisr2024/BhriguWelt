import 'dart:convert';
import 'package:flutter/services.dart';
import 'package:sqflite_sqlcipher/sqflite.dart';
import '../database/database_helper.dart';
import '../models/wisdom_card_model.dart';

/// Repository for Wisdom Card CRUD operations and search
class WisdomCardRepository {
  final DatabaseHelper _dbHelper;

  WisdomCardRepository({DatabaseHelper? dbHelper})
      : _dbHelper = dbHelper ?? DatabaseHelper();

  /// Load demo cards from bundled JSON asset
  Future<List<WisdomCardModel>> loadDemoCards() async {
    try {
      final jsonString = await rootBundle.loadString('assets/wisdom_cards/demo_cards.json');
      final List<dynamic> jsonList = json.decode(jsonString);
      return jsonList.map((json) => WisdomCardModel.fromJson(json)).toList();
    } catch (e) {
      throw Exception('Failed to load demo cards: $e');
    }
  }

  /// Initialize database with demo cards (if empty)
  Future<void> initializeDemoCards() async {
    final existing = await getAllWisdomCards();
    if (existing.isEmpty) {
      final demoCards = await loadDemoCards();
      for (final card in demoCards) {
        await createWisdomCard(card);
      }
    }
  }

  /// Create a new wisdom card
  Future<int> createWisdomCard(WisdomCardModel card) async {
    final db = await _dbHelper.database;

    final id = await db.insert(
      'wisdom_cards',
      {
        'tradition': card.tradition,
        'topic': card.topic,
        'tags': card.tags.join(','),
        'conditions': json.encode(card.conditions),
        'rule_text': card.ruleText,
        'output_template': card.outputTemplate,
        'priority': card.priority,
      },
      conflictAlgorithm: ConflictAlgorithm.replace,
    );

    return id;
  }

  /// Get all wisdom cards
  Future<List<WisdomCardModel>> getAllWisdomCards() async {
    final db = await _dbHelper.database;
    final List<Map<String, dynamic>> maps = await db.query(
      'wisdom_cards',
      orderBy: 'priority DESC, id ASC',
    );

    return maps.map((map) => _wisdomCardFromMap(map)).toList();
  }

  /// Get wisdom card by ID
  Future<WisdomCardModel?> getWisdomCardById(int id) async {
    final db = await _dbHelper.database;
    final List<Map<String, dynamic>> maps = await db.query(
      'wisdom_cards',
      where: 'id = ?',
      whereArgs: [id],
      limit: 1,
    );

    if (maps.isEmpty) return null;
    return _wisdomCardFromMap(maps.first);
  }

  /// Update wisdom card
  Future<void> updateWisdomCard(int id, WisdomCardModel card) async {
    final db = await _dbHelper.database;

    await db.update(
      'wisdom_cards',
      {
        'tradition': card.tradition,
        'topic': card.topic,
        'tags': card.tags.join(','),
        'conditions': json.encode(card.conditions),
        'rule_text': card.ruleText,
        'output_template': card.outputTemplate,
        'priority': card.priority,
      },
      where: 'id = ?',
      whereArgs: [id],
    );
  }

  /// Delete wisdom card
  Future<void> deleteWisdomCard(int id) async {
    final db = await _dbHelper.database;
    await db.delete(
      'wisdom_cards',
      where: 'id = ?',
      whereArgs: [id],
    );
  }

  /// Search wisdom cards using full-text search
  Future<List<WisdomCardModel>> searchWisdomCards(String query) async {
    if (query.trim().isEmpty) {
      return getAllWisdomCards();
    }

    final results = await _dbHelper.searchWisdomCards(query);
    return results.map((map) => _wisdomCardFromMap(map)).toList();
  }

  /// Get cards by topic
  Future<List<WisdomCardModel>> getCardsByTopic(String topic) async {
    final db = await _dbHelper.database;
    final List<Map<String, dynamic>> maps = await db.query(
      'wisdom_cards',
      where: 'topic = ?',
      whereArgs: [topic],
      orderBy: 'priority DESC',
    );

    return maps.map((map) => _wisdomCardFromMap(map)).toList();
  }

  /// Get cards by tradition
  Future<List<WisdomCardModel>> getCardsByTradition(String tradition) async {
    final db = await _dbHelper.database;
    final List<Map<String, dynamic>> maps = await db.query(
      'wisdom_cards',
      where: 'tradition = ?',
      whereArgs: [tradition],
      orderBy: 'priority DESC',
    );

    return maps.map((map) => _wisdomCardFromMap(map)).toList();
  }

  /// Export all wisdom cards to JSON
  Future<String> exportToJson() async {
    final cards = await getAllWisdomCards();
    final jsonList = cards.map((card) => card.toJson()).toList();
    return json.encode(jsonList);
  }

  /// Import wisdom cards from JSON
  Future<int> importFromJson(String jsonString) async {
    try {
      final List<dynamic> jsonList = json.decode(jsonString);
      final cards = jsonList.map((json) => WisdomCardModel.fromJson(json)).toList();

      int importedCount = 0;
      for (final card in cards) {
        await createWisdomCard(card);
        importedCount++;
      }

      return importedCount;
    } catch (e) {
      throw Exception('Failed to import wisdom cards: $e');
    }
  }

  /// Get card count by topic
  Future<Map<String, int>> getCardCountByTopic() async {
    final db = await _dbHelper.database;
    final List<Map<String, dynamic>> results = await db.rawQuery(
      'SELECT topic, COUNT(*) as count FROM wisdom_cards GROUP BY topic ORDER BY count DESC',
    );

    return Map.fromEntries(
      results.map((row) => MapEntry(row['topic'] as String, row['count'] as int)),
    );
  }

  /// Helper to convert database map to WisdomCardModel
  WisdomCardModel _wisdomCardFromMap(Map<String, dynamic> map) {
    return WisdomCardModel(
      id: map['id'] as int?,
      tradition: map['tradition'] as String,
      topic: map['topic'] as String,
      tags: (map['tags'] as String).split(',').where((t) => t.isNotEmpty).toList(),
      conditions: Map<String, dynamic>.from(json.decode(map['conditions'] as String)),
      ruleText: map['rule_text'] as String,
      outputTemplate: map['output_template'] as String,
      priority: map['priority'] as int,
    );
  }
}

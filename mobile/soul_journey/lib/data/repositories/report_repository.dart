import 'dart:convert';
import 'package:sqflite_sqlcipher/sqflite.dart';
import '../database/database_helper.dart';
import '../models/report_model.dart';

/// Repository for Soul Journey Report CRUD operations
class ReportRepository {
  final DatabaseHelper _dbHelper;

  ReportRepository({DatabaseHelper? dbHelper})
      : _dbHelper = dbHelper ?? DatabaseHelper();

  /// Create a new report
  Future<int> createReport(ReportModel report) async {
    final db = await _dbHelper.database;

    final id = await db.insert(
      'reports',
      {
        'profile_id': report.profileId,
        'generated_at': report.generatedAt.toIso8601String(),
        'soul_signature': json.encode(report.soulSignature.toJson()),
        'past_life_threads': json.encode(report.pastLifeThreads.toJson()),
        'present_karmic_phase': json.encode(report.presentKarmicPhase.toJson()),
        'future_outlook': json.encode(report.futureOutlook.toJson()),
        'relationships': json.encode(report.relationships.toJson()),
        'remedies': json.encode(report.remedies.toJson()),
        'soul_journey_summary': json.encode(report.soulJourneySummary.toJson()),
      },
      conflictAlgorithm: ConflictAlgorithm.replace,
    );

    return id;
  }

  /// Get all reports for a profile
  Future<List<ReportModel>> getReportsByProfileId(String profileId) async {
    final db = await _dbHelper.database;
    final List<Map<String, dynamic>> maps = await db.query(
      'reports',
      where: 'profile_id = ?',
      whereArgs: [profileId],
      orderBy: 'generated_at DESC',
    );

    return maps.map((map) => _reportFromMap(map)).toList();
  }

  /// Get latest report for a profile
  Future<ReportModel?> getLatestReportByProfileId(String profileId) async {
    final db = await _dbHelper.database;
    final List<Map<String, dynamic>> maps = await db.query(
      'reports',
      where: 'profile_id = ?',
      whereArgs: [profileId],
      orderBy: 'generated_at DESC',
      limit: 1,
    );

    if (maps.isEmpty) return null;
    return _reportFromMap(maps.first);
  }

  /// Get report by ID
  Future<ReportModel?> getReportById(int id) async {
    final db = await _dbHelper.database;
    final List<Map<String, dynamic>> maps = await db.query(
      'reports',
      where: 'id = ?',
      whereArgs: [id],
      limit: 1,
    );

    if (maps.isEmpty) return null;
    return _reportFromMap(maps.first);
  }

  /// Get all reports (sorted by date, newest first)
  Future<List<ReportModel>> getAllReports() async {
    final db = await _dbHelper.database;
    final List<Map<String, dynamic>> maps = await db.query(
      'reports',
      orderBy: 'generated_at DESC',
    );

    return maps.map((map) => _reportFromMap(map)).toList();
  }

  /// Delete report
  Future<void> deleteReport(int id) async {
    final db = await _dbHelper.database;
    await db.delete(
      'reports',
      where: 'id = ?',
      whereArgs: [id],
    );
  }

  /// Delete all reports for a profile
  Future<void> deleteReportsByProfileId(String profileId) async {
    final db = await _dbHelper.database;
    await db.delete(
      'reports',
      where: 'profile_id = ?',
      whereArgs: [profileId],
    );
  }

  /// Get report count for a profile
  Future<int> getReportCountByProfileId(String profileId) async {
    final db = await _dbHelper.database;
    final result = await db.rawQuery(
      'SELECT COUNT(*) as count FROM reports WHERE profile_id = ?',
      [profileId],
    );
    return Sqflite.firstIntValue(result) ?? 0;
  }

  /// Get total report count
  Future<int> getTotalReportCount() async {
    final db = await _dbHelper.database;
    final result = await db.rawQuery('SELECT COUNT(*) as count FROM reports');
    return Sqflite.firstIntValue(result) ?? 0;
  }

  /// Export report to JSON
  Future<String> exportReportToJson(int reportId) async {
    final report = await getReportById(reportId);
    if (report == null) {
      throw Exception('Report not found');
    }
    return json.encode(report.toJson());
  }

  /// Helper to convert database map to ReportModel
  ReportModel _reportFromMap(Map<String, dynamic> map) {
    return ReportModel(
      id: map['id'] as int?,
      profileId: map['profile_id'] as String,
      generatedAt: DateTime.parse(map['generated_at'] as String),
      soulSignature: ReportPageModel.fromJson(
        json.decode(map['soul_signature'] as String),
      ),
      pastLifeThreads: ReportPageModel.fromJson(
        json.decode(map['past_life_threads'] as String),
      ),
      presentKarmicPhase: ReportPageModel.fromJson(
        json.decode(map['present_karmic_phase'] as String),
      ),
      futureOutlook: ReportPageModel.fromJson(
        json.decode(map['future_outlook'] as String),
      ),
      relationships: ReportPageModel.fromJson(
        json.decode(map['relationships'] as String),
      ),
      remedies: ReportPageModel.fromJson(
        json.decode(map['remedies'] as String),
      ),
      soulJourneySummary: ReportPageModel.fromJson(
        json.decode(map['soul_journey_summary'] as String),
      ),
    );
  }
}

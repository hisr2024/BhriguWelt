import 'dart:math';
import '../../core/constants/app_constants.dart';
import '../../data/models/profile_model.dart';
import '../../data/models/report_model.dart';
import '../../data/models/wisdom_card_model.dart';

/// Interpretation Engine - Core logic for generating Soul Journey reports
///
/// This engine uses deterministic rules to generate insights based on:
/// - Birth date/time/place
/// - Calculated astrological features
/// - Matching Wisdom Cards from the database
class InterpretationEngine {
  InterpretationEngine();

  /// Generate complete Soul Journey report for a profile
  Future<ReportModel> generateReport(
    ProfileModel profile,
    List<WisdomCardModel> wisdomCards,
  ) async {
    // Calculate birth chart features
    final features = _calculateFeatures(profile);

    // Match relevant wisdom cards
    final matchedCards = _matchWisdomCards(wisdomCards, features);

    // Generate each page of the report
    final soulSignature = _generateSoulSignature(profile, features, matchedCards);
    final pastLifeThreads = _generatePastLifeThreads(profile, features, matchedCards);
    final presentKarmicPhase = _generatePresentKarmicPhase(profile, features, matchedCards);
    final futureOutlook = _generateFutureOutlook(profile, features, matchedCards);
    final relationshipsKarma = _generateRelationshipsKarma(profile, features, matchedCards);
    final remediesPractices = _generateRemediesPractices(profile, features, matchedCards);
    final completeSummary = _generateCompleteSummary(profile, features, matchedCards);

    return ReportModel.create(
      profileId: profile.id,
      soulSignature: soulSignature,
      pastLifeThreads: pastLifeThreads,
      presentKarmicPhase: presentKarmicPhase,
      futureOutlook: futureOutlook,
      relationshipsKarma: relationshipsKarma,
      remediesPractices: remediesPractices,
      completeSummary: completeSummary,
    );
  }

  /// Calculate astrological and life features from profile
  Map<String, dynamic> _calculateFeatures(ProfileModel profile) {
    final age = profile.age;
    final birthMonth = profile.dateOfBirth.month;
    final birthDay = profile.dateOfBirth.day;

    // Calculate zodiac sign (simplified Western zodiac)
    final zodiacSign = _calculateZodiacSign(birthMonth, birthDay);

    // Calculate nakshatra (simplified lunar mansion)
    final nakshatra = _calculateNakshatra(birthMonth, birthDay);

    // Determine dominant element
    final element = _calculateElement(zodiacSign);

    // Determine life phase
    final lifePhase = _calculateLifePhase(age);

    // Calculate elemental archetype (soul essence)
    final archetype = _calculateArchetype(birthMonth, birthDay, age);

    // Calculate karmic number (birth date sum)
    final karmicNumber = _calculateKarmicNumber(profile.dateOfBirth);

    return {
      'age': age,
      'zodiacSign': zodiacSign,
      'nakshatra': nakshatra,
      'element': element,
      'lifePhase': lifePhase,
      'archetype': archetype,
      'karmicNumber': karmicNumber,
      'birthMonth': birthMonth,
      'birthDay': birthDay,
      'birthYear': profile.dateOfBirth.year,
    };
  }

  /// Match wisdom cards based on features
  List<WisdomCardModel> _matchWisdomCards(
    List<WisdomCardModel> allCards,
    Map<String, dynamic> features,
  ) {
    final matched = allCards.where((card) => card.matches(features)).toList();

    // Sort by priority (descending)
    matched.sort((a, b) => b.priority.compareTo(a.priority));

    return matched;
  }

  /// Page 1: Soul Signature
  ReportPage _generateSoulSignature(
    ProfileModel profile,
    Map<String, dynamic> features,
    List<WisdomCardModel> cards,
  ) {
    final soulCards = cards.where((c) => c.topic == 'soul_signature' || c.topic == 'spiritual').take(3).toList();

    final content = '''
Beloved Seeker ${profile.name},

Your soul entered this earthly realm on ${_formatDate(profile.dateOfBirth)} at ${profile.timeOfBirth} in ${profile.placeOfBirth}.

**Soul Essence:** ${features['archetype']}
**Zodiac Influence:** ${features['zodiacSign']}
**Lunar Mansion:** ${features['nakshatra']}
**Dominant Element:** ${features['element']}
**Karmic Number:** ${features['karmicNumber']}

The cosmic forces at your birth reveal a soul marked by ${_getArchetypeDescription(features['archetype'])}. Your journey in this incarnation is guided by the ${features['element']} element, which shapes your approach to life's challenges and opportunities.

${soulCards.isNotEmpty ? '\n${soulCards.map((c) => c.render(features)).join('\n\n')}' : ''}
''';

    return ReportPage(
      title: 'Soul Signature',
      content: content,
      bulletPoints: [
        'Core Soul Essence: ${features['archetype']}',
        'Elemental Nature: ${features['element']}',
        'Karmic Path Number: ${features['karmicNumber']}',
      ],
      highlights: {
        'Life Purpose': 'To embody and master the qualities of ${features['element']} in service to others',
        'Soul Gift': 'Natural alignment with ${features['archetype']} energies',
      },
      blessings: [
        'You carry the wisdom of ${features['nakshatra']} nakshatra',
        'Your soul is blessed with ${features['element']} elemental strength',
      ],
    );
  }

  /// Page 2: Past Life Threads
  ReportPage _generatePastLifeThreads(
    ProfileModel profile,
    Map<String, dynamic> features,
    List<WisdomCardModel> cards,
  ) {
    final pastLifeCards = cards.where((c) => c.topic == 'past_life').take(3).toList();

    final karmicNumber = features['karmicNumber'] as int;
    final pastLifeRole = _getPastLifeRole(karmicNumber);
    final pastLifeRegion = _getPastLifeRegion(features['nakshatra']);

    final content = '''
The Akashic Records reveal that your soul has walked many paths before this present incarnation.

**Primary Past Life Imprint:** $pastLifeRole
**Geographic Soul Memory:** $pastLifeRegion
**Karmic Debts:** ${_getKarmicDebts(karmicNumber)}
**Karmic Credits:** ${_getKarmicCredits(karmicNumber)}

In your most influential past life, you were $pastLifeRole in the region of $pastLifeRegion. The karma from that lifetime shapes your current relationships, talents, and challenges.

${pastLifeCards.isNotEmpty ? '\n${pastLifeCards.map((c) => c.render(features)).join('\n\n')}' : ''}

The veil between your past and present is thin in matters of ${_getKarmicTheme(features)}.
''';

    return ReportPage(
      title: 'Past Life Threads',
      content: content,
      bulletPoints: [
        'Past Life Role: $pastLifeRole',
        'Soul Memory Region: $pastLifeRegion',
        'Karmic Pattern: ${_getKarmicTheme(features)}',
      ],
      warnings: [
        'Avoid repeating past life patterns of ${_getKarmicWarning(karmicNumber)}',
      ],
    );
  }

  /// Page 3: Present Karmic Phase
  ReportPage _generatePresentKarmicPhase(
    ProfileModel profile,
    Map<String, dynamic> features,
    List<WisdomCardModel> cards,
  ) {
    final presentCards = cards.where((c) => c.topic == 'present' || c.topic == 'career' || c.topic == 'health').take(4).toList();

    final age = features['age'] as int;
    final lifePhase = features['lifePhase'] as String;
    final currentChallenge = _getCurrentChallenge(features);
    final currentOpportunity = _getCurrentOpportunity(features);

    final content = '''
At age $age, you are in the $lifePhase phase of your soul's journey.

**Current Life Phase:** $lifePhase
**Primary Challenge:** $currentChallenge
**Primary Opportunity:** $currentOpportunity
**Dharmic Focus:** ${_getDharmicFocus(features)}

The present moment calls you to ${_getPresentAction(features)}. Your karmic work in this phase centers on mastering ${features['element']} energy through practical application in daily life.

${presentCards.isNotEmpty ? '\n${presentCards.map((c) => c.render(features)).join('\n\n')}' : ''}
''';

    return ReportPage(
      title: 'Present Karmic Phase',
      content: content,
      bulletPoints: [
        'Life Phase: $lifePhase',
        'Current Focus: ${_getDharmicFocus(features)}',
        'Key Challenge: $currentChallenge',
        'Key Opportunity: $currentOpportunity',
      ],
      highlights: {
        'Immediate Action': _getPresentAction(features),
        'Monthly Practice': 'Meditate on ${features['element']} element daily',
      },
    );
  }

  /// Page 4: Future Outlook (2024-2032 timeline)
  ReportPage _generateFutureOutlook(
    ProfileModel profile,
    Map<String, dynamic> features,
    List<WisdomCardModel> cards,
  ) {
    final futureCards = cards.where((c) => c.topic == 'future').take(3).toList();

    final timeline = _generateTimeline(features);

    final content = '''
The celestial movements from ${AppConstants.futureTimelineStartYear} to ${AppConstants.futureTimelineEndYear} reveal a path of transformation and growth.

**Destiny Arc:** ${_getDestinyArc(features)}
**Major Turning Points:** ${timeline.where((e) => !e.isPositive).length} challenges, ${timeline.where((e) => e.isPositive).length} opportunities

${futureCards.isNotEmpty ? '\n${futureCards.map((c) => c.render(features)).join('\n\n')}' : ''}

The Rishis advise: "What you sow in ${AppConstants.futureTimelineStartYear}-${AppConstants.futureTimelineStartYear + 2}, you shall reap in ${AppConstants.futureTimelineEndYear - 2}-${AppConstants.futureTimelineEndYear}."
''';

    return ReportPage(
      title: 'Future Outlook',
      content: content,
      timeline: timeline,
      bulletPoints: [
        'Destiny Path: ${_getDestinyArc(features)}',
        'Peak Years: ${_getPeakYears(timeline)}',
        'Challenging Years: ${_getChallengingYears(timeline)}',
      ],
      blessings: [
        'Divine grace flows strongest in years ending in ${_getLuckyDigit(features)}',
      ],
    );
  }

  /// Page 5: Relationships & Marriage Karma
  ReportPage _generateRelationshipsKarma(
    ProfileModel profile,
    Map<String, dynamic> features,
    List<WisdomCardModel> cards,
  ) {
    final relationshipCards = cards.where((c) => c.topic == 'marriage' || c.topic == 'relationships').take(3).toList();

    final content = '''
Your karmic patterns in relationships are deeply influenced by your past life as ${_getPastLifeRole(features['karmicNumber'])}.

**Soul Mate Indicator:** ${_getSoulMateIndicator(features)}
**Marriage Karma:** ${_getMarriageKarma(features)}
**Compatible Elements:** ${_getCompatibleElements(features['element'])}
**Relationship Lessons:** ${_getRelationshipLessons(features)}

${relationshipCards.isNotEmpty ? '\n${relationshipCards.map((c) => c.render(features)).join('\n\n')}' : ''}

In matters of the heart, seek partners who honor your ${features['element']} nature. Avoid those who ${_getRelationshipWarning(features)}.
''';

    return ReportPage(
      title: 'Relationships & Marriage Karma',
      content: content,
      bulletPoints: [
        'Soul Mate Pattern: ${_getSoulMateIndicator(features)}',
        'Best Partners: ${_getCompatibleElements(features['element'])}',
        'Relationship Focus: ${_getRelationshipLessons(features)}',
      ],
      warnings: [
        _getRelationshipWarning(features),
        'Never make major relationship decisions during retrograde periods',
      ],
    );
  }

  /// Page 6: Remedies & Practices
  ReportPage _generateRemediesPractices(
    ProfileModel profile,
    Map<String, dynamic> features,
    List<WisdomCardModel> cards,
  ) {
    final remedyCards = cards.where((c) => c.topic == 'remedies').take(2).toList();

    final content = '''
To harmonize your karmic energies and accelerate your soul's evolution, the ancient Rishis prescribe:

**Element Balancing:** ${_getElementRemedies(features['element'])}
**Planetary Remedies:** ${_getPlanetaryRemedies(features)}
**Mantra Practice:** ${_getMantra(features)}
**Sacred Days:** ${_getSacredDays(features)}

${remedyCards.isNotEmpty ? '\n${remedyCards.map((c) => c.render(features)).join('\n\n')}' : ''}
''';

    final dailyPractices = _getDailyPractices(features);
    final monthlyRituals = _getMonthlyRituals(features);

    return ReportPage(
      title: 'Remedies & Practices',
      content: content,
      bulletPoints: [
        ...dailyPractices,
        ...monthlyRituals,
      ],
      highlights: {
        'Primary Mantra': _getMantra(features),
        'Power Day': _getSacredDays(features),
      },
    );
  }

  /// Page 7: Complete Soul Journey Summary
  ReportPage _generateCompleteSummary(
    ProfileModel profile,
    Map<String, dynamic> features,
    List<WisdomCardModel> cards,
  ) {
    final content = '''
Beloved ${profile.name},

Your soul's journey is a sacred tapestry woven from ancient karma and future potential.

**Your Essence:** ${features['archetype']} soul guided by ${features['element']} element
**Your Past:** ${_getPastLifeRole(features['karmicNumber'])} seeking redemption and growth
**Your Present:** Walking the path of ${_getDharmicFocus(features)} with courage
**Your Future:** Destined for ${_getDestinyArc(features)}

The ancient seers remind you: "You are not here by accident. Every breath, every challenge, every joy is part of your soul's grand design."

**Final Rishi Statement:**
"${_getFinalRishiStatement(features)}"

May your journey be blessed with wisdom, love, and liberation.

ॐ शान्तिः शान्तिः शान्तिः
(Om Shanti Shanti Shanti - Peace, Peace, Peace)
''';

    return ReportPage(
      title: 'Complete Soul Journey Summary',
      content: content,
      bulletPoints: [
        'Soul Purpose: Embody ${features['archetype']} wisdom',
        'Life Mission: Master ${features['element']} element',
        'Ultimate Goal: Spiritual liberation through service',
      ],
      blessings: [
        'You are blessed with divine protection',
        'Your ancestors walk with you',
        'The universe conspires for your highest good',
      ],
    );
  }

  // ============================================================================
  // HELPER METHODS - Astrological Calculations
  // ============================================================================

  String _calculateZodiacSign(int month, int day) {
    if ((month == 3 && day >= 21) || (month == 4 && day <= 19)) return 'Aries';
    if ((month == 4 && day >= 20) || (month == 5 && day <= 20)) return 'Taurus';
    if ((month == 5 && day >= 21) || (month == 6 && day <= 20)) return 'Gemini';
    if ((month == 6 && day >= 21) || (month == 7 && day <= 22)) return 'Cancer';
    if ((month == 7 && day >= 23) || (month == 8 && day <= 22)) return 'Leo';
    if ((month == 8 && day >= 23) || (month == 9 && day <= 22)) return 'Virgo';
    if ((month == 9 && day >= 23) || (month == 10 && day <= 22)) return 'Libra';
    if ((month == 10 && day >= 23) || (month == 11 && day <= 21)) return 'Scorpio';
    if ((month == 11 && day >= 22) || (month == 12 && day <= 21)) return 'Sagittarius';
    if ((month == 12 && day >= 22) || (month == 1 && day <= 19)) return 'Capricorn';
    if ((month == 1 && day >= 20) || (month == 2 && day <= 18)) return 'Aquarius';
    return 'Pisces';
  }

  String _calculateNakshatra(int month, int day) {
    // Simplified nakshatra calculation based on day of year
    final dayOfYear = _getDayOfYear(month, day);
    final nakshatraIndex = (dayOfYear * 27 ~/ 365) % 27;
    return AppConstants.nakshatras[nakshatraIndex];
  }

  int _getDayOfYear(int month, int day) {
    const daysInMonth = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
    return daysInMonth[month - 1] + day;
  }

  String _calculateElement(String zodiacSign) {
    const fireSigns = ['Aries', 'Leo', 'Sagittarius'];
    const earthSigns = ['Taurus', 'Virgo', 'Capricorn'];
    const airSigns = ['Gemini', 'Libra', 'Aquarius'];
    const waterSigns = ['Cancer', 'Scorpio', 'Pisces'];

    if (fireSigns.contains(zodiacSign)) return 'Fire';
    if (earthSigns.contains(zodiacSign)) return 'Earth';
    if (airSigns.contains(zodiacSign)) return 'Air';
    if (waterSigns.contains(zodiacSign)) return 'Water';
    return 'Ether';
  }

  String _calculateLifePhase(int age) {
    if (age <= 12) return 'Childhood (0-12)';
    if (age <= 24) return 'Youth (13-24)';
    if (age <= 48) return 'Adulthood (25-48)';
    if (age <= 72) return 'Maturity (49-72)';
    return 'Wisdom (73+)';
  }

  String _calculateArchetype(int month, int day, int age) {
    final archetypes = [
      'The Mystic Seeker',
      'The Warrior of Light',
      'The Healing Sage',
      'The Divine Artist',
      'The Sacred Teacher',
      'The Compassionate Healer',
      'The Visionary Leader',
      'The Silent Monk',
    ];

    final index = (month + day + (age % 10)) % archetypes.length;
    return archetypes[index];
  }

  int _calculateKarmicNumber(DateTime birthDate) {
    // Sum all digits of birth date
    int sum = 0;
    final dateString = '${birthDate.day}${birthDate.month}${birthDate.year}';
    for (int i = 0; i < dateString.length; i++) {
      sum += int.parse(dateString[i]);
    }

    // Reduce to single digit (except master numbers 11, 22, 33)
    while (sum > 9 && sum != 11 && sum != 22 && sum != 33) {
      sum = sum.toString().split('').map(int.parse).reduce((a, b) => a + b);
    }

    return sum;
  }

  // ============================================================================
  // HELPER METHODS - Content Generation
  // ============================================================================

  String _getArchetypeDescription(String archetype) {
    const descriptions = {
      'The Mystic Seeker': 'deep spiritual yearning and intuitive wisdom',
      'The Warrior of Light': 'courage, determination, and righteous action',
      'The Healing Sage': 'compassion, healing abilities, and ancient knowledge',
      'The Divine Artist': 'creative expression and beauty in all forms',
      'The Sacred Teacher': 'wisdom sharing and guiding others',
      'The Compassionate Healer': 'empathy and the power to heal wounds',
      'The Visionary Leader': 'foresight and the ability to inspire change',
      'The Silent Monk': 'contemplation, peace, and inner stillness',
    };
    return descriptions[archetype] ?? 'unique spiritual qualities';
  }

  String _getPastLifeRole(int karmicNumber) {
    const roles = {
      1: 'a spiritual leader guiding seekers to enlightenment',
      2: 'a devoted healer serving in ancient temples',
      3: 'an artist creating sacred works for the divine',
      4: 'a builder constructing temples and monasteries',
      5: 'a wandering sage spreading wisdom across lands',
      6: 'a family protector ensuring lineage continuation',
      7: 'a mystic hermit seeking ultimate truth',
      8: 'a powerful ruler balancing karma and dharma',
      9: 'a compassionate monk serving the poorest',
      11: 'a master teacher initiating disciples',
      22: 'a master builder creating sacred architecture',
      33: 'a master healer channeling divine grace',
    };
    return roles[karmicNumber] ?? 'a soul learning essential lessons';
  }

  String _getPastLifeRegion(String nakshatra) {
    // Group nakshatras by region
    final indianNakshatras = AppConstants.nakshatras.sublist(0, 9);
    final tibetanNakshatras = AppConstants.nakshatras.sublist(9, 18);
    final egyptianNakshatras = AppConstants.nakshatras.sublist(18, 27);

    if (indianNakshatras.contains(nakshatra)) return 'Ancient India (Bharat)';
    if (tibetanNakshatras.contains(nakshatra)) return 'Himalayan Regions (Tibet)';
    if (egyptianNakshatras.contains(nakshatra)) return 'Ancient Egypt';
    return 'Mediterranean Lands';
  }

  String _getKarmicDebts(int karmicNumber) {
    if (karmicNumber == 4 || karmicNumber == 8) return 'Moderate karmic debts requiring conscious healing';
    if (karmicNumber == 1 || karmicNumber == 9) return 'Minimal karmic debts, soul is advanced';
    return 'Balanced karmic accounts from past lives';
  }

  String _getKarmicCredits(int karmicNumber) {
    if (karmicNumber == 11 || karmicNumber == 22 || karmicNumber == 33) {
      return 'Exceptional karmic credits - master soul number';
    }
    if (karmicNumber == 3 || karmicNumber == 6 || karmicNumber == 9) {
      return 'Strong karmic credits from selfless service';
    }
    return 'Moderate karmic credits building steadily';
  }

  String _getKarmicTheme(Map<String, dynamic> features) {
    final element = features['element'];
    const themes = {
      'Fire': 'leadership, courage, and spiritual warriorship',
      'Earth': 'grounding, manifestation, and material mastery',
      'Air': 'communication, intellect, and connection',
      'Water': 'emotion, intuition, and healing',
      'Ether': 'transcendence, space, and divine consciousness',
    };
    return themes[element] ?? 'spiritual evolution';
  }

  String _getKarmicWarning(int karmicNumber) {
    const warnings = {
      1: 'ego and pride',
      2: 'codependency and lack of boundaries',
      3: 'scattered energy and superficiality',
      4: 'rigidity and fear of change',
      5: 'restlessness and escapism',
      6: 'martyrdom and over-responsibility',
      7: 'isolation and spiritual bypassing',
      8: 'power abuse and materialism',
      9: 'emotional overwhelm and martyrdom',
    };
    return warnings[karmicNumber] ?? 'unconscious patterns';
  }

  String _getCurrentChallenge(Map<String, dynamic> features) {
    final age = features['age'] as int;
    if (age < 25) return 'Finding your authentic path amid external pressures';
    if (age < 40) return 'Balancing worldly success with spiritual growth';
    if (age < 60) return 'Releasing old patterns and embracing transformation';
    return 'Sharing wisdom while preparing for transition';
  }

  String _getCurrentOpportunity(Map<String, dynamic> features) {
    final element = features['element'];
    const opportunities = {
      'Fire': 'Leading bold initiatives that inspire others',
      'Earth': 'Building lasting structures and foundations',
      'Air': 'Connecting diverse people and ideas',
      'Water': 'Healing emotional wounds in self and others',
      'Ether': 'Accessing higher consciousness and divine guidance',
    };
    return opportunities[element] ?? 'Personal growth and evolution';
  }

  String _getDharmicFocus(Map<String, dynamic> features) {
    final lifePhase = features['lifePhase'] as String;
    if (lifePhase.contains('Childhood')) return 'Learning and Foundation Building';
    if (lifePhase.contains('Youth')) return 'Self-Discovery and Skill Development';
    if (lifePhase.contains('Adulthood')) return 'Service and Manifestation';
    if (lifePhase.contains('Maturity')) return 'Wisdom Integration and Mentorship';
    return 'Liberation and Transcendence';
  }

  String _getPresentAction(Map<String, dynamic> features) {
    final element = features['element'];
    const actions = {
      'Fire': 'take bold action on your highest vision',
      'Earth': 'ground your dreams in practical daily steps',
      'Air': 'share your wisdom through communication',
      'Water': 'trust your intuition and emotional guidance',
      'Ether': 'surrender to the divine flow and meditate deeply',
    };
    return actions[element] ?? 'honor your inner guidance';
  }

  List<TimelineEvent> _generateTimeline(Map<String, dynamic> features) {
    final events = <TimelineEvent>[];
    final karmicNumber = features['karmicNumber'] as int;
    final random = Random(karmicNumber); // Deterministic randomness

    for (int year = AppConstants.futureTimelineStartYear;
        year <= AppConstants.futureTimelineEndYear;
        year++) {
      // Determine if year is positive based on karmic alignment
      final isPositive = (year + karmicNumber) % 3 != 0;

      if (isPositive) {
        events.add(TimelineEvent(
          year: year,
          title: 'Year of Growth and Expansion',
          description: _getPositiveYearDescription(year, features),
          isPositive: true,
          recommendations: _getYearRecommendations(year, features, true),
        ));
      } else {
        events.add(TimelineEvent(
          year: year,
          title: 'Year of Transformation and Lessons',
          description: _getChallengeYearDescription(year, features),
          isPositive: false,
          recommendations: _getYearRecommendations(year, features, false),
        ));
      }
    }

    return events;
  }

  String _getPositiveYearDescription(int year, Map<String, dynamic> features) {
    return 'Divine blessings flow freely. Focus on ${_getYearFocus(year, features)}.';
  }

  String _getChallengeYearDescription(int year, Map<String, dynamic> features) {
    return 'Karmic lessons arise. Navigate with wisdom and patience in ${_getYearFocus(year, features)}.';
  }

  String _getYearFocus(int year, Map<String, dynamic> features) {
    final focuses = ['career advancement', 'relationships', 'health', 'spiritual growth', 'financial stability'];
    return focuses[(year + features['karmicNumber']) % focuses.length];
  }

  List<String> _getYearRecommendations(int year, Map<String, dynamic> features, bool isPositive) {
    if (isPositive) {
      return [
        'Initiate new projects',
        'Expand social connections',
        'Invest in personal growth',
      ];
    } else {
      return [
        'Practice patience and introspection',
        'Strengthen spiritual practices',
        'Heal old wounds',
      ];
    }
  }

  String _getPeakYears(List<TimelineEvent> timeline) {
    return timeline.where((e) => e.isPositive).map((e) => e.year).take(3).join(', ');
  }

  String _getChallengingYears(List<TimelineEvent> timeline) {
    return timeline.where((e) => !e.isPositive).map((e) => e.year).take(3).join(', ');
  }

  int _getLuckyDigit(Map<String, dynamic> features) {
    return features['karmicNumber'] as int;
  }

  String _getDestinyArc(Map<String, dynamic> features) {
    final element = features['element'];
    const arcs = {
      'Fire': 'Leadership and inspiring transformation',
      'Earth': 'Building lasting legacy and abundance',
      'Air': 'Knowledge sharing and global connection',
      'Water': 'Deep healing and emotional mastery',
      'Ether': 'Spiritual enlightenment and cosmic union',
    };
    return arcs[element] ?? 'Personal fulfillment and service';
  }

  String _getSoulMateIndicator(Map<String, dynamic> features) {
    final karmicNumber = features['karmicNumber'] as int;
    if (karmicNumber == 11 || karmicNumber == 22 || karmicNumber == 33) {
      return 'Twin Flame connection destined';
    }
    if (karmicNumber % 2 == 0) {
      return 'Soul mate connection through karmic bonds';
    }
    return 'Divine partnership through spiritual alignment';
  }

  String _getMarriageKarma(Map<String, dynamic> features) {
    final age = features['age'] as int;
    if (age < 25) return 'Marriage timing after age 25 is karmically favorable';
    if (age < 35) return 'Current period supports sacred union';
    return 'Marriage brings karmic completion and spiritual partnership';
  }

  String _getCompatibleElements(String element) {
    const compatibility = {
      'Fire': 'Fire, Air (avoid Water)',
      'Earth': 'Earth, Water (avoid Air)',
      'Air': 'Air, Fire (avoid Earth)',
      'Water': 'Water, Earth (avoid Fire)',
      'Ether': 'All elements in balance',
    };
    return compatibility[element] ?? 'Balanced partnerships';
  }

  String _getRelationshipLessons(Map<String, dynamic> features) {
    final element = features['element'];
    const lessons = {
      'Fire': 'Learning patience and compromise',
      'Earth': 'Learning spontaneity and flexibility',
      'Air': 'Learning emotional depth and commitment',
      'Water': 'Learning boundaries and independence',
      'Ether': 'Learning to ground love in earthly form',
    };
    return lessons[element] ?? 'Learning unconditional love';
  }

  String _getRelationshipWarning(Map<String, dynamic> features) {
    final element = features['element'];
    const warnings = {
      'Fire': 'diminish your flame or compete with your light',
      'Earth': 'lack stability or disrespect your need for security',
      'Air': 'restrict your freedom or dismiss your ideas',
      'Water': 'invalidate your emotions or create drama',
      'Ether': 'pull you from your spiritual path',
    };
    return 'Avoid those who ${warnings[element] ?? "do not honor your essence"}';
  }

  String _getElementRemedies(String element) {
    const remedies = {
      'Fire': 'Light candles every morning, face the sun during sunrise',
      'Earth': 'Walk barefoot on soil daily, grow sacred plants',
      'Air': 'Practice pranayama breathing, burn incense',
      'Water': 'Bathe in sacred waters, honor the moon cycles',
      'Ether': 'Meditate in silence, chant Om 108 times daily',
    };
    return remedies[element] ?? 'Connect with nature daily';
  }

  String _getPlanetaryRemedies(Map<String, dynamic> features) {
    final karmicNumber = features['karmicNumber'] as int;
    if (karmicNumber == 1) return 'Honor the Sun - wear ruby or red gemstone';
    if (karmicNumber == 2) return 'Honor the Moon - wear pearl or moonstone';
    if (karmicNumber == 3) return 'Honor Jupiter - wear yellow sapphire';
    if (karmicNumber == 4) return 'Honor Rahu - wear hessonite garnet';
    if (karmicNumber == 5) return 'Honor Mercury - wear emerald';
    if (karmicNumber == 6) return 'Honor Venus - wear diamond or white sapphire';
    if (karmicNumber == 7) return 'Honor Ketu - wear cat\'s eye';
    if (karmicNumber == 8) return 'Honor Saturn - wear blue sapphire (with care)';
    if (karmicNumber == 9) return 'Honor Mars - wear red coral';
    return 'Consult a Vedic astrologer for personalized gemstone remedy';
  }

  String _getMantra(Map<String, dynamic> features) {
    final element = features['element'];
    const mantras = {
      'Fire': 'Om Suryaya Namaha (Salutations to the Sun)',
      'Earth': 'Om Prithivyai Namaha (Salutations to Earth)',
      'Air': 'Om Vayave Namaha (Salutations to Wind)',
      'Water': 'Om Varunaya Namaha (Salutations to Water)',
      'Ether': 'Om Akashaya Namaha (Salutations to Ether)',
    };
    return mantras[element] ?? 'Om Namah Shivaya';
  }

  String _getSacredDays(Map<String, dynamic> features) {
    final nakshatra = features['nakshatra'];
    return 'Days when Moon transits $nakshatra nakshatra';
  }

  List<String> _getDailyPractices(Map<String, dynamic> features) {
    return [
      'Daily Practice: Chant ${_getMantra(features)} 21 times each morning',
      'Daily Practice: ${_getElementRemedies(features['element'])}',
      'Daily Practice: Offer gratitude to ancestors before meals',
    ];
  }

  List<String> _getMonthlyRituals(Map<String, dynamic> features) {
    return [
      'Monthly Ritual: Fast on Full Moon days',
      'Monthly Ritual: Donate to spiritual causes on ${_getSacredDays(features)}',
      'Monthly Ritual: Perform fire ceremony (havan) on New Moon',
    ];
  }

  String _getFinalRishiStatement(Map<String, dynamic> features) {
    final statements = [
      'Your soul chose this path before birth. Walk it with faith and courage.',
      'The divine works through you. Trust the unfolding of your sacred destiny.',
      'Every challenge is a doorway to greater light. Step through with grace.',
      'You are never alone. The ancestors, angels, and masters guide your way.',
      'Your life is a prayer. Live it as an offering to the highest good.',
      'Liberation comes through service. Serve with love and detachment.',
    ];

    final index = features['karmicNumber'] as int;
    return statements[index % statements.length];
  }

  String _formatDate(DateTime date) {
    final months = ['', 'January', 'February', 'March', 'April', 'May', 'June',
                    'July', 'August', 'September', 'October', 'November', 'December'];
    return '${months[date.month]} ${date.day}, ${date.year}';
  }
}

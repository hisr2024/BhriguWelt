/**
 * Bhrigu Samhita & Nadi Jyotisha Wisdom Database
 * Comprehensive predictions for all 12 zodiac signs across all timeframes
 * Based on traditional Vedic astrological principles
 */

import type { PredictionTimeframe } from '@/lib/types/predictions';

export interface ZodiacWisdom {
  overall: string;
  love: string;
  career: string;
  health: string;
  finance: string;
  dos: string[];
  donts: string[];
}

export type ZodiacWisdomMap = Record<PredictionTimeframe, ZodiacWisdom>;

/**
 * Complete Bhrigu Wisdom for all 12 Zodiac Signs
 */
export const BHRIGU_WISDOM: Record<string, ZodiacWisdomMap> = {
  Aries: {
    daily: {
      overall: 'Mars, your ruling planet, empowers you with dynamic energy today. The Bhrigu Samhita indicates this as an auspicious time for bold initiatives. Your natural leadership qualities shine bright, attracting opportunities for growth and recognition.',
      love: 'Romantic energies are favorable. Express your feelings with confidence and authenticity. Your passionate nature attracts admirers.',
      career: 'Professional opportunities arise through your initiative. Take charge of important projects and demonstrate your leadership capabilities.',
      health: 'Physical vitality is strong. Channel your abundant energy through exercise and outdoor activities. Mars blesses your stamina.',
      finance: 'Financial decisions favor bold but calculated moves. Trust your instincts but verify with facts before investing.',
      dos: ['Take initiative in important matters', 'Practice physical exercise', 'Express your authentic self', 'Start new projects'],
      donts: ['Avoid impulsive arguments', "Don't rush major financial decisions", 'Refrain from overexertion'],
    },
    weekly: {
      overall: 'This week brings transformative energy for Aries. Mars influences suggest a period of dynamic action and achievement. Focus your fire element on constructive goals for maximum results.',
      love: 'Relationships deepen through honest communication. Singles may encounter passionate connections. Express your desires clearly.',
      career: 'Leadership opportunities emerge. Your pioneering spirit attracts recognition from superiors and colleagues alike.',
      health: 'Maintain balance between activity and rest. Regular exercise supports your natural vitality and mental clarity.',
      finance: 'Week favors strategic investments. Avoid impulsive spending and focus on long-term financial planning.',
      dos: ['Set clear weekly goals', 'Network with influential people', 'Balance work and rest', 'Plan finances carefully'],
      donts: ['Avoid confrontations', "Don't overcommit", 'Refrain from risky ventures'],
    },
    monthly: {
      overall: 'This month marks a significant period of growth for Aries. The planetary alignments support your ambitions and personal development. Embrace opportunities for leadership and expansion.',
      love: 'Love life flourishes with deeper connections. Important relationship milestones are possible. Commitment brings joy.',
      career: 'Career advancement indicated. New responsibilities bring recognition and rewards. Your efforts are noticed.',
      health: 'Focus on establishing healthy routines. Energy levels support ambitious goals when properly managed.',
      finance: 'Financial growth through strategic planning. Mid-month brings opportunities for income increase.',
      dos: ['Set monthly objectives', 'Invest in self-development', 'Build meaningful relationships', 'Plan for the future'],
      donts: ['Avoid hasty decisions', "Don't neglect health", 'Refrain from financial risks'],
    },
    yearly: {
      overall: 'This year brings transformational growth for Aries. The Nadi readings indicate a period of significant achievement and personal evolution. Your courage and initiative are rewarded with success.',
      love: 'Relationships evolve profoundly. Commitment and deeper bonds are favored. Marriage prospects are excellent.',
      career: 'Career reaches new heights. Leadership roles and recognition await. Major professional breakthroughs likely.',
      health: 'Year supports building lasting health habits. Vitality strengthens with consistent self-care practices.',
      finance: 'Financial prosperity through disciplined efforts. Investments bear fruit. Wealth accumulation favored.',
      dos: ['Embrace major life changes', 'Invest in long-term goals', 'Build lasting relationships', 'Focus on personal growth'],
      donts: ['Avoid impatience with results', "Don't ignore health signs", 'Refrain from risky ventures'],
    },
  },

  Taurus: {
    daily: {
      overall: 'Venus bestows her blessings upon you today, dear Taurus. The Bhrigu Samhita indicates favorable conditions for material gains and sensory pleasures. Your steadfast nature attracts stability.',
      love: 'Romance flourishes under Venus influence. Express affection through tangible gestures. Your loyalty attracts deep connections.',
      career: 'Professional stability is highlighted. Focus on building upon existing foundations. Quality work brings rewards.',
      health: 'Pay attention to throat and neck areas. Gentle exercise and good nutrition support your wellbeing today.',
      finance: 'Excellent day for financial matters. Your natural business acumen guides wise decisions. Save and invest wisely.',
      dos: ['Focus on quality over quantity', 'Indulge in healthy pleasures', 'Build financial reserves', 'Express gratitude'],
      donts: ['Avoid stubbornness', "Don't overspend on luxuries", 'Refrain from resistance to change'],
    },
    weekly: {
      overall: 'This week emphasizes building and consolidating, Taurus. Venus and Earth energies support material progress. Your persistence pays dividends.',
      love: 'Stable, nurturing energy surrounds relationships. Deepen bonds through quality time and shared experiences.',
      career: 'Steady progress in professional matters. Your reliability is recognized. Long-term projects advance well.',
      health: 'Maintain regular routines. Your body responds well to consistency. Focus on nutrition and rest.',
      finance: 'Financial stability strengthens. Good week for savings and investments. Avoid unnecessary expenditures.',
      dos: ['Establish routines', 'Nurture relationships', 'Save money', 'Appreciate beauty'],
      donts: ['Avoid inflexibility', "Don't hoard", 'Refrain from comfort eating'],
    },
    monthly: {
      overall: 'This month brings abundance and growth for Taurus. Material success and emotional fulfillment align. Your patience is rewarded with tangible results.',
      love: 'Deep, lasting connections form. Existing relationships stabilize and grow. Singles attract committed partners.',
      career: 'Professional advancement through steady effort. Your work quality is recognized. Promotions or raises possible.',
      health: 'Health improves with consistent habits. Focus on diet and regular exercise. Your body responds positively.',
      finance: 'Excellent month for wealth building. Investments grow. Income sources may multiply.',
      dos: ['Build for the future', 'Invest in quality', 'Deepen relationships', 'Practice self-care'],
      donts: ['Avoid possessiveness', "Don't resist necessary changes", 'Refrain from excess'],
    },
    yearly: {
      overall: 'This year brings material prosperity and emotional growth for Taurus. The cosmic currents favor building lasting foundations in all areas of life.',
      love: 'Love life reaches new depths. Marriage and long-term commitment are strongly favored. Happiness in partnerships.',
      career: 'Career establishes solid foundations. Business ventures succeed. Professional reputation grows.',
      health: 'Year favors building sustainable health habits. Long-term wellness improves significantly.',
      finance: 'Financial security strengthens. Property investments favored. Wealth accumulates steadily.',
      dos: ['Build lasting foundations', 'Invest in property', 'Cultivate patience', 'Enjoy lifes pleasures mindfully'],
      donts: ['Avoid stagnation', "Don't cling to outdated patterns", 'Refrain from materialism'],
    },
  },

  Gemini: {
    daily: {
      overall: 'Mercury activates your mental faculties today, Gemini. Communication flows freely. The Bhrigu Samhita suggests this as an auspicious time for learning and networking.',
      love: 'Intellectual connection drives romance. Engage in stimulating conversations. Your wit attracts admirers.',
      career: 'Communication skills shine. Meetings and negotiations go well. Your ideas gain attention.',
      health: 'Mental activity is high. Balance thinking with physical movement. Rest your mind through meditation.',
      finance: 'Good day for commerce and trade. Communication leads to financial opportunities. Multiple income streams possible.',
      dos: ['Communicate clearly', 'Learn something new', 'Network actively', 'Express your ideas'],
      donts: ['Avoid gossip', "Don't scatter your energy", 'Refrain from superficial connections'],
    },
    weekly: {
      overall: 'This week buzzes with activity and communication for Gemini. Mercury enhances all forms of exchange. Versatility serves you well.',
      love: 'Variety and communication enhance relationships. Express feelings through words. Social activities bring romantic opportunities.',
      career: 'Professional communication flows. Collaborations succeed. Your versatility is valued.',
      health: 'Nervous energy requires outlets. Exercise and mental relaxation both needed. Watch for stress signs.',
      finance: 'Multiple opportunities emerge. Trading and commerce favored. Diversify income sources.',
      dos: ['Connect with others', 'Pursue varied interests', 'Stay curious', 'Adapt to changes'],
      donts: ['Avoid indecision', "Don't spread yourself thin", 'Refrain from restlessness'],
    },
    monthly: {
      overall: 'This month brings intellectual growth and diverse opportunities for Gemini. Your adaptability leads to success in multiple areas.',
      love: 'Relationships thrive through communication. New connections form easily. Existing bonds strengthen through dialogue.',
      career: 'Career advances through networking and communication. New projects and collaborations emerge.',
      health: 'Balance mental and physical activity. Establish healthy routines for optimal wellbeing.',
      finance: 'Financial diversity brings security. Multiple income streams develop. Commerce and trade prosper.',
      dos: ['Expand your network', 'Learn new skills', 'Communicate intentions', 'Embrace variety'],
      donts: ['Avoid inconsistency', "Don't ignore details", 'Refrain from nervous habits'],
    },
    yearly: {
      overall: 'This year brings expansion through knowledge and connections for Gemini. Your intellectual gifts lead to significant achievements.',
      love: 'Love life brings variety and growth. Intellectual compatibility is key. Communication deepens bonds.',
      career: 'Career flourishes through communication and ideas. Writing, teaching, or media success possible.',
      health: 'Year emphasizes mental health. Establish practices for stress management and mental clarity.',
      finance: 'Financial growth through multiple channels. Intellectual property and commerce succeed.',
      dos: ['Pursue education', 'Build diverse connections', 'Write and communicate', 'Stay adaptable'],
      donts: ['Avoid superficiality', "Don't neglect depth", 'Refrain from nervous tension'],
    },
  },

  Cancer: {
    daily: {
      overall: 'The Moon nurtures your emotional depths today, Cancer. The Bhrigu Samhita indicates strong intuition and family blessings. Home and heart are sources of strength.',
      love: 'Emotional connections deepen. Express your caring nature. Nurturing gestures strengthen bonds.',
      career: 'Work from a place of intuition. Projects involving care or nurturing succeed. Trust your feelings about colleagues.',
      health: 'Emotional health affects physical wellbeing. Practice self-nurturing. Water-related activities benefit.',
      finance: 'Financial intuition is strong. Home-related investments favored. Security-focused decisions succeed.',
      dos: ['Nurture yourself and others', 'Trust your intuition', 'Spend time at home', 'Connect with family'],
      donts: ['Avoid mood swings', "Don't suppress emotions", 'Refrain from over-protectiveness'],
    },
    weekly: {
      overall: 'This week emphasizes emotional security and family for Cancer. The Moon guides you toward nurturing connections and domestic harmony.',
      love: 'Deep emotional bonds form. Family involvement in romance is highlighted. Nurturing love grows.',
      career: 'Work environment benefits from your caring approach. Projects requiring empathy succeed.',
      health: 'Emotional balance supports physical health. Practice water-based healing. Rest and restore.',
      finance: 'Financial security improves through cautious approach. Home and family investments favored.',
      dos: ['Create a nurturing environment', 'Process emotions healthily', 'Care for family', 'Build security'],
      donts: ['Avoid emotional manipulation', "Don't cling to the past", 'Refrain from worry'],
    },
    monthly: {
      overall: 'This month brings emotional growth and domestic blessings for Cancer. Family matters flourish. Security strengthens.',
      love: 'Love life deepens emotionally. Commitment grows. Family harmony enhances relationships.',
      career: 'Career progresses through emotional intelligence. Leadership through caring succeeds.',
      health: 'Health improves through emotional balance. Digestive system needs attention. Water therapies help.',
      finance: 'Financial security builds. Real estate and home investments prosper. Savings grow.',
      dos: ['Strengthen family bonds', 'Create emotional safety', 'Invest in home', 'Practice self-care'],
      donts: ['Avoid moodiness', "Don't be overly cautious", 'Refrain from emotional eating'],
    },
    yearly: {
      overall: 'This year brings profound emotional growth and family blessings for Cancer. Home becomes a sanctuary. Security reaches new heights.',
      love: 'Love life transforms through deep emotional connection. Marriage and family strongly favored.',
      career: 'Career success through nurturing leadership. Industries involving care or food prosper.',
      health: 'Year emphasizes emotional and digestive health. Water-based healing brings renewal.',
      finance: 'Financial security strengthens significantly. Property ownership and family wealth grow.',
      dos: ['Build lasting family bonds', 'Create your dream home', 'Trust your intuition', 'Nurture your dreams'],
      donts: ['Avoid emotional withdrawal', "Don't hold onto hurts", 'Refrain from excessive caution'],
    },
  },

  Leo: {
    daily: {
      overall: 'The Sun illuminates your path today, Leo. The Bhrigu Samhita indicates this as a time for shining brightly. Your natural radiance attracts recognition and admiration.',
      love: 'Romance sparkles with drama and passion. Express your generous heart. Your warmth attracts love.',
      career: 'Leadership qualities shine. Take center stage in professional matters. Recognition comes naturally.',
      health: 'Vitality is strong. Heart health is emphasized. Express yourself through physical activity.',
      finance: 'Generous spending balanced with wise investment. Creative ventures bring financial rewards.',
      dos: ['Express your creativity', 'Lead with confidence', 'Share your warmth', 'Celebrate life'],
      donts: ['Avoid excessive pride', "Don't demand constant attention", 'Refrain from dramatic reactions'],
    },
    weekly: {
      overall: 'This week puts you in the spotlight, Leo. Solar energy amplifies your natural charisma. Lead with heart and confidence.',
      love: 'Romantic attention increases. Your generous nature attracts admirers. Express love dramatically.',
      career: 'Professional recognition comes. Leadership opportunities multiply. Creative projects succeed.',
      health: 'Energy levels are high. Channel vitality into creative expression. Protect your heart health.',
      finance: 'Financial creativity brings rewards. Entertainment or creative investments favored.',
      dos: ['Shine brightly', 'Lead with generosity', 'Create and express', 'Enjoy the spotlight'],
      donts: ['Avoid arrogance', "Don't overshadow others", 'Refrain from extravagance'],
    },
    monthly: {
      overall: 'This month brings recognition and creative fulfillment for Leo. Your light shines brightly, attracting success and admiration.',
      love: 'Love life sparkles with passion and joy. Romance brings happiness. Creative expression enhances relationships.',
      career: 'Career reaches new heights of recognition. Leadership roles expand. Creative projects succeed brilliantly.',
      health: 'Vitality supports ambitious goals. Heart and spine need attention. Regular exercise maintains energy.',
      finance: 'Financial success through creative ventures. Entertainment industry favored. Generous but wise spending.',
      dos: ['Lead creative projects', 'Accept recognition gracefully', 'Express love generously', 'Build your kingdom'],
      donts: ['Avoid ego conflicts', "Don't neglect others needs", 'Refrain from financial showing off'],
    },
    yearly: {
      overall: 'This year brings royal achievements for Leo. Your creative gifts and leadership qualities lead to significant success and recognition.',
      love: 'Love life transforms into something magnificent. Deep romance and family joy. Marriage brings happiness.',
      career: 'Career ascends to leadership heights. Creative success and public recognition. Fame possible.',
      health: 'Year emphasizes heart health and vitality. Regular exercise and joy maintain wellbeing.',
      finance: 'Financial abundance through creative and leadership pursuits. Wealth grows through generosity.',
      dos: ['Claim your throne', 'Create your legacy', 'Love generously', 'Lead with heart'],
      donts: ['Avoid tyranny', "Don't let pride blind you", 'Refrain from excess'],
    },
  },

  Virgo: {
    daily: {
      overall: 'Mercury enhances your analytical abilities today, Virgo. The Bhrigu Samhita indicates excellence in detailed work and service. Your precision brings results.',
      love: 'Show love through acts of service. Practical gestures speak louder than words. Attention to detail impresses partners.',
      career: 'Detail-oriented work excels. Analysis and organization skills shine. Health-related fields prosper.',
      health: 'Focus on digestive health. Clean eating and routine benefit you. Small health improvements matter.',
      finance: 'Careful financial analysis pays off. Budgeting and planning bring security. Avoid unnecessary expenses.',
      dos: ['Organize your environment', 'Pay attention to details', 'Serve others', 'Practice wellness routines'],
      donts: ['Avoid excessive criticism', "Don't worry unnecessarily", 'Refrain from perfectionism paralysis'],
    },
    weekly: {
      overall: 'This week rewards careful analysis and service for Virgo. Mercury supports detailed work and health improvements.',
      love: 'Relationships improve through practical caring. Show love through helpful actions. Health-conscious activities together strengthen bonds.',
      career: 'Professional success through meticulous work. Analysis and organization valued. Health fields prosper.',
      health: 'Excellent week for health improvements. Establish or refine wellness routines. Digestive health focus.',
      finance: 'Financial organization brings peace. Budgeting and planning succeed. Small savings accumulate.',
      dos: ['Refine your systems', 'Improve health habits', 'Serve with dedication', 'Analyze before acting'],
      donts: ['Avoid over-analysis', "Don't be overly critical", 'Refrain from worry spirals'],
    },
    monthly: {
      overall: 'This month brings rewards for your dedication and service, Virgo. Your attention to detail leads to significant improvements.',
      love: 'Love life improves through practical devotion. Relationships strengthen through shared health goals.',
      career: 'Career advances through excellence. Your work quality is recognized. Health and service fields prosper.',
      health: 'Health transforms through consistent effort. Digestive and nervous system improvements. Wellness routines establish.',
      finance: 'Financial health improves through organization. Savings grow. Health-related investments succeed.',
      dos: ['Perfect your craft', 'Serve with excellence', 'Organize your life', 'Invest in health'],
      donts: ['Avoid self-criticism', "Don't neglect rest", 'Refrain from worry about small matters'],
    },
    yearly: {
      overall: 'This year brings mastery and recognition for Virgo. Your dedication to excellence and service leads to profound achievements.',
      love: 'Love life matures into practical partnership. Health and wellness shared. Service to each other deepens bonds.',
      career: 'Career reaches new levels of excellence. Recognition for detailed work. Health and service industries prosper.',
      health: 'Year brings significant health improvements. Establish lasting wellness habits. Preventive care pays off.',
      finance: 'Financial security through careful planning. Health-related investments grow. Savings accumulate significantly.',
      dos: ['Master your skills', 'Serve with dedication', 'Build health foundations', 'Organize for success'],
      donts: ['Avoid perfectionism', "Don't sacrifice health for work", 'Refrain from excessive worry'],
    },
  },

  Libra: {
    daily: {
      overall: 'Venus graces your day with harmony and beauty, Libra. The Bhrigu Samhita indicates favorable conditions for relationships and artistic pursuits. Balance is your strength.',
      love: 'Romance blossoms through harmony. Seek beauty in connections. Partnership energy is strong.',
      career: 'Diplomatic skills shine. Negotiations and partnerships succeed. Artistic or design work prospers.',
      health: 'Balance is key. Kidney and lower back need attention. Harmonious activities restore energy.',
      finance: 'Financial partnerships favored. Art and beauty investments succeed. Fair dealings bring prosperity.',
      dos: ['Create harmony', 'Cultivate beauty', 'Build partnerships', 'Practice diplomacy'],
      donts: ['Avoid indecision', "Don't sacrifice yourself for peace", 'Refrain from superficial relationships'],
    },
    weekly: {
      overall: 'This week emphasizes relationships and harmony for Libra. Venus enhances all partnerships. Beauty and balance guide your path.',
      love: 'Romantic partnerships flourish. Harmony in relationships. Singles attract balanced partners.',
      career: 'Professional partnerships succeed. Negotiations go smoothly. Creative collaborations prosper.',
      health: 'Balance brings wellness. Harmonious activities and environments support health. Address kidney care.',
      finance: 'Financial partnerships bring gain. Art and beauty investments succeed. Fair business dealings prosper.',
      dos: ['Strengthen partnerships', 'Create beautiful spaces', 'Negotiate fairly', 'Seek balance'],
      donts: ['Avoid people-pleasing', "Don't avoid necessary conflict", 'Refrain from indecision'],
    },
    monthly: {
      overall: 'This month brings partnership blessings and artistic success for Libra. Harmony in relationships and creative fulfillment await.',
      love: 'Love life reaches new heights of harmony. Commitment deepens. Marriage energy is strong.',
      career: 'Career advances through partnerships. Creative and diplomatic skills valued. Law and art prosper.',
      health: 'Health improves through balance. Address kidney and skin care. Harmonious lifestyle brings wellness.',
      finance: 'Financial success through partnerships. Art investments grow. Legal matters resolve favorably.',
      dos: ['Commit to partnerships', 'Create beauty', 'Seek justice', 'Maintain balance'],
      donts: ['Avoid codependency', "Don't neglect your own needs", 'Refrain from indecision'],
    },
    yearly: {
      overall: 'This year brings profound partnership blessings and artistic achievement for Libra. Balance in all areas leads to lasting success.',
      love: 'Love life transforms through committed partnership. Marriage strongly favored. Deep harmony achieved.',
      career: 'Career flourishes through partnerships and diplomacy. Law, art, and design bring success.',
      health: 'Year emphasizes achieving lasting balance. Kidney and hormonal health improve.',
      finance: 'Financial prosperity through partnerships. Art and beauty investments grow significantly.',
      dos: ['Build lasting partnerships', 'Create enduring beauty', 'Champion justice', 'Achieve true balance'],
      donts: ['Avoid losing yourself in others', "Don't fear commitment", 'Refrain from superficial peace'],
    },
  },

  Scorpio: {
    daily: {
      overall: 'Mars and Pluto intensify your power today, Scorpio. The Bhrigu Samhita indicates deep transformation and hidden blessings. Your intensity leads to profound insights.',
      love: 'Deep emotional connections form. Intensity in romance. Secrets may surface, leading to deeper understanding.',
      career: 'Research and investigation excel. Hidden opportunities reveal themselves. Power dynamics favor you.',
      health: 'Regenerative energy is strong. Detoxification benefits. Address reproductive health.',
      finance: 'Hidden resources emerge. Investments in transformation succeed. Joint finances prosper.',
      dos: ['Embrace transformation', 'Investigate deeply', 'Trust your intuition', 'Release what no longer serves'],
      donts: ['Avoid manipulation', "Don't hold grudges", 'Refrain from obsession'],
    },
    weekly: {
      overall: 'This week brings powerful transformation for Scorpio. Deep insights and hidden opportunities emerge. Your intensity serves your growth.',
      love: 'Relationships deepen through emotional honesty. Trust builds. Intimate connections strengthen.',
      career: 'Professional power increases. Research and investigation succeed. Influence grows.',
      health: 'Regenerative practices benefit. Detox and renewal emphasized. Emotional healing advances.',
      finance: 'Hidden financial opportunities emerge. Joint ventures succeed. Transformation investments prosper.',
      dos: ['Transform what needs changing', 'Deepen connections', 'Research thoroughly', 'Release the past'],
      donts: ['Avoid power struggles', "Don't suppress emotions", 'Refrain from secretive behavior'],
    },
    monthly: {
      overall: 'This month brings profound transformation and empowerment for Scorpio. Hidden depths reveal treasures. Your power grows.',
      love: 'Love transforms through depth and honesty. Intimate connections reach new levels. Trust deepens.',
      career: 'Career transforms powerfully. Influence and position strengthen. Research brings breakthroughs.',
      health: 'Health regenerates through transformative practices. Emotional healing brings physical wellness.',
      finance: 'Financial transformation occurs. Inheritance or joint finances prosper. Investments in change succeed.',
      dos: ['Embrace deep transformation', 'Build lasting power', 'Heal emotional wounds', 'Invest in change'],
      donts: ['Avoid destructive tendencies', "Don't manipulate others", 'Refrain from vengeance'],
    },
    yearly: {
      overall: 'This year brings rebirth and profound empowerment for Scorpio. Like the phoenix, you rise transformed and more powerful than before.',
      love: 'Love life transforms completely. Deep soul connections form. Intensity brings lasting bonds.',
      career: 'Career undergoes powerful transformation. Position and influence strengthen significantly.',
      health: 'Year brings regeneration and healing. Transform health habits. Emotional healing completes.',
      finance: 'Financial transformation brings wealth. Inheritance possible. Investments in transformation multiply.',
      dos: ['Rise from the ashes', 'Claim your power', 'Heal completely', 'Transform your life'],
      donts: ['Avoid destruction without purpose', "Don't cling to old patterns", 'Refrain from dark paths'],
    },
  },

  Sagittarius: {
    daily: {
      overall: 'Jupiter expands your horizons today, Sagittarius. The Bhrigu Samhita indicates blessings through wisdom and adventure. Your optimism attracts good fortune.',
      love: 'Romance has an adventurous quality. Shared beliefs strengthen bonds. Freedom and growth in relationships.',
      career: 'Educational and travel opportunities arise. Teaching and publishing succeed. International connections prosper.',
      health: 'Physical activity brings joy. Outdoor adventures benefit. Watch liver and hip health.',
      finance: 'Financial expansion through knowledge. International investments succeed. Generous giving returns multiplied.',
      dos: ['Seek adventure', 'Expand your knowledge', 'Share your wisdom', 'Maintain optimism'],
      donts: ['Avoid overconfidence', "Don't make promises you can't keep", 'Refrain from excess'],
    },
    weekly: {
      overall: 'This week brings expansion and adventure for Sagittarius. Jupiter opens doors to growth. Your enthusiasm inspires others.',
      love: 'Romantic adventures unfold. Shared beliefs and adventures strengthen bonds. Freedom in love brings joy.',
      career: 'Professional expansion through education. Travel and international connections succeed.',
      health: 'Active adventures benefit health. Outdoor activities bring vitality. Balance enthusiasm with rest.',
      finance: 'Financial growth through expansion. Educational investments succeed. International opportunities prosper.',
      dos: ['Explore new horizons', 'Learn and teach', 'Travel and connect', 'Stay optimistic'],
      donts: ['Avoid overextension', "Don't preach excessively", 'Refrain from carelessness'],
    },
    monthly: {
      overall: 'This month brings significant expansion and wisdom for Sagittarius. Adventures and education lead to growth. Fortune favors the bold.',
      love: 'Love life expands through shared adventures. International romance possible. Wisdom deepens bonds.',
      career: 'Career expands through knowledge and travel. Publishing and teaching succeed. International recognition.',
      health: 'Health improves through active lifestyle. Outdoor adventures bring vitality. Address liver health.',
      finance: 'Financial expansion continues. Educational and international investments prosper. Generosity returns multiplied.',
      dos: ['Expand your world', 'Share your wisdom', 'Adventure boldly', 'Invest in education'],
      donts: ['Avoid scattered energy', "Don't neglect details", 'Refrain from overconfidence'],
    },
    yearly: {
      overall: 'This year brings magnificent expansion and wisdom for Sagittarius. Your quest for meaning leads to profound achievements and adventures.',
      love: 'Love life transforms through shared adventures and beliefs. International connections. Marriage brings growth.',
      career: 'Career expands internationally. Publishing, teaching, and philosophy succeed. Recognition for wisdom.',
      health: 'Year emphasizes active, adventurous lifestyle. Travel brings renewal. Maintain liver health.',
      finance: 'Financial fortune expands significantly. International and educational investments prosper greatly.',
      dos: ['Quest for meaning', 'Explore the world', 'Share wisdom widely', 'Embrace abundance'],
      donts: ['Avoid overextension', "Don't neglect responsibilities", 'Refrain from excess'],
    },
  },

  Capricorn: {
    daily: {
      overall: 'Saturn provides structure and discipline today, Capricorn. The Bhrigu Samhita indicates rewards through patient effort. Your ambition is supported by cosmic timing.',
      love: 'Committed, mature love is favored. Show love through reliability. Patience in relationships pays off.',
      career: 'Professional ambition is supported. Structured approaches succeed. Authority figures take notice.',
      health: 'Bone and joint health emphasized. Structured exercise benefits. Discipline in health routines pays off.',
      finance: 'Conservative financial approaches succeed. Long-term investments favored. Build foundations patiently.',
      dos: ['Work with discipline', 'Plan long-term', 'Build structures', 'Exercise patience'],
      donts: ['Avoid excessive rigidity', "Don't neglect emotions", 'Refrain from workaholism'],
    },
    weekly: {
      overall: 'This week rewards disciplined effort for Capricorn. Saturn supports structured progress. Patience leads to achievement.',
      love: 'Relationships mature through commitment. Patience and stability valued. Long-term bonds strengthen.',
      career: 'Professional advancement through discipline. Authority and responsibility increase. Recognition comes.',
      health: 'Structured health routines benefit. Address bone and joint care. Discipline brings wellness.',
      finance: 'Financial foundations strengthen. Conservative investments succeed. Long-term planning pays off.',
      dos: ['Build systematically', 'Accept responsibility', 'Plan for the future', 'Work persistently'],
      donts: ['Avoid pessimism', "Don't overwork", 'Refrain from emotional suppression'],
    },
    monthly: {
      overall: 'This month brings significant achievements through discipline for Capricorn. Your structured approach leads to lasting success.',
      love: 'Love life matures into committed partnership. Stability in relationships. Long-term bonds formalize.',
      career: 'Career advances through steady effort. Promotions and increased responsibility. Recognition for hard work.',
      health: 'Health improves through disciplined routines. Address bone and joint health. Consistent effort pays off.',
      finance: 'Financial security builds significantly. Long-term investments mature. Career advancement brings income growth.',
      dos: ['Build lasting structures', 'Accept leadership roles', 'Invest for the future', 'Maintain discipline'],
      donts: ['Avoid excessive caution', "Don't neglect rest", 'Refrain from emotional coldness'],
    },
    yearly: {
      overall: 'This year brings the fruition of long-term efforts for Capricorn. Saturn rewards your patience and discipline with significant achievements.',
      love: 'Love life reaches mature stability. Marriage and long-term commitment favored. Security in partnerships.',
      career: 'Career reaches peak achievements. Leadership positions and recognition. Legacy building succeeds.',
      health: 'Year emphasizes bone health and longevity. Disciplined lifestyle brings lasting wellness.',
      finance: 'Financial mastery achieved. Long-term investments mature significantly. Wealth through persistent effort.',
      dos: ['Achieve lasting success', 'Build your legacy', 'Master your field', 'Plan for generations'],
      donts: ['Avoid becoming too rigid', "Don't sacrifice happiness for success", 'Refrain from isolation'],
    },
  },

  Aquarius: {
    daily: {
      overall: 'Uranus sparks innovation today, Aquarius. The Bhrigu Samhita indicates breakthroughs through unique thinking. Your vision for the future guides present actions.',
      love: 'Unconventional romance appeals. Freedom within relationships. Intellectual connection is key.',
      career: 'Innovation and technology succeed. Humanitarian projects prosper. Unique approaches valued.',
      health: 'Nervous system needs attention. Technology-aided wellness helps. Maintain circulation health.',
      finance: 'Unconventional investments may succeed. Technology and innovation investments favored.',
      dos: ['Innovate boldly', 'Think ahead', 'Connect with community', 'Embrace uniqueness'],
      donts: ['Avoid emotional detachment', "Don't rebel without cause", 'Refrain from stubbornness'],
    },
    weekly: {
      overall: 'This week brings innovation and community connection for Aquarius. Uranus supports unique approaches. Your vision inspires others.',
      love: 'Relationships benefit from freedom and friendship. Intellectual connection deepens. Unique partnerships form.',
      career: 'Professional innovation succeeds. Technology and humanitarian work prosper. Team efforts excel.',
      health: 'Nervous system and circulation need attention. Innovative health approaches help. Community support aids wellness.',
      finance: 'Financial innovation brings opportunities. Technology investments succeed. Humanitarian work has financial potential.',
      dos: ['Lead innovation', 'Build community', 'Think differently', 'Support humanitarian causes'],
      donts: ['Avoid emotional coldness', "Don't be contrarian without purpose", 'Refrain from isolation'],
    },
    monthly: {
      overall: 'This month brings breakthroughs and community achievements for Aquarius. Your innovative vision leads to significant progress.',
      love: 'Love life flourishes through friendship and freedom. Unconventional relationships succeed. Intellectual bonds deepen.',
      career: 'Career advances through innovation. Technology and humanitarian fields prosper. Leadership in change.',
      health: 'Health improves through innovative approaches. Address nervous system and circulation. Community support helps.',
      finance: 'Financial breakthroughs through innovation. Technology investments grow. Humanitarian work brings unexpected rewards.',
      dos: ['Create the future', 'Build strong communities', 'Innovate solutions', 'Champion causes'],
      donts: ['Avoid detachment', "Don't alienate through rebellion", 'Refrain from impractical idealism'],
    },
    yearly: {
      overall: 'This year brings revolutionary change and achievement for Aquarius. Your vision for the future manifests in significant ways.',
      love: 'Love life transforms through freedom and friendship. Unconventional partnerships thrive. Intellectual companionship deepens.',
      career: 'Career revolutionizes through innovation. Technology leadership. Humanitarian impact grows.',
      health: 'Year emphasizes nervous system and circulatory health. Innovative wellness approaches succeed.',
      finance: 'Financial revolution through innovation. Technology investments bring significant returns. Humanitarian success has financial rewards.',
      dos: ['Lead the revolution', 'Build the future', 'Unite communities', 'Innovate fearlessly'],
      donts: ['Avoid emotional isolation', "Don't reject all tradition", 'Refrain from impractical idealism'],
    },
  },

  Pisces: {
    daily: {
      overall: 'Neptune enhances your intuition today, Pisces. The Bhrigu Samhita indicates spiritual blessings and creative inspiration. Your compassion touches hearts.',
      love: 'Romantic idealism is high. Spiritual connections deepen. Compassionate love flows naturally.',
      career: 'Creative and spiritual work prospers. Intuition guides professional decisions. Helping professions succeed.',
      health: 'Feet and lymphatic system need attention. Water-based healing benefits. Spiritual practices enhance wellness.',
      finance: 'Intuitive financial decisions succeed. Charitable giving brings returns. Creative work has financial potential.',
      dos: ['Follow your intuition', 'Create from the soul', 'Practice compassion', 'Connect spiritually'],
      donts: ['Avoid escapism', "Don't lose boundaries", 'Refrain from victim mentality'],
    },
    weekly: {
      overall: 'This week brings spiritual growth and creative inspiration for Pisces. Neptune guides you toward your dreams. Compassion opens doors.',
      love: 'Romantic idealism guides relationships. Spiritual connections deepen. Compassion strengthens bonds.',
      career: 'Creative and intuitive work succeeds. Spiritual or healing professions prosper. Artistic expression valued.',
      health: 'Spiritual practices enhance physical health. Water therapies benefit. Address feet and immune health.',
      finance: 'Intuitive financial approaches succeed. Creative work brings income. Charitable giving returns multiplied.',
      dos: ['Follow dreams', 'Create beauty', 'Heal others', 'Trust intuition'],
      donts: ['Avoid losing yourself', "Don't ignore practical matters", 'Refrain from addiction'],
    },
    monthly: {
      overall: 'This month brings spiritual fulfillment and creative achievement for Pisces. Your intuition guides you toward meaningful success.',
      love: 'Love life reaches spiritual depths. Soul connections form. Compassionate love transforms relationships.',
      career: 'Career flourishes through creativity and intuition. Healing and artistic professions prosper.',
      health: 'Health improves through spiritual practices. Water therapies bring renewal. Immune system strengthens.',
      finance: 'Financial growth through creative and intuitive means. Spiritual work has material rewards.',
      dos: ['Manifest your dreams', 'Heal with compassion', 'Create from spirit', 'Trust the unseen'],
      donts: ['Avoid escapism', "Don't neglect boundaries", 'Refrain from self-sacrifice'],
    },
    yearly: {
      overall: 'This year brings profound spiritual evolution and creative fulfillment for Pisces. Your dreams manifest in beautiful ways.',
      love: 'Love life transforms through spiritual connection. Divine love manifests in relationships. Soul mate connections.',
      career: 'Career transcends through creativity and spirituality. Healing arts and artistic expression bring success.',
      health: 'Year emphasizes spiritual and immune health. Water therapies and meditation bring profound healing.',
      finance: 'Financial abundance through creative and spiritual channels. Charitable giving multiplies returns.',
      dos: ['Live your dreams', 'Serve with compassion', 'Create masterpieces', 'Transcend limitations'],
      donts: ['Avoid losing yourself', "Don't escape reality", 'Refrain from martyrdom'],
    },
  },
};

/**
 * Get wisdom for a specific zodiac sign and timeframe
 */
export function getBhriguWisdom(
  zodiacSign: string,
  timeframe: PredictionTimeframe
): ZodiacWisdom {
  const signWisdom = BHRIGU_WISDOM[zodiacSign];
  if (signWisdom && signWisdom[timeframe]) {
    return signWisdom[timeframe];
  }

  // Fallback to Aries if sign not found
  return BHRIGU_WISDOM.Aries![timeframe];
}

/**
 * Get zodiac-specific lucky number based on ruling planet
 */
export function getZodiacLuckyNumber(sign: string): number {
  const numbers: Record<string, number> = {
    Aries: 9,
    Taurus: 6,
    Gemini: 5,
    Cancer: 2,
    Leo: 1,
    Virgo: 5,
    Libra: 6,
    Scorpio: 9,
    Sagittarius: 3,
    Capricorn: 8,
    Aquarius: 4,
    Pisces: 7,
  };
  return numbers[sign] || 7;
}

/**
 * Get zodiac-specific lucky color
 */
export function getZodiacLuckyColor(sign: string): string {
  const colors: Record<string, string> = {
    Aries: 'Ruby Red',
    Taurus: 'Emerald Green',
    Gemini: 'Golden Yellow',
    Cancer: 'Silver White',
    Leo: 'Royal Gold',
    Virgo: 'Forest Green',
    Libra: 'Rose Pink',
    Scorpio: 'Deep Crimson',
    Sagittarius: 'Royal Purple',
    Capricorn: 'Midnight Blue',
    Aquarius: 'Electric Blue',
    Pisces: 'Sea Green',
  };
  return colors[sign] || 'Electric Blue';
}

/**
 * Get zodiac-specific auspicious direction
 */
export function getZodiacDirection(sign: string): string {
  const directions: Record<string, string> = {
    Aries: 'East',
    Taurus: 'South',
    Gemini: 'West',
    Cancer: 'North',
    Leo: 'East',
    Virgo: 'South',
    Libra: 'West',
    Scorpio: 'North',
    Sagittarius: 'Northeast',
    Capricorn: 'Southwest',
    Aquarius: 'Northwest',
    Pisces: 'Southeast',
  };
  return directions[sign] || 'East';
}

/**
 * Get zodiac emoji
 */
export function getZodiacEmoji(sign: string): string {
  const emojis: Record<string, string> = {
    Aries: '♈',
    Taurus: '♉',
    Gemini: '♊',
    Cancer: '♋',
    Leo: '♌',
    Virgo: '♍',
    Libra: '♎',
    Scorpio: '♏',
    Sagittarius: '♐',
    Capricorn: '♑',
    Aquarius: '♒',
    Pisces: '♓',
  };
  return emojis[sign] || '⭐';
}

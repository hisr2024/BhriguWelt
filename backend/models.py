"""
Database Models for BhriguWelt
Handles caching and storage of predictions and user data
"""
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import json
from utils.logger import setup_logger

logger = setup_logger(__name__)

db = SQLAlchemy()

class BhriguPredictionCache(db.Model):
    """
    Caches Bhrigu Samhita and Nadi Jyotisa predictions to build knowledge base
    """
    __tablename__ = 'bhrigu_prediction_cache'

    id = db.Column(db.Integer, primary_key=True)

    # User birth data (anonymized hash for privacy)
    birth_data_hash = db.Column(db.String(64), index=True, nullable=False)

    # Prediction category
    category = db.Column(db.String(50), index=True, nullable=False)
    # Categories: karmic_journey, past_lives, future_lives, present_life,
    #            life_events, karmic_remedies, relationships, predictions

    # Question asked (if any)
    question = db.Column(db.Text, nullable=True)

    # Full prediction response from AI
    prediction_data = db.Column(db.Text, nullable=False)
    # Synthesized analysis stored separately to avoid overwriting full_analysis
    complete_analysis = db.Column(db.Text, nullable=True)

    # Metadata
    zodiac_sign = db.Column(db.String(20), index=True)
    nakshatra = db.Column(db.String(30), index=True)
    moon_sign = db.Column(db.String(20))
    ascendant = db.Column(db.String(20))

    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    accessed_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    access_count = db.Column(db.Integer, default=1)

    # Quality indicators
    ai_model = db.Column(db.String(50))  # gpt-4, etc.
    confidence_score = db.Column(db.Float, default=0.0)
    user_rating = db.Column(db.Integer)  # 1-5 stars if user rates

    HASH_VERSION_CURRENT = 'v3'
    HASH_VERSION_FALLBACKS = ('v2',)

    def __repr__(self):
        return f'<BhriguPredictionCache {self.id}: {self.category} - {self.zodiac_sign}>'

    def to_dict(self):
        """Convert to dictionary"""
        try:
            prediction_dict = json.loads(self.prediction_data)
        except (json.JSONDecodeError, TypeError) as e:
            logger.warning(f"Failed to parse prediction_data as JSON: {e}")
            prediction_dict = {'raw': self.prediction_data}

        cache_age_seconds = None
        if self.created_at:
            cache_age_seconds = int((datetime.utcnow() - self.created_at).total_seconds())

        return {
            'id': self.id,
            'category': self.category,
            'question': self.question,
            'prediction': prediction_dict,
            'zodiac_sign': self.zodiac_sign,
            'nakshatra': self.nakshatra,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'cache_age': cache_age_seconds,
            'cache_key': f"{self.birth_data_hash}:{self.category}:{self.question or ''}",
            'access_count': self.access_count
        }

    @classmethod
    def create_hash(cls, birth_data: dict, category: str = None, question: str = None,
                    version: str = None) -> str:
        """Create anonymized hash of birth data"""
        import hashlib
        # Use only astrological data, not PII
        version = version or cls.HASH_VERSION_CURRENT
        base_parts = [
            birth_data.get('date_of_birth'),
            birth_data.get('time_of_birth'),
            birth_data.get('latitude'),
            birth_data.get('longitude')
        ]
        category_value = category or birth_data.get('category')
        optional_parts = [
            category_value,
            birth_data.get('place_of_birth'),
            birth_data.get('timezone')
        ]
        if version == cls.HASH_VERSION_CURRENT:
            optional_parts.insert(1, question)
        data_parts = [part for part in base_parts if part not in (None, '')]
        data_parts.extend(part for part in optional_parts if part not in (None, ''))
        data_parts.append(version)
        data_str = "_".join(str(part) for part in data_parts)
        return hashlib.sha256(data_str.encode()).hexdigest()

    @classmethod
    def cache_prediction(cls, birth_data: dict, category: str, prediction: dict,
                        question: str = None, metadata: dict = None):
        """Cache a new prediction"""
        try:
            prediction_payload = dict(prediction)
            complete_analysis = prediction_payload.pop('complete_analysis', None)
            cache_entry = cls(
                birth_data_hash=cls.create_hash(birth_data, category, question),
                category=category,
                question=question,
                prediction_data=json.dumps(prediction_payload),
                complete_analysis=complete_analysis,
                zodiac_sign=metadata.get('zodiac_sign') if metadata else None,
                nakshatra=metadata.get('nakshatra') if metadata else None,
                moon_sign=metadata.get('moon_sign') if metadata else None,
                ascendant=metadata.get('ascendant') if metadata else None,
                ai_model=metadata.get('ai_model', 'gpt-4') if metadata else 'gpt-4'
            )
            db.session.add(cache_entry)
            db.session.commit()
            return cache_entry
        except Exception as e:
            db.session.rollback()
            logger.error(f"Failed to cache prediction: {e}")
            return None

    @classmethod
    def get_cached_prediction(cls, birth_data: dict, category: str, question: str = None):
        """Retrieve cached prediction if available"""
        cached = None
        versions = (cls.HASH_VERSION_CURRENT, *cls.HASH_VERSION_FALLBACKS)
        for version in versions:
            birth_hash = cls.create_hash(birth_data, category, question, version=version)
            query = cls.query.filter_by(birth_data_hash=birth_hash, category=category)

            if question:
                query = query.filter_by(question=question)

            cached = query.order_by(cls.created_at.desc()).first()
            if cached:
                break

        if cached:
            try:
                # Update access metadata
                cached.accessed_at = datetime.utcnow()
                cached.access_count += 1
                db.session.commit()
            except Exception as e:
                db.session.rollback()
                logger.warning(f"Failed to update cache access metadata: {e}")

        return cached

    @classmethod
    def get_similar_predictions(cls, category: str, zodiac_sign: str = None,
                               nakshatra: str = None, limit: int = 10):
        """Get similar predictions for building wisdom database"""
        query = cls.query.filter_by(category=category)

        if zodiac_sign:
            query = query.filter_by(zodiac_sign=zodiac_sign)
        if nakshatra:
            query = query.filter_by(nakshatra=nakshatra)

        return query.order_by(cls.access_count.desc(), cls.created_at.desc()).limit(limit).all()


class BhriguWisdomEntry(db.Model):
    """
    Stores curated Bhrigu Samhita and Nadi Jyotisa wisdom
    This database expands over time as more predictions are made
    """
    __tablename__ = 'bhrigu_wisdom'

    id = db.Column(db.Integer, primary_key=True)

    # Wisdom categorization
    category = db.Column(db.String(50), index=True, nullable=False)
    subcategory = db.Column(db.String(50), index=True)

    # Astrological indicators
    zodiac_sign = db.Column(db.String(20), index=True)
    nakshatra = db.Column(db.String(30), index=True)
    planetary_position = db.Column(db.String(100))  # e.g., "Saturn in 7th house"

    # Wisdom content
    title = db.Column(db.String(200), nullable=False)
    content = db.Column(db.Text, nullable=False)

    # Source attribution
    source = db.Column(db.String(100))  # Bhrigu Samhita, Nadi Jyotisa, etc.
    confidence_level = db.Column(db.String(20))  # high, medium, low

    # Metadata
    tags = db.Column(db.Text)  # JSON array of tags
    language = db.Column(db.String(10), default='en')

    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Usage statistics
    access_count = db.Column(db.Integer, default=0)
    helpful_count = db.Column(db.Integer, default=0)  # User feedback

    def __repr__(self):
        return f'<BhriguWisdom {self.id}: {self.title}>'

    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': self.id,
            'category': self.category,
            'subcategory': self.subcategory,
            'zodiac_sign': self.zodiac_sign,
            'nakshatra': self.nakshatra,
            'title': self.title,
            'content': self.content,
            'source': self.source,
            'confidence_level': self.confidence_level,
            'tags': json.loads(self.tags) if self.tags else [],
            'access_count': self.access_count
        }

    @classmethod
    def get_wisdom_for_context(cls, category: str, zodiac_sign: str = None,
                               nakshatra: str = None, limit: int = 5):
        """Get relevant wisdom entries for a given context"""
        query = cls.query.filter_by(category=category)

        if zodiac_sign:
            query = query.filter(
                (cls.zodiac_sign == zodiac_sign) | (cls.zodiac_sign == None)
            )
        if nakshatra:
            query = query.filter(
                (cls.nakshatra == nakshatra) | (cls.nakshatra == None)
            )

        wisdom_entries = query.order_by(
            cls.confidence_level.desc(),
            cls.helpful_count.desc(),
            cls.access_count.desc()
        ).limit(limit).all()

        try:
            # Update access counts
            for entry in wisdom_entries:
                entry.access_count += 1
            db.session.commit()
        except Exception as e:
            db.session.rollback()
            logger.warning(f"Failed to update wisdom access counts: {e}")

        return wisdom_entries


class BhriguSessionLog(db.Model):
    """
    Logs user sessions and questions for analytics and improvement
    """
    __tablename__ = 'bhrigu_session_log'

    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.String(64), index=True, nullable=False)

    # User context (anonymized)
    user_hash = db.Column(db.String(64), index=True)

    # Session details
    categories_accessed = db.Column(db.Text)  # JSON array
    questions_asked = db.Column(db.Integer, default=0)
    predictions_generated = db.Column(db.Integer, default=0)

    # Performance metrics
    avg_response_time = db.Column(db.Float)
    cache_hit_rate = db.Column(db.Float)

    # Timestamps
    session_start = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    session_end = db.Column(db.DateTime)
    duration_minutes = db.Column(db.Integer)

    def __repr__(self):
        return f'<BhriguSession {self.session_id}>'


def init_db(app):
    """Initialize database with app context"""
    db.init_app(app)
    with app.app_context():
        db.create_all()
        logger.info("✓ Database tables created successfully")


def seed_initial_wisdom():
    """Seed database with comprehensive Bhrigu Samhita and Nadi Jyotisha wisdom"""
    initial_wisdom = [
        # Karmic Journey - Soul Purpose & Evolution (20+ principles)
        {
            'category': 'karmic_journey',
            'title': 'Soul Purpose Indicators in Birth Chart',
            'content': 'The position of the North Node (Rahu) indicates the soul\'s primary mission in this lifetime, while the South Node (Ketu) reveals past life mastery and karmic baggage. Study their house placements and aspects to understand your dharmic path.',
            'source': 'Bhrigu Samhita',
            'confidence_level': 'high',
            'tags': json.dumps(['soul purpose', 'rahu', 'ketu', 'karmic nodes', 'dharma'])
        },
        {
            'category': 'karmic_journey',
            'title': 'Atmakaraka - Soul Significator Planet',
            'content': 'The planet with the highest degree in your chart is the Atmakaraka, representing your soul\'s deepest desire. Its placement shows the primary area of soul growth in this lifetime.',
            'source': 'Jaimini Astrology',
            'confidence_level': 'high',
            'tags': json.dumps(['atmakaraka', 'soul', 'jaimini', 'spiritual growth'])
        },
        {
            'category': 'karmic_journey',
            'title': '12th House Lord and Past Life Connection',
            'content': 'The 12th house lord shows past life connections and karmic losses. Its placement reveals what you must release from previous incarnations to progress spiritually.',
            'source': 'Bhrigu Samhita',
            'confidence_level': 'high',
            'tags': json.dumps(['12th house', 'past life', 'moksha', 'release'])
        },
        {
            'category': 'karmic_journey',
            'title': '5th and 9th House Axis - Purva Punya',
            'content': 'The 5th house represents past life good deeds (Purva Punya) while 9th house shows dharma. Strong benefics here indicate accumulated spiritual merit from previous births.',
            'source': 'Bhrigu Samhita',
            'confidence_level': 'high',
            'tags': json.dumps(['purva punya', '5th house', '9th house', 'dharma', 'merit'])
        },

        # Past Lives - Karmic Patterns (15+ principles)
        {
            'category': 'past_lives',
            'title': 'Ketu Position and Past Life Professions',
            'content': 'Ketu in different houses indicates past life professions: 1st house - spiritual leaders, 2nd house - wealthy merchants, 3rd house - warriors/soldiers, 4th house - landowners, 5th house - scholars/teachers, 6th house - healers/servants, 7th house - diplomats, 8th house - mystics, 9th house - priests, 10th house - kings/administrators, 11th house - philanthropists, 12th house - monks/renunciates.',
            'source': 'Nadi Jyotisa',
            'confidence_level': 'high',
            'tags': json.dumps(['ketu', 'past lives', 'professions', 'houses'])
        },
        {
            'category': 'past_lives',
            'title': 'Saturn Retrograde - Unfinished Karmic Business',
            'content': 'Retrograde Saturn indicates unfinished karmic responsibilities from past lives. The house it occupies shows where you must complete pending duties with discipline and patience.',
            'source': 'Bhrigu Samhita',
            'confidence_level': 'high',
            'tags': json.dumps(['saturn', 'retrograde', 'karma', 'responsibility'])
        },
        {
            'category': 'past_lives',
            'title': 'Rahu-Ketu Axis and Soul Lessons',
            'content': 'The Rahu-Ketu axis shows the evolutionary journey of the soul. Ketu house represents mastered skills from past lives, while Rahu house shows new territory for growth in this lifetime.',
            'source': 'Nadi Jyotisa',
            'confidence_level': 'high',
            'tags': json.dumps(['rahu', 'ketu', 'axis', 'evolution', 'soul lessons'])
        },

        # Future Lives - Soul Evolution (12+ principles)
        {
            'category': 'future_lives',
            'title': 'Evolution Path Based on Current Karma',
            'content': 'Strong Jupiter and well-placed Saturn indicate progressive soul evolution with 3-7 incarnations remaining. Afflicted Rahu suggests 12-20 more incarnations needed for spiritual lessons. Exalted Ketu with Jupiter aspect indicates potential for moksha in this or next life.',
            'source': 'Bhrigu Samhita',
            'confidence_level': 'medium',
            'tags': json.dumps(['jupiter', 'saturn', 'rahu', 'evolution', 'moksha'])
        },
        {
            'category': 'future_lives',
            'title': 'Moksha Indicators in Birth Chart',
            'content': 'Strong 12th house with benefic influences, Ketu in spiritual signs (Pisces, Sagittarius), Jupiter-Ketu conjunction, and multiple planets in moksha houses (4th, 8th, 12th) indicate potential for liberation in this lifetime or next.',
            'source': 'Bhrigu Samhita',
            'confidence_level': 'high',
            'tags': json.dumps(['moksha', 'liberation', '12th house', 'spiritual signs'])
        },

        # Present Life - Current Incarnation (18+ principles)
        {
            'category': 'present_life',
            'title': 'Ascendant Lord Placement - Life Direction',
            'content': 'The ascendant lord\'s placement shows your primary life focus. In 1st: self-development, 2nd: wealth, 3rd: communication, 4th: home/mother, 5th: creativity/children, 6th: service, 7th: partnerships, 8th: transformation, 9th: dharma, 10th: career, 11th: gains, 12th: spirituality.',
            'source': 'Bhrigu Samhita',
            'confidence_level': 'high',
            'tags': json.dumps(['ascendant lord', 'life direction', 'houses'])
        },
        {
            'category': 'present_life',
            'title': 'Sun-Moon Yoga - Mind-Soul Integration',
            'content': 'The relationship between Sun (soul) and Moon (mind) reveals inner harmony. Favorable aspects bring emotional stability and self-confidence. Challenging aspects require conscious work to integrate mind and purpose.',
            'source': 'Bhrigu Samhita',
            'confidence_level': 'high',
            'tags': json.dumps(['sun', 'moon', 'yoga', 'integration', 'harmony'])
        },

        # Life Events - Timing Predictions (20+ principles)
        {
            'category': 'life_events',
            'title': 'Major Life Transitions in Dasha Periods',
            'content': 'Jupiter Mahadasha (16 years) brings expansion, learning, and spiritual growth. Saturn Mahadasha (19 years) brings discipline, challenges, and karmic lessons. Rahu Mahadasha (18 years) brings unexpected changes, material desires, and worldly ambition. Ketu Mahadasha (7 years) brings spiritual insights, detachment, and liberation tendencies.',
            'source': 'Nadi Jyotisa',
            'confidence_level': 'high',
            'tags': json.dumps(['dasha', 'jupiter', 'saturn', 'rahu', 'ketu', 'transitions'])
        },
        {
            'category': 'life_events',
            'title': 'Marriage Timing from 7th House and Venus',
            'content': 'Marriage typically occurs during Venus Mahadasha/Antardasha, or when Jupiter transits 7th house. Age ranges: 7th lord in angles (21-24), in trines (24-27), in 6th/8th/12th (27-32). Early marriage if Venus/7th lord strong in youth.',
            'source': 'Bhrigu Samhita',
            'confidence_level': 'high',
            'tags': json.dumps(['marriage', 'timing', '7th house', 'venus', 'jupiter transit'])
        },
        {
            'category': 'life_events',
            'title': 'Career Breakthrough Timing',
            'content': 'Major career advancement occurs during 10th lord Mahadasha, Sun or Saturn Mahadasha, or when Jupiter transits 10th house from Moon. Ages 28-32 (Saturn return) and 36-42 are critical periods for professional establishment.',
            'source': 'Bhrigu Samhita',
            'confidence_level': 'high',
            'tags': json.dumps(['career', 'timing', '10th house', 'saturn', 'breakthrough'])
        },

        # Karmic Remedies - Upayas (25+ principles)
        {
            'category': 'karmic_remedies',
            'title': 'Planetary Remedies from Bhrigu Tradition',
            'content': 'Saturn afflictions: Offer mustard oil at Hanuman temple on Saturdays, donate black items to needy. Mars afflictions: Donate red lentils on Tuesdays, recite Hanuman Chalisa. Mercury afflictions: Feed green vegetables to cows on Wednesdays, donate books. Jupiter afflictions: Feed yellow sweets to priests on Thursdays, worship Lord Vishnu. Venus afflictions: Donate white items on Fridays, offer flowers to Goddess Lakshmi.',
            'source': 'Bhrigu Samhita',
            'confidence_level': 'high',
            'tags': json.dumps(['remedies', 'saturn', 'mars', 'mercury', 'jupiter', 'venus', 'donations'])
        },
        {
            'category': 'karmic_remedies',
            'title': 'Navagraha Mantra Chanting - Frequency and Benefits',
            'content': 'Sun: "Om Suryaya Namaha" 7000 times removes ego, brings vitality. Moon: "Om Chandraya Namaha" 11000 times brings emotional balance. Mars: "Om Mangalaya Namaha" 10000 times reduces anger. Mercury: "Om Budhaya Namaha" 9000 times enhances intellect. Jupiter: "Om Gurave Namaha" 19000 times brings wisdom. Venus: "Om Shukraya Namaha" 16000 times attracts prosperity. Saturn: "Om Shanaye Namaha" 23000 times reduces suffering. Rahu: "Om Rahave Namaha" 18000 times resolves confusion. Ketu: "Om Ketave Namaha" 7000 times brings spiritual insight.',
            'source': 'Nadi Jyotisa',
            'confidence_level': 'high',
            'tags': json.dumps(['mantras', 'navagraha', 'chanting', 'planetary remedies'])
        },
        {
            'category': 'karmic_remedies',
            'title': 'Gemstone Therapy - Wearing Rules',
            'content': 'Ruby (Sun): Wear in gold on ring finger, Sunday sunrise, 3-5 carats. Pearl (Moon): Silver ring, ring finger, Monday, 4-6 carats. Red Coral (Mars): Copper/gold, ring finger, Tuesday, 5-8 carats. Emerald (Mercury): Gold, little finger, Wednesday, 3-5 carats. Yellow Sapphire (Jupiter): Gold, index finger, Thursday, 3-5 carats. Diamond (Venus): Silver/platinum, middle/ring finger, Friday, 1-2 carats. Blue Sapphire (Saturn): Silver/iron, middle finger, Saturday, 4-6 carats (test first!). Hessonite (Rahu): Silver, middle finger, Saturday, 5-8 carats. Cat\'s Eye (Ketu): Silver, ring finger, Wednesday/Thursday, 3-5 carats.',
            'source': 'Bhrigu Samhita',
            'confidence_level': 'high',
            'tags': json.dumps(['gemstones', 'ratna', 'therapy', 'wearing rules', 'planets'])
        },

        # Relationships - Soul Connections (16+ principles)
        {
            'category': 'relationships',
            'title': 'Venus-Mars Synastry - Romantic Compatibility',
            'content': 'In relationship comparison, Venus (love nature) and Mars (passion drive) interaction is crucial. Harmonious aspects (trine, sextile) create magnetic attraction and sexual compatibility. Challenging aspects (square, opposition) bring passion but require conscious effort for harmony.',
            'source': 'Bhrigu Samhita',
            'confidence_level': 'high',
            'tags': json.dumps(['venus', 'mars', 'synastry', 'compatibility', 'romance'])
        },
        {
            'category': 'relationships',
            'title': 'Moon Sign Compatibility - Emotional Bonding',
            'content': 'Moon signs reveal emotional compatibility. Same element Moons (Fire-Fire, Earth-Earth, Air-Air, Water-Water) understand each other naturally. Complementary elements (Fire-Air, Earth-Water) create balance. Challenging elements require adjustment but offer growth.',
            'source': 'Nadi Jyotisa',
            'confidence_level': 'high',
            'tags': json.dumps(['moon sign', 'compatibility', 'emotions', 'elements'])
        },
        {
            'category': 'relationships',
            'title': 'Nadi Dosha - Genetic Incompatibility',
            'content': 'In Ashtakoot matching, Nadi dosha occurs when both partners have same Nadi (Vata, Pitta, Kapha). This indicates genetic incompatibility and health issues in children. Can be cancelled by strong Rashi or Graha Maitri, or by performing specific remedies.',
            'source': 'Nadi Jyotisa',
            'confidence_level': 'high',
            'tags': json.dumps(['nadi dosha', 'compatibility', 'ashtakoot', 'marriage'])
        },

        # Predictions - Daily/Weekly/Monthly (10+ principles)
        {
            'category': 'predictions',
            'title': 'Panchang - Daily Muhurta Selection',
            'content': 'For important activities, choose auspicious tithis: Dwitiya, Tritiya, Panchami, Saptami, Dashami, Ekadashi, Trayodashi are favorable. Avoid Chaturthi, Navami, Chaturdashi (except for Shiva worship). Check nakshatra compatibility with your janma nakshatra using tara bala system.',
            'source': 'Muhurta Shastra',
            'confidence_level': 'high',
            'tags': json.dumps(['panchang', 'muhurta', 'tithi', 'nakshatra', 'timing'])
        },
        {
            'category': 'predictions',
            'title': 'Transits - Jupiter and Saturn Impact',
            'content': 'Jupiter transits: 12 years cycle, stays 1 year per sign. Favorable in 2nd, 5th, 7th, 9th, 11th from Moon. Saturn transits: 30 years cycle, 2.5 years per sign. Sade Sati occurs when Saturn transits 12th, 1st, 2nd from Moon (7.5 years total). Requires patience and remedies.',
            'source': 'Bhrigu Samhita',
            'confidence_level': 'high',
            'tags': json.dumps(['transits', 'jupiter', 'saturn', 'sade sati', 'predictions'])
        },

        # Additional comprehensive wisdom entries
        {
            'category': 'karmic_journey',
            'title': 'Moksha Houses - 4th, 8th, 12th Triad',
            'content': 'Houses 4th (inner peace), 8th (transformation), and 12th (liberation) form the moksha trikona. Strong benefic presence here with spiritual planet aspects indicates a soul-focused incarnation with potential for enlightenment.',
            'source': 'Bhrigu Samhita',
            'confidence_level': 'high',
            'tags': json.dumps(['moksha', '4th house', '8th house', '12th house', 'trikona'])
        },
        {
            'category': 'life_events',
            'title': 'Children Timing from 5th House',
            'content': 'First child typically arrives during Jupiter\'s transit to 5th house from ascendant or Moon, or during 5th lord Mahadasha. Favorable ages: Early 20s if 5th lord strong, mid-late 20s if moderate, early 30s if afflicted (with remedies).',
            'source': 'Bhrigu Samhita',
            'confidence_level': 'high',
            'tags': json.dumps(['children', 'timing', '5th house', 'jupiter', 'progeny'])
        },
        {
            'category': 'karmic_remedies',
            'title': 'Rudraksha Therapy by Mukhi',
            'content': 'Each Rudraksha mukhi serves specific purpose: 1-mukhi (Shiva, moksha), 2-mukhi (harmony), 3-mukhi (karma cleansing), 4-mukhi (knowledge), 5-mukhi (general protection), 6-mukhi (wisdom), 7-mukhi (wealth), 8-mukhi (Ganesha, obstacles removal), 9-mukhi (Durga, protection), 10-mukhi (Vishnu, success), 11-mukhi (judgment), 12-mukhi (leadership), 13-mukhi (attraction), 14-mukhi (intuition). Wear according to your planetary afflictions.',
            'source': 'Tantra Shastra',
            'confidence_level': 'high',
            'tags': json.dumps(['rudraksha', 'therapy', 'mukhi', 'spiritual tools'])
        }
    ]

    try:
        for wisdom_data in initial_wisdom:
            existing = BhriguWisdomEntry.query.filter_by(title=wisdom_data['title']).first()
            if not existing:
                wisdom = BhriguWisdomEntry(**wisdom_data)
                db.session.add(wisdom)

        db.session.commit()
        logger.info("✓ Seeded %s initial wisdom entries", len(initial_wisdom))
    except Exception as e:
        db.session.rollback()
        logger.error(f"Failed to seed initial wisdom: {e}")

"""
Database Models for BhriguWelt
Handles caching and storage of predictions and user data
"""
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import json

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

    def __repr__(self):
        return f'<BhriguPredictionCache {self.id}: {self.category} - {self.zodiac_sign}>'

    def to_dict(self):
        """Convert to dictionary"""
        try:
            prediction_dict = json.loads(self.prediction_data)
        except:
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

    @staticmethod
    def create_hash(birth_data: dict) -> str:
        """Create anonymized hash of birth data"""
        import hashlib
        # Use only astrological data, not PII
        data_str = f"{birth_data.get('date_of_birth')}_{birth_data.get('time_of_birth')}_{birth_data.get('latitude')}_{birth_data.get('longitude')}"
        return hashlib.sha256(data_str.encode()).hexdigest()

    @classmethod
    def cache_prediction(cls, birth_data: dict, category: str, prediction: dict,
                        question: str = None, metadata: dict = None):
        """Cache a new prediction"""
        cache_entry = cls(
            birth_data_hash=cls.create_hash(birth_data),
            category=category,
            question=question,
            prediction_data=json.dumps(prediction),
            zodiac_sign=metadata.get('zodiac_sign') if metadata else None,
            nakshatra=metadata.get('nakshatra') if metadata else None,
            moon_sign=metadata.get('moon_sign') if metadata else None,
            ascendant=metadata.get('ascendant') if metadata else None,
            ai_model=metadata.get('ai_model', 'gpt-4') if metadata else 'gpt-4'
        )
        db.session.add(cache_entry)
        db.session.commit()
        return cache_entry

    @classmethod
    def get_cached_prediction(cls, birth_data: dict, category: str, question: str = None):
        """Retrieve cached prediction if available"""
        birth_hash = cls.create_hash(birth_data)
        query = cls.query.filter_by(birth_data_hash=birth_hash, category=category)

        if question:
            query = query.filter_by(question=question)

        cached = query.order_by(cls.created_at.desc()).first()

        if cached:
            # Update access metadata
            cached.accessed_at = datetime.utcnow()
            cached.access_count += 1
            db.session.commit()

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

        # Update access counts
        for entry in wisdom_entries:
            entry.access_count += 1
        db.session.commit()

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
        print("✓ Database tables created successfully")


def seed_initial_wisdom():
    """Seed database with initial Bhrigu Samhita wisdom"""
    initial_wisdom = [
        {
            'category': 'karmic_journey',
            'title': 'Soul Purpose Indicators in Birth Chart',
            'content': 'The position of the North Node (Rahu) indicates the soul\'s primary mission in this lifetime, while the South Node (Ketu) reveals past life mastery and karmic baggage.',
            'source': 'Bhrigu Samhita',
            'confidence_level': 'high',
            'tags': json.dumps(['soul purpose', 'rahu', 'ketu', 'karmic nodes'])
        },
        {
            'category': 'past_lives',
            'title': 'Ketu Position and Past Life Professions',
            'content': 'Ketu in different houses indicates past life professions: 1st house - spiritual leaders, 2nd house - wealthy merchants, 3rd house - warriors/soldiers, 4th house - landowners, 5th house - scholars/teachers.',
            'source': 'Nadi Jyotisa',
            'confidence_level': 'high',
            'tags': json.dumps(['ketu', 'past lives', 'professions', 'houses'])
        },
        {
            'category': 'future_lives',
            'title': 'Evolution Path Based on Current Karma',
            'content': 'Strong Jupiter and well-placed Saturn indicate progressive soul evolution. Afflicted Rahu suggests more incarnations needed for spiritual lessons.',
            'source': 'Bhrigu Samhita',
            'confidence_level': 'medium',
            'tags': json.dumps(['jupiter', 'saturn', 'rahu', 'evolution'])
        },
        {
            'category': 'karmic_remedies',
            'title': 'Planetary Remedies from Bhrigu Tradition',
            'content': 'Saturn afflictions: Offer mustard oil on Saturdays. Mars afflictions: Donate red lentils on Tuesdays. Mercury afflictions: Feed green vegetables to cows on Wednesdays.',
            'source': 'Bhrigu Samhita',
            'confidence_level': 'high',
            'tags': json.dumps(['remedies', 'saturn', 'mars', 'mercury', 'donations'])
        },
        {
            'category': 'life_events',
            'title': 'Major Life Transitions in Dasha Periods',
            'content': 'Jupiter Mahadasha brings expansion, learning, and spiritual growth. Saturn Mahadasha brings discipline, challenges, and karmic lessons. Rahu Mahadasha brings unexpected changes and material desires.',
            'source': 'Nadi Jyotisa',
            'confidence_level': 'high',
            'tags': json.dumps(['dasha', 'jupiter', 'saturn', 'rahu', 'transitions'])
        }
    ]

    for wisdom_data in initial_wisdom:
        existing = BhriguWisdomEntry.query.filter_by(title=wisdom_data['title']).first()
        if not existing:
            wisdom = BhriguWisdomEntry(**wisdom_data)
            db.session.add(wisdom)

    db.session.commit()
    print(f"✓ Seeded {len(initial_wisdom)} initial wisdom entries")

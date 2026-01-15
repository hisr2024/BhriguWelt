"""
Detailed Predictions API Routes

Provides endpoints for generating comprehensive birth chart interpretations
using the Vedic RAG Engine and terminology validation.

Author: BhriguWelt Team
Version: 2.0.0
"""

from flask import Blueprint, request, jsonify
from functools import wraps
import logging
from typing import Dict, Any, Optional

from services.vedic_rag_engine import VedicRAGEngine, create_vedic_rag_engine
from services.vedic_terminology_validator import (
    VedicTerminologyValidator,
    validate_prediction,
    format_validation_report
)

logger = logging.getLogger(__name__)

# Create blueprint
detailed_predictions_bp = Blueprint('detailed_predictions', __name__)


def validate_request_data(required_fields: list):
    """Decorator to validate request data"""
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            if not request.is_json:
                return jsonify({'error': 'Content-Type must be application/json'}), 400

            data = request.get_json()
            missing_fields = [field for field in required_fields if field not in data]

            if missing_fields:
                return jsonify({
                    'error': 'Missing required fields',
                    'missing': missing_fields
                }), 400

            return f(*args, **kwargs)
        return wrapper
    return decorator


@detailed_predictions_bp.route('/api/predictions/generate', methods=['POST'])
@validate_request_data(['chart_data', 'query'])
def generate_detailed_prediction():
    """
    Generate detailed prediction using Vedic RAG Engine

    Request Body:
    {
        "chart_data": {
            "sun": {"sign": "Leo", "house": 5, "degree": 15.5},
            "moon": {"sign": "Taurus", "house": 2, "degree": 22.3},
            "ascendant": {"sign": "Aries", "degree": 10.2},
            "planets": [...],
            ...
        },
        "query": "Sun in Leo interpretation",
        "category": "personality",  // optional
        "mode": "corpus_only",  // optional: corpus_only, ai_enhanced, hybrid
        "min_words": 300,  // optional
        "max_words": 500,  // optional
        "validate_terminology": true  // optional
    }

    Response:
    {
        "interpretation": "...",
        "confidence": 0.95,
        "sources": ["Bhrigu Samhita", "Nadi Jyotisha"],
        "citations": [...],
        "mode": "corpus_only",
        "word_count": 425,
        "validation": {...}  // if validate_terminology=true
    }
    """
    try:
        data = request.get_json()

        chart_data = data['chart_data']
        query = data['query']
        category = data.get('category')
        mode = data.get('mode', 'corpus_only')
        min_words = data.get('min_words', 300)
        max_words = data.get('max_words', 500)
        validate_terminology = data.get('validate_terminology', False)

        logger.info(f"Generating prediction for query: {query}, mode: {mode}")

        # Create RAG engine
        rag_engine = create_vedic_rag_engine(mode=mode)

        # Generate prediction
        result = rag_engine.generate_prediction(
            chart_data=chart_data,
            query=query,
            category=category,
            min_words=min_words,
            max_words=max_words
        )

        # Build response
        response = {
            'interpretation': result.interpretation,
            'confidence': result.confidence,
            'sources': result.sources,
            'citations': result.citations,
            'mode': result.mode,
            'word_count': result.word_count,
            'generated_at': result.generated_at.isoformat(),
            'passages_used': len(result.passages)
        }

        # Validate terminology if requested
        if validate_terminology:
            validation_result = validate_prediction(
                result.interpretation,
                require_citations=True,
                min_authenticity=0.75
            )

            response['validation'] = {
                'is_valid': validation_result.is_valid,
                'score': validation_result.score,
                'authenticity_percentage': validation_result.authenticity_percentage,
                'vedic_term_count': validation_result.vedic_term_count,
                'total_term_count': validation_result.total_term_count,
                'issues_count': len(validation_result.issues),
                'suggestions': validation_result.suggestions
            }

            if not validation_result.is_valid:
                logger.warning(f"Terminology validation failed with score: {validation_result.score}")

        return jsonify(response), 200

    except KeyError as e:
        logger.error(f"Missing required field: {e}")
        return jsonify({'error': f'Missing required field: {str(e)}'}), 400
    except Exception as e:
        logger.error(f"Error generating prediction: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500


@detailed_predictions_bp.route('/api/predictions/comprehensive', methods=['POST'])
@validate_request_data(['birth_data', 'chart_data'])
def generate_comprehensive_analysis():
    """
    Generate comprehensive birth chart analysis (2000+ words)

    Request Body:
    {
        "birth_data": {
            "name": "John Doe",
            "date_of_birth": "1990-01-15",
            "time_of_birth": "14:30",
            "place_of_birth": "New York, USA"
        },
        "chart_data": {...},
        "sections": ["overview", "personality", "career", "health", "relationships", "spiritual"],
        "mode": "corpus_only",
        "validate_terminology": true
    }

    Response:
    {
        "overview": {...},
        "personality": {...},
        "career": {...},
        "health": {...},
        "relationships": {...},
        "spiritual": {...},
        "total_word_count": 2345,
        "overall_confidence": 0.92,
        "all_sources": [...],
        "generated_at": "2024-01-15T10:30:00Z"
    }
    """
    try:
        data = request.get_json()

        birth_data = data['birth_data']
        chart_data = data['chart_data']
        requested_sections = data.get('sections', [
            'overview', 'personality', 'career', 'health', 'relationships', 'spiritual'
        ])
        mode = data.get('mode', 'corpus_only')
        validate_terminology = data.get('validate_terminology', False)

        logger.info(f"Generating comprehensive analysis for {birth_data.get('name', 'Unknown')}")

        # Create RAG engine
        rag_engine = create_vedic_rag_engine(mode=mode)

        # Section queries
        section_queries = {
            'overview': f"Comprehensive birth chart overview for {birth_data.get('name')}",
            'personality': f"Personality analysis based on {chart_data.get('ascendant', {}).get('sign', 'unknown')} ascendant",
            'career': f"Career and professional path with {chart_data.get('sun', {}).get('sign', 'unknown')} Sun",
            'health': f"Health and vitality analysis",
            'relationships': f"Relationships and partnership karma",
            'spiritual': f"Spiritual path and moksha indicators"
        }

        # Generate each section
        results = {}
        all_sources = set()
        total_words = 0
        confidence_scores = []

        for section in requested_sections:
            if section not in section_queries:
                continue

            logger.info(f"Generating {section} section...")

            result = rag_engine.generate_prediction(
                chart_data=chart_data,
                query=section_queries[section],
                category=section,
                min_words=300,
                max_words=500
            )

            # Validate if requested
            validation_info = None
            if validate_terminology:
                validation_result = validate_prediction(
                    result.interpretation,
                    require_citations=True,
                    min_authenticity=0.75
                )
                validation_info = {
                    'is_valid': validation_result.is_valid,
                    'score': validation_result.score,
                    'authenticity_percentage': validation_result.authenticity_percentage
                }

            results[section] = {
                'title': section.replace('_', ' ').title(),
                'content': result.interpretation,
                'word_count': result.word_count,
                'confidence': result.confidence,
                'sources': result.sources,
                'citations': result.citations[:2],  # Limit to 2 per section
                'validation': validation_info
            }

            all_sources.update(result.sources)
            total_words += result.word_count
            confidence_scores.append(result.confidence)

        # Calculate overall metrics
        overall_confidence = sum(confidence_scores) / len(confidence_scores) if confidence_scores else 0

        response = {
            **results,
            'total_word_count': total_words,
            'overall_confidence': overall_confidence,
            'all_sources': list(all_sources),
            'mode': mode,
            'generated_at': result.generated_at.isoformat(),
            'birth_data': {
                'name': birth_data.get('name'),
                'date_of_birth': birth_data.get('date_of_birth'),
                'time_of_birth': birth_data.get('time_of_birth'),
                'place_of_birth': birth_data.get('place_of_birth')
            }
        }

        return jsonify(response), 200

    except KeyError as e:
        logger.error(f"Missing required field: {e}")
        return jsonify({'error': f'Missing required field: {str(e)}'}), 400
    except Exception as e:
        logger.error(f"Error generating comprehensive analysis: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500


@detailed_predictions_bp.route('/api/predictions/validate', methods=['POST'])
@validate_request_data(['text'])
def validate_terminology():
    """
    Validate Vedic terminology in text

    Request Body:
    {
        "text": "Your prediction text here...",
        "require_citations": true,
        "min_authenticity": 0.75,
        "strict_mode": false
    }

    Response:
    {
        "is_valid": true,
        "score": 0.92,
        "authenticity_percentage": 92.5,
        "vedic_term_count": 45,
        "total_term_count": 50,
        "issues": [...],
        "suggestions": [...],
        "report": "..." // formatted text report
    }
    """
    try:
        data = request.get_json()

        text = data['text']
        require_citations = data.get('require_citations', True)
        min_authenticity = data.get('min_authenticity', 0.75)
        strict_mode = data.get('strict_mode', False)

        logger.info(f"Validating terminology for {len(text)} characters of text")

        # Create validator
        validator = VedicTerminologyValidator(
            require_citations=require_citations,
            min_authenticity=min_authenticity,
            strict_mode=strict_mode
        )

        # Validate
        result = validator.validate(text)

        # Format response
        response = {
            'is_valid': result.is_valid,
            'score': result.score,
            'authenticity_percentage': result.authenticity_percentage,
            'vedic_term_count': result.vedic_term_count,
            'total_term_count': result.total_term_count,
            'issues': [
                {
                    'term': issue.term,
                    'type': issue.type.value,
                    'line_number': issue.line_number,
                    'context': issue.context,
                    'suggestion': issue.suggestion,
                    'severity': issue.severity
                }
                for issue in result.issues
            ],
            'suggestions': result.suggestions,
            'report': format_validation_report(result)
        }

        return jsonify(response), 200

    except KeyError as e:
        logger.error(f"Missing required field: {e}")
        return jsonify({'error': f'Missing required field: {str(e)}'}), 400
    except Exception as e:
        logger.error(f"Error validating terminology: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500


@detailed_predictions_bp.route('/api/predictions/search-corpus', methods=['POST'])
@validate_request_data(['query'])
def search_corpus():
    """
    Search Vedic corpus for relevant passages

    Request Body:
    {
        "query": "Sun in Leo",
        "category": "personality",  // optional
        "top_k": 5,  // optional
        "min_confidence": 0.7  // optional
    }

    Response:
    {
        "passages": [
            {
                "source": "Bhrigu Samhita",
                "folio": "12",
                "content": "...",
                "keywords": [...],
                "category": "personality",
                "confidence": 0.95,
                "relevance_score": 0.88
            },
            ...
        ],
        "query": "Sun in Leo",
        "results_count": 5
    }
    """
    try:
        data = request.get_json()

        query = data['query']
        category = data.get('category')
        top_k = data.get('top_k', 5)
        min_confidence = data.get('min_confidence', 0.7)

        logger.info(f"Searching corpus for: {query}")

        # Create RAG engine
        rag_engine = VedicRAGEngine(min_confidence=min_confidence)

        # Search
        passages = rag_engine.semantic_search(query, category=category, top_k=top_k)

        # Format response
        response = {
            'passages': [
                {
                    'source': p.source,
                    'folio': p.folio,
                    'content': p.content,
                    'keywords': p.keywords,
                    'category': p.category,
                    'confidence': p.confidence,
                    'relevance_score': p.relevance_score
                }
                for p in passages
            ],
            'query': query,
            'category': category,
            'results_count': len(passages)
        }

        return jsonify(response), 200

    except KeyError as e:
        logger.error(f"Missing required field: {e}")
        return jsonify({'error': f'Missing required field: {str(e)}'}), 400
    except Exception as e:
        logger.error(f"Error searching corpus: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500


@detailed_predictions_bp.route('/api/predictions/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'detailed_predictions',
        'version': '2.0.0'
    }), 200


# Error handlers
@detailed_predictions_bp.errorhandler(400)
def bad_request(error):
    return jsonify({'error': 'Bad request', 'message': str(error)}), 400


@detailed_predictions_bp.errorhandler(500)
def internal_error(error):
    logger.error(f"Internal server error: {error}", exc_info=True)
    return jsonify({'error': 'Internal server error', 'message': str(error)}), 500

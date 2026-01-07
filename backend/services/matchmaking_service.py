"""
Kundali Matchmaking Service
Implements Ashtakoot (8-fold) Guna Milan system for marriage compatibility
"""
import logging
from typing import Dict, Any, List, Tuple, Optional
from datetime import datetime

from services.astrology_calculator import AstrologyCalculator
from services.openai_service import get_openai_service
from services.bhrigu_offline_wisdom import get_bhrigu_offline_wisdom

logger = logging.getLogger(__name__)


class MatchmakingService:
    """
    Comprehensive Kundali Matching Service
    Implements traditional Ashtakoot system with AI-enhanced insights
    """
    
    def __init__(self):
        self.astrology_calculator = AstrologyCalculator()
        self.openai_service = get_openai_service()
        self.offline_wisdom = get_bhrigu_offline_wisdom()
        
    def calculate_compatibility(self, 
                               person1_data: Dict[str, Any],
                               person2_data: Dict[str, Any],
                               mode: str = 'hybrid') -> Dict[str, Any]:
        """
        Calculate comprehensive compatibility between two individuals
        
        Args:
            person1_data: Birth details for person 1
            person2_data: Birth details for person 2
            mode: 'online', 'offline', or 'hybrid'
            
        Returns:
            Detailed compatibility analysis with scores and insights
        """
        try:
            # Calculate birth charts for both individuals
            chart1 = self.astrology_calculator.calculate_birth_chart(
                date_of_birth=person1_data['date_of_birth'],
                time_of_birth=person1_data['time_of_birth'],
                place=person1_data['place_of_birth']
            )
            
            chart2 = self.astrology_calculator.calculate_birth_chart(
                date_of_birth=person2_data['date_of_birth'],
                time_of_birth=person2_data['time_of_birth'],
                place=person2_data['place_of_birth']
            )
            
            # Calculate Ashtakoot scores
            ashtakoot_scores = self._calculate_ashtakoot(chart1, chart2)
            
            # Check doshas
            doshas = self._check_doshas(chart1, chart2)
            
            # Calculate overall compatibility percentage
            total_score = ashtakoot_scores['total_score']
            max_score = ashtakoot_scores['max_score']
            compatibility_percentage = (total_score / max_score) * 100
            
            # Get AI-enhanced insights if online/hybrid mode
            ai_insights = None
            if mode in ['online', 'hybrid']:
                try:
                    ai_insights = self._get_ai_insights(chart1, chart2, ashtakoot_scores, doshas)
                except Exception as e:
                    logger.warning(f"AI insights failed: {e}")
                    if mode == 'online':
                        raise
            
            # Get offline wisdom if not online-only
            offline_insights = None
            if mode in ['offline', 'hybrid'] or (mode == 'online' and not ai_insights):
                offline_insights = self._get_offline_insights(chart1, chart2, ashtakoot_scores, doshas)
            
            return {
                'status': 'success',
                'compatibility_percentage': round(compatibility_percentage, 1),
                'ashtakoot_scores': ashtakoot_scores,
                'doshas': doshas,
                'recommendation': self._get_recommendation(total_score, doshas),
                'person1': {
                    'name': person1_data.get('name', 'Person 1'),
                    'zodiac_sign': chart1['zodiac_sign'],
                    'moon_sign': chart1['moon_sign'],
                    'nakshatra': chart1['nakshatra']
                },
                'person2': {
                    'name': person2_data.get('name', 'Person 2'),
                    'zodiac_sign': chart2['zodiac_sign'],
                    'moon_sign': chart2['moon_sign'],
                    'nakshatra': chart2['nakshatra']
                },
                'ai_insights': ai_insights or offline_insights,
                'mode': mode
            }
            
        except Exception as e:
            logger.error(f"Matchmaking calculation failed: {e}")
            raise
    
    def _calculate_ashtakoot(self, chart1: Dict, chart2: Dict) -> Dict[str, Any]:
        """
        Calculate Ashtakoot (8-fold) Guna Milan scores
        
        The 8 Kutas (factors) with maximum points:
        1. Varna (1 point) - Spiritual compatibility
        2. Vashya (2 points) - Dominance/control
        3. Tara (3 points) - Birth star compatibility
        4. Yoni (4 points) - Sexual compatibility
        5. Graha Maitri (5 points) - Planetary friendship
        6. Gana (6 points) - Temperament matching
        7. Bhakoot (7 points) - Relative moon sign position
        8. Nadi (8 points) - Health and genes
        Total: 36 points
        """
        
        # Get moon signs and nakshatras
        moon_sign1 = chart1['moon_sign']
        moon_sign2 = chart2['moon_sign']
        nakshatra1 = chart1['nakshatra']
        nakshatra2 = chart2['nakshatra']
        
        # Calculate individual Kuta scores
        varna_score = self._calculate_varna(chart1, chart2)
        vashya_score = self._calculate_vashya(moon_sign1, moon_sign2)
        tara_score = self._calculate_tara(nakshatra1, nakshatra2)
        yoni_score = self._calculate_yoni(nakshatra1, nakshatra2)
        graha_maitri_score = self._calculate_graha_maitri(moon_sign1, moon_sign2, chart1, chart2)
        gana_score = self._calculate_gana(nakshatra1, nakshatra2)
        bhakoot_score = self._calculate_bhakoot(moon_sign1, moon_sign2)
        nadi_score = self._calculate_nadi(nakshatra1, nakshatra2)
        
        total_score = (varna_score + vashya_score + tara_score + yoni_score + 
                      graha_maitri_score + gana_score + bhakoot_score + nadi_score)
        
        return {
            'varna': {'score': varna_score, 'max': 1, 'description': 'Spiritual compatibility'},
            'vashya': {'score': vashya_score, 'max': 2, 'description': 'Dominance and control'},
            'tara': {'score': tara_score, 'max': 3, 'description': 'Birth star compatibility'},
            'yoni': {'score': yoni_score, 'max': 4, 'description': 'Sexual compatibility'},
            'graha_maitri': {'score': graha_maitri_score, 'max': 5, 'description': 'Planetary friendship'},
            'gana': {'score': gana_score, 'max': 6, 'description': 'Temperament matching'},
            'bhakoot': {'score': bhakoot_score, 'max': 7, 'description': 'Moon sign harmony'},
            'nadi': {'score': nadi_score, 'max': 8, 'description': 'Health and progeny'},
            'total_score': total_score,
            'max_score': 36
        }
    
    def _calculate_varna(self, chart1: Dict, chart2: Dict) -> int:
        """Varna Kuta - Spiritual compatibility (1 point)"""
        varna_order = {
            'Brahmin': 4,  # Pisces, Cancer, Scorpio
            'Kshatriya': 3,  # Aries, Leo, Sagittarius
            'Vaishya': 2,  # Taurus, Virgo, Capricorn
            'Shudra': 1  # Gemini, Libra, Aquarius
        }
        
        # Map zodiac to varna
        varna_map = {
            'Aries': 'Kshatriya', 'Leo': 'Kshatriya', 'Sagittarius': 'Kshatriya',
            'Taurus': 'Vaishya', 'Virgo': 'Vaishya', 'Capricorn': 'Vaishya',
            'Gemini': 'Shudra', 'Libra': 'Shudra', 'Aquarius': 'Shudra',
            'Pisces': 'Brahmin', 'Cancer': 'Brahmin', 'Scorpio': 'Brahmin'
        }
        
        varna1 = varna_map.get(chart1['zodiac_sign'], 'Vaishya')
        varna2 = varna_map.get(chart2['zodiac_sign'], 'Vaishya')
        
        # Groom's varna should be equal or higher
        if varna_order[varna1] >= varna_order[varna2]:
            return 1
        return 0
    
    def _calculate_vashya(self, moon_sign1: str, moon_sign2: str) -> int:
        """Vashya Kuta - Mutual attraction and control (2 points)"""
        vashya_groups = {
            'Chatushpada': ['Aries', 'Taurus', 'Sagittarius', 'first half of Capricorn'],
            'Dwipada': ['Gemini', 'Virgo', 'Libra', 'Aquarius'],
            'Jalchara': ['Cancer', 'Pisces', 'second half of Capricorn'],
            'Kita': ['Scorpio'],
            'Vanachara': ['Leo']
        }
        
        # Simplified: Check if both are in same group or compatible groups
        if moon_sign1 == moon_sign2:
            return 2
        
        # Check mutual compatibility
        compatible_pairs = [
            ('Aries', 'Leo'), ('Aries', 'Sagittarius'),
            ('Taurus', 'Cancer'), ('Taurus', 'Libra'),
            ('Gemini', 'Aquarius'), ('Cancer', 'Scorpio'), ('Cancer', 'Pisces'),
            ('Leo', 'Sagittarius'), ('Virgo', 'Pisces'), ('Libra', 'Capricorn'),
            ('Scorpio', 'Pisces'), ('Sagittarius', 'Pisces')
        ]
        
        if ((moon_sign1, moon_sign2) in compatible_pairs or 
            (moon_sign2, moon_sign1) in compatible_pairs):
            return 2
        
        return 1
    
    def _calculate_tara(self, nakshatra1: str, nakshatra2: str) -> int:
        """Tara Kuta - Birth star compatibility (3 points)"""
        # Simplified calculation based on nakshatra count difference
        nakshatras = [
            'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra',
            'Punarvasu', 'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni', 'Uttara Phalguni',
            'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha',
            'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishta', 'Shatabhisha',
            'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati'
        ]
        
        try:
            idx1 = nakshatras.index(nakshatra1)
            idx2 = nakshatras.index(nakshatra2)
            
            # Calculate tara position
            diff = (idx2 - idx1) % 27
            tara_position = (diff % 9) + 1
            
            # Favorable taras: 1, 3, 5, 7 - return integer scores
            if tara_position in [1, 3, 5, 7]:
                return 3
            elif tara_position in [2, 4, 6]:
                return 2  # Changed from 1.5 to integer
            else:
                return 0
        except ValueError:
            return 2  # Default neutral score (changed from 1.5)
    
    def _calculate_yoni(self, nakshatra1: str, nakshatra2: str) -> int:
        """Yoni Kuta - Physical and sexual compatibility (4 points)"""
        # Simplified yoni mapping
        yoni_map = {
            'Ashwini': 'Horse', 'Bharani': 'Elephant', 'Krittika': 'Sheep',
            'Rohini': 'Serpent', 'Mrigashira': 'Serpent', 'Ardra': 'Dog',
            'Punarvasu': 'Cat', 'Pushya': 'Goat', 'Ashlesha': 'Cat',
            'Magha': 'Rat', 'Purva Phalguni': 'Rat', 'Uttara Phalguni': 'Cow',
            'Hasta': 'Buffalo', 'Chitra': 'Tiger', 'Swati': 'Buffalo',
            'Vishakha': 'Tiger', 'Anuradha': 'Deer', 'Jyeshtha': 'Deer',
            'Mula': 'Dog', 'Purva Ashadha': 'Monkey', 'Uttara Ashadha': 'Mongoose',
            'Shravana': 'Monkey', 'Dhanishta': 'Lion', 'Shatabhisha': 'Horse',
            'Purva Bhadrapada': 'Lion', 'Uttara Bhadrapada': 'Cow', 'Revati': 'Elephant'
        }
        
        yoni1 = yoni_map.get(nakshatra1, 'Unknown')
        yoni2 = yoni_map.get(nakshatra2, 'Unknown')
        
        if yoni1 == yoni2:
            return 4
        
        # Check friendly yonis
        friendly_yonis = [
            ('Horse', 'Mare'), ('Elephant', 'Elephant'), ('Sheep', 'Monkey'),
            ('Serpent', 'Serpent'), ('Dog', 'Deer'), ('Cat', 'Rat'),
            ('Cow', 'Buffalo'), ('Tiger', 'Horse')
        ]
        
        if ((yoni1, yoni2) in friendly_yonis or (yoni2, yoni1) in friendly_yonis):
            return 3
        
        # Check enemy yonis
        enemy_yonis = [
            ('Horse', 'Buffalo'), ('Elephant', 'Lion'), ('Sheep', 'Tiger'),
            ('Serpent', 'Mongoose'), ('Dog', 'Deer'), ('Cat', 'Dog'),
            ('Rat', 'Cat'), ('Tiger', 'Cow')
        ]
        
        if ((yoni1, yoni2) in enemy_yonis or (yoni2, yoni1) in enemy_yonis):
            return 0
        
        return 2  # Neutral
    
    def _calculate_graha_maitri(self, moon_sign1: str, moon_sign2: str, 
                               chart1: Dict, chart2: Dict) -> int:
        """Graha Maitri Kuta - Planetary friendship (5 points)"""
        # Simplified: Check moon sign lords' friendship
        sign_lords = {
            'Aries': 'Mars', 'Taurus': 'Venus', 'Gemini': 'Mercury',
            'Cancer': 'Moon', 'Leo': 'Sun', 'Virgo': 'Mercury',
            'Libra': 'Venus', 'Scorpio': 'Mars', 'Sagittarius': 'Jupiter',
            'Capricorn': 'Saturn', 'Aquarius': 'Saturn', 'Pisces': 'Jupiter'
        }
        
        lord1 = sign_lords.get(moon_sign1)
        lord2 = sign_lords.get(moon_sign2)
        
        # Planetary friendship table
        friends = {
            'Sun': ['Moon', 'Mars', 'Jupiter'],
            'Moon': ['Sun', 'Mercury'],
            'Mars': ['Sun', 'Moon', 'Jupiter'],
            'Mercury': ['Sun', 'Venus'],
            'Jupiter': ['Sun', 'Moon', 'Mars'],
            'Venus': ['Mercury', 'Saturn'],
            'Saturn': ['Mercury', 'Venus']
        }
        
        if lord1 == lord2:
            return 5
        elif lord2 in friends.get(lord1, []) and lord1 in friends.get(lord2, []):
            return 5
        elif lord2 in friends.get(lord1, []) or lord1 in friends.get(lord2, []):
            return 3
        else:
            return 0
    
    def _calculate_gana(self, nakshatra1: str, nakshatra2: str) -> int:
        """Gana Kuta - Temperament compatibility (6 points)"""
        gana_map = {
            'Deva': ['Ashwini', 'Mrigashira', 'Punarvasu', 'Pushya', 'Hasta', 
                     'Swati', 'Anuradha', 'Shravana', 'Revati'],
            'Manushya': ['Bharani', 'Rohini', 'Ardra', 'Purva Phalguni', 
                        'Uttara Phalguni', 'Purva Ashadha', 'Uttara Ashadha', 
                        'Purva Bhadrapada', 'Uttara Bhadrapada'],
            'Rakshasa': ['Krittika', 'Ashlesha', 'Magha', 'Chitra', 'Vishakha', 
                        'Jyeshtha', 'Mula', 'Dhanishta', 'Shatabhisha']
        }
        
        gana1 = None
        gana2 = None
        
        for gana, nakshatras in gana_map.items():
            if nakshatra1 in nakshatras:
                gana1 = gana
            if nakshatra2 in nakshatras:
                gana2 = gana
        
        if gana1 == gana2:
            return 6
        elif (gana1 == 'Deva' and gana2 == 'Manushya') or \
             (gana1 == 'Manushya' and gana2 == 'Deva'):
            return 5
        elif (gana1 == 'Manushya' and gana2 == 'Rakshasa') or \
             (gana1 == 'Rakshasa' and gana2 == 'Manushya'):
            return 1
        else:  # Deva-Rakshasa
            return 0
    
    def _calculate_bhakoot(self, moon_sign1: str, moon_sign2: str) -> int:
        """Bhakoot Kuta - Relative moon sign position (7 points)"""
        signs = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
                'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces']
        
        try:
            idx1 = signs.index(moon_sign1)
            idx2 = signs.index(moon_sign2)
            
            diff = abs(idx2 - idx1)
            
            # Inauspicious positions: 2-12, 6-8, 5-9
            if diff in [1, 5, 7]:
                return 0
            else:
                return 7
        except ValueError:
            return 3  # Default neutral
    
    def _calculate_nadi(self, nakshatra1: str, nakshatra2: str) -> int:
        """Nadi Kuta - Health and progeny (8 points)"""
        nadi_map = {
            'Aadi': ['Ashwini', 'Ardra', 'Punarvasu', 'Uttara Phalguni', 
                    'Hasta', 'Jyeshtha', 'Mula', 'Shatabhisha', 'Purva Bhadrapada'],
            'Madhya': ['Bharani', 'Mrigashira', 'Pushya', 'Purva Phalguni',
                      'Chitra', 'Anuradha', 'Purva Ashadha', 'Dhanishta', 
                      'Uttara Bhadrapada'],
            'Antya': ['Krittika', 'Rohini', 'Ashlesha', 'Magha', 'Swati',
                     'Vishakha', 'Uttara Ashadha', 'Shravana', 'Revati']
        }
        
        nadi1 = None
        nadi2 = None
        
        for nadi, nakshatras in nadi_map.items():
            if nakshatra1 in nakshatras:
                nadi1 = nadi
            if nakshatra2 in nakshatras:
                nadi2 = nadi
        
        # Same nadi is inauspicious for progeny
        if nadi1 == nadi2:
            return 0
        else:
            return 8
    
    def _check_doshas(self, chart1: Dict, chart2: Dict) -> Dict[str, Any]:
        """Check for various doshas affecting marriage"""
        
        # Mangal Dosha (Mars in 1, 2, 4, 7, 8, 12 houses)
        mars_house1 = self._get_planet_house(chart1, 'Mars')
        mars_house2 = self._get_planet_house(chart2, 'Mars')
        
        mangal_houses = [1, 2, 4, 7, 8, 12]
        mangal_dosha1 = mars_house1 in mangal_houses
        mangal_dosha2 = mars_house2 in mangal_houses
        
        # Both having Mangal Dosha cancels it
        mangal_dosha_present = mangal_dosha1 != mangal_dosha2
        
        # Nadi Dosha (already checked in nadi kuta)
        # If both have same nadi, it's a dosha
        
        return {
            'mangal_dosha': {
                'present': mangal_dosha_present,
                'person1': mangal_dosha1,
                'person2': mangal_dosha2,
                'severity': 'high' if mangal_dosha_present else 'none',
                'cancellation': mangal_dosha1 and mangal_dosha2,
                'description': 'Mars in malefic houses can cause issues in marriage' if mangal_dosha_present else 'No Mangal Dosha present'
            }
        }
    
    def _get_planet_house(self, chart: Dict, planet_name: str) -> int:
        """Get the house number for a planet"""
        try:
            planet_data = chart.get('planets', {}).get(planet_name, {})
            return planet_data.get('house', 1)
        except:
            return 1
    
    def _get_recommendation(self, total_score: int, doshas: Dict) -> Dict[str, str]:
        """Get marriage recommendation based on score and doshas"""
        
        # Adjust score based on doshas
        adjusted_score = total_score
        if doshas.get('mangal_dosha', {}).get('present'):
            adjusted_score -= 3
        
        if adjusted_score >= 28:
            level = 'excellent'
            message = 'Excellent match! This union is highly auspicious and promises great harmony.'
        elif adjusted_score >= 24:
            level = 'very_good'
            message = 'Very good match! The couple will enjoy a harmonious relationship.'
        elif adjusted_score >= 18:
            level = 'good'
            message = 'Good match. The relationship will work well with mutual understanding.'
        elif adjusted_score >= 12:
            level = 'average'
            message = 'Average match. Extra effort and understanding needed for harmony.'
        else:
            level = 'challenging'
            message = 'Challenging match. Careful consideration and remedies recommended.'
        
        return {
            'level': level,
            'message': message,
            'proceed': adjusted_score >= 18,
            'remedies_needed': adjusted_score < 24 or doshas.get('mangal_dosha', {}).get('present')
        }
    
    def _get_ai_insights(self, chart1: Dict, chart2: Dict, 
                        scores: Dict, doshas: Dict) -> Dict[str, str]:
        """Get AI-enhanced compatibility insights"""
        
        prompt = f"""Provide detailed Kundali matchmaking insights for this couple:

Person 1:
- Zodiac: {chart1['zodiac_sign']}
- Moon Sign: {chart1['moon_sign']}
- Nakshatra: {chart1['nakshatra']}

Person 2:
- Zodiac: {chart2['zodiac_sign']}
- Moon Sign: {chart2['moon_sign']}
- Nakshatra: {chart2['nakshatra']}

Ashtakoot Score: {scores['total_score']}/36
Mangal Dosha: {'Present' if doshas['mangal_dosha']['present'] else 'Absent'}

Provide detailed insights on:
1. Overall compatibility and relationship dynamics
2. Strengths of this union
3. Areas needing attention
4. Communication and emotional compatibility
5. Long-term prospects
6. Practical advice for harmony
"""
        
        try:
            response = self.openai_service.generate_prediction(prompt, chart1)
            return {
                'overall_analysis': response,
                'source': 'ai_enhanced'
            }
        except Exception as e:
            logger.error(f"AI insights failed: {e}")
            raise
    
    def _get_offline_insights(self, chart1: Dict, chart2: Dict,
                             scores: Dict, doshas: Dict) -> Dict[str, str]:
        """Get offline wisdom-based insights"""
        
        total_score = scores['total_score']
        
        insights = {
            'overall_analysis': f"""Based on Vedic astrology principles:

The compatibility score of {total_score} out of 36 indicates a {'favorable' if total_score >= 18 else 'challenging'} match.

Key Factors:
- Gana (Temperament): {scores['gana']['score']}/{scores['gana']['max']} - {self._interpret_gana(scores['gana']['score'])}
- Bhakoot (Moon Harmony): {scores['bhakoot']['score']}/{scores['bhakoot']['max']} - {self._interpret_bhakoot(scores['bhakoot']['score'])}
- Nadi (Health & Progeny): {scores['nadi']['score']}/{scores['nadi']['max']} - {self._interpret_nadi(scores['nadi']['score'])}
- Graha Maitri (Planetary Friendship): {scores['graha_maitri']['score']}/{scores['graha_maitri']['max']} - {self._interpret_graha_maitri(scores['graha_maitri']['score'])}

{'Mangal Dosha is present, which requires attention and remedies.' if doshas['mangal_dosha']['present'] else 'No major doshas detected.'}

Recommendation: {'This match shows promise for a harmonious union.' if total_score >= 18 else 'Extra care and remedies needed for this match.'}
""",
            'source': 'offline_wisdom'
        }
        
        return insights
    
    def _interpret_gana(self, score: int) -> str:
        if score >= 5:
            return "Excellent temperament compatibility"
        elif score >= 3:
            return "Good temperament match"
        else:
            return "Temperament differences need attention"
    
    def _interpret_bhakoot(self, score: int) -> str:
        if score == 7:
            return "Excellent moon sign harmony"
        else:
            return "Moon sign positions need remedial measures"
    
    def _interpret_nadi(self, score: int) -> str:
        if score == 8:
            return "Excellent health and progeny prospects"
        else:
            return "Nadi Dosha present - remedies essential"
    
    def _interpret_graha_maitri(self, score: int) -> str:
        if score == 5:
            return "Strong planetary friendship"
        elif score >= 3:
            return "Good planetary compatibility"
        else:
            return "Planetary relationships need strengthening"


# Singleton instance
_matchmaking_service = None


def get_matchmaking_service() -> MatchmakingService:
    """Get or create the matchmaking service singleton"""
    global _matchmaking_service
    if _matchmaking_service is None:
        _matchmaking_service = MatchmakingService()
    return _matchmaking_service

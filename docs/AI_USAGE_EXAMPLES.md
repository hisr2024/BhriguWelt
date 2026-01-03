"""
Example: Using AI Features in BhriguWelt

This example demonstrates how to integrate AI features
into your application with proper consent and privacy controls.
"""

# Example 1: Frontend - Check AI Status
async function checkAIAvailability() {
  try {
    const response = await fetch('http://localhost:8000/api/ai/status');
    const data = await response.json();
    
    if (data.data.ai_available) {
      console.log('✓ AI features are available');
      return true;
    } else {
      console.log('✗ AI features not configured');
      return false;
    }
  } catch (error) {
    console.error('Error checking AI status:', error);
    return false;
  }
}

# Example 2: Frontend - Get Consent Information
async function getConsentInfo() {
  const response = await fetch('http://localhost:8000/api/ai/consent');
  const data = await response.json();
  
  console.log('AI Modes:', data.data.modes);
  console.log('Never transmitted:', data.data.data_never_transmitted);
  
  return data.data;
}

# Example 3: Frontend - Request AI-Enhanced Report (with consent)
async function getAIEnhancedReport() {
  // First check if user has granted consent
  const preferences = getAIPreferences(); // From ai-preferences.ts
  
  if (!preferences.consentGranted) {
    console.error('User has not granted AI consent');
    return null;
  }
  
  // Prepare birth data (NO PII!)
  const birthData = {
    zodiac_sign: 'Aries',
    nakshatra: 'Ashwini',
    moon_sign: 'Taurus',
    ascendant: 'Gemini',
    planetary_positions: {
      sun: { degree: 15, sign: 'Aries' },
      moon: { degree: 28, sign: 'Taurus' }
    }
  };
  
  try {
    const response = await fetch('http://localhost:8000/api/ai/compose', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-AI-Consent': 'granted',
        'X-AI-Mode': preferences.mode
      },
      body: JSON.stringify({
        report_section: 'karmic_journey',
        birth_data: birthData
      })
    });
    
    const data = await response.json();
    
    if (data.status === 'success') {
      console.log('✓ AI-enhanced report received');
      console.log('Privacy note:', data.data.privacy_note);
      return data.data.refined_section;
    } else {
      console.error('Error:', data.message);
      return null;
    }
  } catch (error) {
    console.error('Error fetching AI report:', error);
    return null;
  }
}

# Example 4: Frontend - Chat with AI
async function chatWithAI(message) {
  const preferences = getAIPreferences();
  
  if (!preferences.consentGranted || preferences.mode !== 'conversational') {
    console.error('Conversational mode not enabled');
    return null;
  }
  
  const birthData = {
    zodiac_sign: 'Aries',
    nakshatra: 'Ashwini'
  };
  
  try {
    const response = await fetch('http://localhost:8000/api/ai/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-AI-Consent': 'granted',
        'X-AI-Mode': 'conversational'
      },
      body: JSON.stringify({
        message: message,
        birth_data: birthData,
        conversation_history: [] // Optional: include previous messages
      })
    });
    
    const data = await response.json();
    return data.data.response;
  } catch (error) {
    console.error('Chat error:', error);
    return null;
  }
}

# Example 5: Backend - Custom Endpoint with AI Integration
"""
from flask import Blueprint, request, jsonify
from middleware.sanitizer import RequestSanitizer
from services.ai_service import AIService

bp = Blueprint('custom', __name__)
ai_service = AIService()

@bp.route('/api/custom/enhanced-prediction', methods=['POST'])
def enhanced_prediction():
    # Check consent
    if request.headers.get('X-AI-Consent') != 'granted':
        return jsonify({'error': 'Consent required'}), 403
    
    data = request.get_json()
    
    # Sanitize birth data - CRITICAL!
    sanitized = RequestSanitizer.sanitize_for_ai(data['birth_data'])
    
    # Validate no PII present
    forbidden = ['name', 'email', 'phone', 'date_of_birth']
    for field in forbidden:
        if field in sanitized:
            return jsonify({'error': 'PII detected'}), 400
    
    # Generate AI prediction
    try:
        result = ai_service.refine_report_section(
            section_type='custom',
            astrological_data=sanitized,
            mode=request.headers.get('X-AI-Mode', 'hybrid')
        )
        
        return jsonify({
            'status': 'success',
            'data': {
                'prediction': result,
                'privacy_note': 'No personal information transmitted'
            }
        })
    except Exception as e:
        # Fallback to offline mode
        return jsonify({
            'status': 'success',
            'data': {
                'prediction': 'Offline prediction based on traditional methods',
                'ai_enhanced': False
            }
        })
"""

# Example 6: React Component - AI Mode Selector Integration
"""
import { useState, useEffect } from 'react';
import AIModeSelector from '@/app/components/AIModeSelector';
import { getAIPreferences } from '@/lib/ai-preferences';

export default function SettingsPage() {
  const [aiEnabled, setAIEnabled] = useState(false);
  
  useEffect(() => {
    const prefs = getAIPreferences();
    setAIEnabled(prefs.consentGranted);
  }, []);
  
  return (
    <div>
      <h1>AI Settings</h1>
      <AIModeSelector />
      
      {aiEnabled && (
        <div className="mt-4 p-4 bg-green-50 rounded">
          ✓ AI features enabled
        </div>
      )}
    </div>
  );
}
"""

# Example 7: Testing PII Sanitization
"""
from middleware.sanitizer import RequestSanitizer

def test_my_data_is_safe():
    # This data should have PII removed
    my_data = {
        'name': 'John Doe',  # PII - will be removed
        'email': 'john@example.com',  # PII - will be removed
        'zodiac_sign': 'Aries',  # OK - will be kept
        'nakshatra': 'Ashwini'  # OK - will be kept
    }
    
    sanitized = RequestSanitizer.sanitize_for_ai(my_data)
    
    # Verify PII removed
    assert 'name' not in sanitized
    assert 'email' not in sanitized
    
    # Verify astrological data preserved
    assert sanitized['zodiac_sign'] == 'Aries'
    assert sanitized['nakshatra'] == 'Ashwini'
    
    print('✓ Data is safe for AI transmission')
"""

# Example 8: Error Handling Best Practices
async function robustAIRequest() {
  try {
    // Try AI-enhanced version
    const result = await getAIEnhancedReport();
    return result;
  } catch (error) {
    if (error.response?.status === 429) {
      // Rate limited
      console.log('Rate limited. Using offline mode.');
      return generateOfflineReport();
    } else if (error.response?.status === 403) {
      // No consent
      console.log('Consent required. Using offline mode.');
      return generateOfflineReport();
    } else if (error.response?.status === 503) {
      // AI service unavailable
      console.log('AI unavailable. Using offline mode.');
      return generateOfflineReport();
    } else {
      // Unknown error
      console.error('Unexpected error:', error);
      return generateOfflineReport();
    }
  }
}

function generateOfflineReport() {
  // Traditional Vedic astrology calculations
  return "Traditional analysis based on classical texts...";
}

# Example 9: Monitoring AI Usage
"""
import logging
from datetime import datetime

logger = logging.getLogger('ai_monitor')

def log_ai_request(endpoint, mode, success, response_time):
    logger.info('ai_request', extra={
        'endpoint': endpoint,
        'mode': mode,
        'success': success,
        'response_time_ms': response_time,
        'timestamp': datetime.utcnow().isoformat()
    })
    
    # DON'T LOG:
    # - User names
    # - Email addresses
    # - Birth locations
    # - Any PII
"""

# Example 10: Implementing Custom Consent Flow
"""
import AIConsentDialog from '@/app/components/AIConsentDialog';
import { grantAIConsent } from '@/lib/ai-preferences';

function MyCustomFeature() {
  const [showConsent, setShowConsent] = useState(false);
  
  const handleEnableAI = () => {
    // Show consent dialog
    setShowConsent(true);
  };
  
  const handleConsentGranted = (mode) => {
    // Consent granted, enable feature
    console.log('AI enabled in mode:', mode);
    // Now can use AI features
    fetchAIEnhancedData();
  };
  
  return (
    <>
      <button onClick={handleEnableAI}>
        Enable AI Insights
      </button>
      
      <AIConsentDialog
        isOpen={showConsent}
        onClose={() => setShowConsent(false)}
        onConsent={handleConsentGranted}
        requestedMode="hybrid"
      />
    </>
  );
}
"""

// Summary of Best Practices
console.log(`
✅ AI Features Best Practices:

1. Always check consent before AI requests
2. Never transmit PII to AI
3. Use sanitize_for_ai() on all data
4. Handle errors with offline fallback
5. Show clear privacy notices
6. Respect user's mode selection
7. Log AI usage (without PII)
8. Test PII redaction thoroughly
9. Monitor rate limits
10. Keep documentation updated
`);

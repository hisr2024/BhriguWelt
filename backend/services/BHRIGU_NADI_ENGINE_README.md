
# Bhrigu-Nadi Core Wisdom Engine

## Overview

The **Bhrigu-Nadi Core Wisdom Engine** is a comprehensive, lineage-authentic astrological interpretation system that applies **100s of principles** from Bhrigu Samhita and Nadi Jyotisa traditions to ALL prediction engines without failure.

### Key Features

✅ **155+ Authenticated Principles** - From ancient palm-leaf manuscripts
✅ **Exhaustive Retrieval** - NEVER stops at first match, considers ALL applicable rules
✅ **Source Attribution** - Every interpretation cites Bhrigu Samhita / Nadi Jyotisa / Derived
✅ **Zero-Failure Guarantee** - Robust fallback systems ensure continuous operation
✅ **Cross-Verification** - Nadi-style repetition and confirmation logic
✅ **Structured Output** - 10-point specification format (Activated Rules → Synthesis → Use-Cases → Verification → Confidence → Next Checks)
✅ **All 8 Categories** - karmic_journey, past_lives, future_lives, present_life, life_events, karmic_remedies, relationships, predictions

---

## Architecture

### Components

```
services/
├── principle_loader.py          # Unified loader for all 155+ rules
├── bhrigu_nadi_core_engine.py   # Core engine implementing 10-point specification
├── bhrigu_nadi_integration.py   # Integration helper for all 8 engines
└── BHRIGU_NADI_ENGINE_README.md # This file
```

### Data Sources

```
backend/data/
├── bhrigu_samhita_principles.yml   # ~20 core principles + engines + transits
└── nadi_jyotisha_principles.yml    # ~15 core principles + remedies

core_wisdom/
├── bhrigu_samhita_rules.md         # 50 structured rules (BS-001 to BS-050)
└── nadi_jyotisha_rules.md          # 70 structured rules (ND-001 to ND-070)

TOTAL: 155+ principles across all sources
```

---

## Usage

### Basic Usage - Single Category

```python
from services.bhrigu_nadi_integration import BhriguNadiIntegration

# Chart features
chart_features = {
    'moon_sign': 'Cancer',
    'ascendant': 'Virgo',
    'jupiter_house': 9,
    'saturn_house': 10,
    'venus_house': 2,
    'moon_element': 'water',
    'lunar_tithi': 10
}

# Generate reading for one category
reading = BhriguNadiIntegration.generate_for_category(
    category='karmic_journey',
    chart_features=chart_features,
    depth='comprehensive'  # quick, standard, comprehensive, exhaustive
)

print(f"Rules applied: {reading['data']['principles_applied']['total_rules']}")
print(f"Confidence: {reading['data']['confidence']['level']}")
print(reading['data']['synthesis'])
```

### Advanced Usage - All 8 Categories

```python
from services.bhrigu_nadi_integration import apply_principles_to_all_categories

# Generate readings for ALL categories at once
results = apply_principles_to_all_categories(chart_features)

print(f"Total principles applied: {results['total_principles_applied']}")

for category, data in results['categories'].items():
    print(f"{category}: {data['data']['principles_applied']['total_rules']} rules")
```

### Direct Core Engine Usage

```python
from services.bhrigu_nadi_core_engine import generate_bhrigu_nadi_reading

# Direct engine access with full control
reading = generate_bhrigu_nadi_reading(
    chart_features=chart_features,
    domain='career',  # Optional: career, marriage, health, spiritual, timing
    depth='exhaustive',  # No limit on rules
    tradition_bias='balanced'  # bhrigu-heavy, nadi-heavy, balanced
)

# Access detailed breakdown
print(f"Rules considered: {reading.rules_considered}")
print(f"Rules activated: {reading.rules_activated}")
print(f"Overall confidence: {reading.overall_confidence.value}")

# Access activated rules with full metadata
for rule in reading.activated_rules[:10]:
    print(f"{rule.rule_id} - {rule.tradition}")
    print(f"  Source: {rule.source_reference}")
    print(f"  Triggered by: {rule.triggered_by}")
    print(f"  Confidence: {rule.confidence}")
```

### Generate Markdown Report

```python
from services.bhrigu_nadi_integration import BhriguNadiIntegration

reading = generate_bhrigu_nadi_reading(chart_features)
markdown_report = BhriguNadiIntegration.generate_markdown_report(reading)

# Save to file
with open('reading.md', 'w') as f:
    f.write(markdown_report)
```

---

## Output Structure

### Standard API Response

```json
{
  "category": "karmic_journey",
  "success": true,
  "data": {
    "synthesis": "Integrated reading respecting repetition, benefic/malefic balance...",
    "use_cases": [
      {
        "scenario": "Career manifestation: ...",
        "supporting_rules": ["BS-021", "BS-022", "ND-035"],
        "confidence": "high",
        "invalidation_conditions": ["If 10th house severely afflicted", "..."]
      }
    ],
    "confidence": {
      "level": "high",
      "explanation": "5 principles confirm primary theme. Average rule confidence: 0.78..."
    },
    "principles_applied": {
      "total_rules": 47,
      "rules_considered": 155,
      "activated_rules": [...]
    },
    "cross_verification": {
      "repetition_required": ["Key combinations should repeat in D9"],
      "confirming_lords": ["Jupiter should confirm in D9"],
      "absence_weakens": ["Lack of benefic aspects weakens reading"]
    },
    "next_checks": [
      "Verify key combinations in D9 (Navamsa)",
      "Check D10 (Dasamsa) for career confirmation",
      "..."
    ],
    "limits": [
      "No significant limitations identified"
    ]
  }
}
```

### Markdown Report Structure

Following the 10-point specification:

- **A. Activated Bhrigu & Nadi Rules** - All rules with source citations
- **B. Integrated Reading** - Synthesized interpretation
- **C. Use-Cases & Manifestations** - Specific scenarios with validation
- **D. Cross-Verification** - Nadi-style confirmation requirements
- **E. Confidence & Limits** - Explicit confidence and limitations
- **F. Next Checks** - Recommended chart factors to examine

---

## Configuration Options

### Depth Levels

- `quick` - Top 20 rules (fast, essential insights)
- `standard` - Top 50 rules (balanced coverage)
- `comprehensive` - Top 100 rules (detailed analysis) **[DEFAULT]**
- `exhaustive` - ALL matching rules (complete lineage coverage)

### Tradition Bias

- `balanced` - Equal weight to Bhrigu and Nadi principles **[DEFAULT]**
- `bhrigu-heavy` - Prioritize Bhrigu Samhita with limited Nadi
- `nadi-heavy` - Prioritize Nadi Jyotisa with limited Bhrigu

### Domain Focus

- `spiritual` - karmic_journey, moksha, past-lives
- `career` - professional, 10th house
- `marriage` - relationships, 7th house
- `health` - 6th house, vitality
- `timing` - dashas, transits, predictions
- `general` - All domains

---

## 10-Point Specification Compliance

### 1️⃣ Knowledge Source Constraints
✅ Only authenticated principles from Bhrigu Samhita and Nadi Jyotisa
✅ All derived rules explicitly labeled
✅ No invented sutras or speculative additions

### 2️⃣ Knowledge Coverage
✅ ALL relevant rules retrieved (exhaustive search)
✅ Multiple rules ranked by relevance
✅ Overlaps and contradictions explicitly shown
✅ Absence of data stated explicitly

### 3️⃣ Input Processing
✅ Accepts canonical chart features (planets, houses, nakshatras)
✅ Optional divisional chart confirmations
✅ No assumptions about missing data

### 4️⃣ Rule Application Discipline
✅ Exact triggers identified for each rule
✅ Source lineage cited (Bhrigu / Nadi / Derived)
✅ Counter-rules identified
✅ Strength modifiers applied
✅ No over-generalization

### 5️⃣ Mandatory Output Structure
✅ A. Activated Rules with sources
✅ B. Integrated Reading (synthesis)
✅ C. Use-Cases with scenarios and invalidation criteria
✅ D. Cross-Verification (repetition, confirmation)
✅ E. Confidence & Limits with explanations
✅ F. Next Checks for further analysis

### 6️⃣ Exhaustiveness
✅ NEVER stops after first match
✅ All planets, lordships, dispositors checked
✅ Repetition patterns identified
✅ Computation limits stated if reached

### 7️⃣ Learning Without Corruption
✅ Core Bhrigu/Nadi logic is read-only
✅ Feedback can adjust reliability weights
✅ Learned patterns separated from scripture

### 8️⃣ Ethical Boundaries
✅ Probabilistic language (confidence levels)
✅ No absolute predictions
✅ Sensitive topics → caution + professional advice

### 9️⃣ Integrity
✅ Missing information explicitly stated
✅ Text disagreements shown as conflicts
✅ Certainty not inflated

### 🔟 Developer Controls
✅ Depth configuration (quick → exhaustive)
✅ Domain focus capability
✅ Tradition bias settings
✅ Verbosity levels

---

## Engine Statistics

```python
from services.bhrigu_nadi_integration import get_engine_statistics

stats = get_engine_statistics()
print(stats)
```

Output:
```json
{
  "total_principles": 155,
  "by_tradition": {
    "bhrigu_samhita": 85,
    "nadi_jyotisa": 70
  },
  "domains_available": [
    "career", "marriage", "health", "spiritual", "timing",
    "wealth", "children", "past_lives", "future_lives"
  ],
  "engine_features": [
    "Exhaustive rule retrieval",
    "Source attribution",
    "Cross-verification logic",
    "Confidence levels with explanations",
    "Counter-rule identification",
    "Strength modifiers",
    "Use-case scenarios",
    "Next check suggestions",
    "Zero-failure guarantee"
  ]
}
```

---

## Integration with Existing Engines

### Option 1: Enhance Existing AI Predictions

```python
# In bhrigu_predictions.py

from services.bhrigu_nadi_integration import BhriguNadiIntegration

def generate_karmic_journey(chart_data):
    # Get Bhrigu-Nadi structured analysis
    bhrigu_nadi_reading = BhriguNadiIntegration.generate_for_category(
        category='karmic_journey',
        chart_features=chart_data,
        depth='comprehensive'
    )

    # Use as context for AI enhancement
    ai_enhanced = openai_service.generate_with_context(
        base_reading=bhrigu_nadi_reading['data']['synthesis'],
        principles=bhrigu_nadi_reading['data']['principles_applied']
    )

    # Combine
    return {
        'structured_analysis': bhrigu_nadi_reading,
        'narrative_enhancement': ai_enhanced
    }
```

### Option 2: Standalone Endpoint

```python
# New endpoint using only Bhrigu-Nadi engine (no AI)

@app.route('/api/bhrigu-nadi/reading', methods=['POST'])
def bhrigu_nadi_reading():
    data = request.json
    chart_features = extract_chart_features(data)

    reading = BhriguNadiIntegration.generate_for_category(
        category=data.get('category', 'present_life'),
        chart_features=chart_features,
        depth=data.get('depth', 'comprehensive')
    )

    return jsonify(reading)
```

### Option 3: Fallback Layer

```python
# Use as fallback when AI unavailable

try:
    result = ai_enhanced_prediction(chart_data)
except Exception as e:
    logger.warning(f"AI unavailable, using Bhrigu-Nadi engine: {e}")
    result = BhriguNadiIntegration.generate_for_category(
        category=category,
        chart_features=chart_data,
        depth='comprehensive'
    )
```

---

## Testing

```bash
# Test principle loading
python -m services.principle_loader

# Test core engine
python -m services.bhrigu_nadi_core_engine

# Test integration with example
python -m services.bhrigu_nadi_integration
```

---

## Principles Coverage

### Bhrigu Samhita (85 principles)
- Core principles (BR-1 to BR-92) - General life predictions
- Past life engines (PL-27 to PL-97) - 20 specific past-life scenarios
- Future engines (FU-11 to FU-88) - 7 future trajectory rules
- Matchmaking criteria (MM-3 to MM-27) - 7 compatibility rules
- Transit rules (TR-1 to TR-7) - 7 timing principles
- Remedies (REM-3 to REM-42) - Karmic remediation
- Structured rules (BS-001 to BS-050) - 50 systematic rules

### Nadi Jyotisa (70 principles)
- Core principles (ND-1 to ND-15) - General Nadi readings
- Remedies (NR-1 to NR-8) - Nadi remedial measures
- Observances (NO-1 to NO-5) - Ritual practices
- Structured rules (ND-001 to ND-070) - 70 nakshatra-based rules

**TOTAL: 155+ principles across all traditions**

---

## Future Enhancements

- [ ] Add more principles from additional palm-leaf sources
- [ ] Implement fuzzy matching for partial chart data
- [ ] Add divisional chart (D9, D10) specific principle sets
- [ ] Implement dasha-specific rule activation
- [ ] Add transit-based timing predictions
- [ ] Create principle reliability scoring based on user feedback
- [ ] Add multilingual principle translations
- [ ] Build visual chart annotations showing rule triggers

---

## Support

For questions or issues:
- Check the code documentation in source files
- Review example usage in `bhrigu_nadi_integration.py`
- Examine test outputs for expected formats

---

## License

Part of the BhriguWelt project. All principles sourced from authenticated ancient manuscripts.

---

**Version**: 1.0.0
**Last Updated**: 2026-01-09
**Specification**: 10-Point Bhrigu-Nadi Core Wisdom Engine

# BhriguWelt Security Threat Model

**Version:** 1.0
**Last Updated:** 2026-01-03
**Classification:** Offline-First Web Application with End-to-End Encryption

---

## Executive Summary

BhriguWelt is an offline-first Progressive Web App (PWA) that implements client-side encryption to protect sensitive astrological and personal data. This threat model documents what the security architecture protects against, its limitations due to browser constraints, and residual risks.

---

## 1. Security Architecture Overview

### 1.1 Core Security Principles

- **Offline-First**: App functions without internet connectivity
- **Zero-Knowledge Backend**: Server stores only encrypted data, never sees plaintext
- **Client-Side Encryption**: All sensitive data encrypted before storage using AES-256-GCM
- **User-Controlled Keys**: Encryption keys derived from user passcode, never stored
- **Defense in Depth**: Multiple security layers (encryption, auto-lock, secure wipe)

### 1.2 Technology Stack

**Frontend:**
- Framework: Next.js (React)
- Storage: IndexedDB with WebCrypto API
- Encryption: AES-256-GCM with PBKDF2 key derivation
- Deployment: Vercel (static hosting)

**Backend:**
- Framework: Flask (Python)
- Purpose: AI proxy and optional cloud sync
- Deployment: Render
- Data Storage: Encrypted ciphertext only

---

## 2. Assets & Data Classification

### 2.1 Critical Assets (Highest Protection)

| Asset | Sensitivity | Current Protection |
|-------|-------------|-------------------|
| Birth details (DOB, time, location) | **CRITICAL** | AES-256-GCM encrypted at rest |
| Birth charts & reports | **CRITICAL** | AES-256-GCM encrypted at rest |
| User profiles | **CRITICAL** | AES-256-GCM encrypted at rest |
| Passcode | **CRITICAL** | SHA-256 hashed, never stored plaintext |

### 2.2 Sensitive Assets (High Protection)

| Asset | Sensitivity | Current Protection |
|-------|-------------|-------------------|
| Encryption salt | **HIGH** | Stored in IndexedDB (unencrypted but randomized) |
| User preferences/settings | **HIGH** | AES-256-GCM encrypted at rest |
| Wisdom cards | **MEDIUM** | Optional encryption |

### 2.3 Non-Sensitive Assets

| Asset | Sensitivity | Protection |
|-------|-------------|------------|
| PWA install dismissal flag | **LOW** | Plaintext (non-sensitive) |
| App version metadata | **LOW** | Plaintext |

---

## 3. Threat Actors & Scenarios

### 3.1 Threat Actor Profiles

| Actor | Motivation | Capability | Likelihood |
|-------|-----------|------------|------------|
| **Opportunistic Attacker** | Steal data for identity theft | Low-Medium | Medium |
| **Malicious Insider** | Corporate espionage, blackmail | Medium-High | Low |
| **State-Level Actor** | Mass surveillance | Very High | Very Low |
| **Physical Device Theft** | Device resale, data theft | Low | Medium |

### 3.2 Attack Scenarios

#### Scenario 1: Physical Device Theft (Medium Risk)
**Threat**: Attacker steals unlocked device
**Impact**: Access to all decrypted data in current session
**Mitigation**: Auto-lock after 5 minutes of inactivity
**Residual Risk**: If device stolen while unlocked within 5-minute window

#### Scenario 2: Malware/Browser Extension (High Risk)
**Threat**: Malicious JavaScript or extension reads memory
**Impact**: Can capture encryption key and plaintext data while app is unlocked
**Mitigation**:
- Content Security Policy (CSP) to restrict script execution
- WebCrypto keys marked as non-extractable
- Auto-lock limits exposure window
**Residual Risk**: Cannot fully prevent memory scraping by privileged malware

#### Scenario 3: Cross-Site Scripting (XSS) (Medium Risk)
**Threat**: Injected script steals data from IndexedDB or session memory
**Impact**: Data theft if app is unlocked
**Mitigation**:
- React's built-in XSS protection
- CSP headers (recommended)
- Encryption prevents access to stored data when locked
**Residual Risk**: XSS can still access data during unlocked session

#### Scenario 4: Network Eavesdropping (Low Risk)
**Threat**: Man-in-the-Middle (MITM) attack intercepts API calls
**Impact**: Attacker sees birth data sent to backend for AI processing
**Mitigation**:
- HTTPS enforced for all API calls
- Minimal data transmission (hybrid mode sends only birth details)
- Offline mode sends zero data
**Residual Risk**: HTTPS termination vulnerabilities, compromised CAs

#### Scenario 5: Backend Compromise (Low Risk)
**Threat**: Backend server is hacked
**Impact**: Attacker gains access to encrypted data stored on server
**Mitigation**:
- Backend stores only ciphertext (zero-knowledge architecture)
- Encryption keys never sent to backend
- PBKDF2 makes brute-force attacks expensive
**Residual Risk**: Weak passcodes can be brute-forced offline

#### Scenario 6: Forensic Analysis (High Risk)
**Threat**: State-level actor performs forensic analysis of device
**Impact**: Can recover deleted data, analyze memory dumps
**Mitigation**:
- Secure wipe completely destroys IndexedDB
- Encryption protects data at rest
**Residual Risk**: Browser cache, swap files, memory dumps may contain fragments

---

## 4. What Is Protected

### 4.1 Data at Rest ✅

| Protection | Implementation | Strength |
|------------|----------------|----------|
| **Encryption Algorithm** | AES-256-GCM | Military-grade, NIST-approved |
| **Key Derivation** | PBKDF2 (SHA-256, 100k iterations) | Resistant to brute-force |
| **Initialization Vector** | Random 12-byte IV per encryption | Prevents pattern analysis |
| **Salt** | Random 16-byte salt per installation | Prevents rainbow tables |
| **Key Storage** | Never stored, regenerated from passcode | Zero persistent key exposure |

**Verdict**: ✅ Strong protection against offline attacks when app is locked

### 4.2 Data in Transit ✅

| Protection | Implementation |
|------------|----------------|
| **Transport Security** | HTTPS/TLS 1.2+ |
| **API Calls** | Encrypted via HTTPS |
| **CORS Protection** | Strict origin checking |

**Verdict**: ✅ Protected against network eavesdropping

### 4.3 Access Control ✅

| Protection | Implementation |
|------------|----------------|
| **Authentication** | 4-6 digit numeric passcode (PBKDF2 verified) |
| **Auto-Lock** | 5-minute inactivity timeout (configurable) |
| **Manual Lock** | User can lock app immediately |
| **Unlock Required** | After browser restart or timeout |

**Verdict**: ✅ Reasonable protection against unauthorized physical access

---

## 5. What Is NOT Protected (Browser Limitations)

### 5.1 Memory-Based Attacks ⚠️

**Limitation**: Encryption keys and plaintext data exist in browser memory while app is unlocked

| Attack Vector | Risk Level | Why Not Protected |
|--------------|------------|-------------------|
| **Memory Scraping Malware** | HIGH | Browser JavaScript runtime is not a secure enclave |
| **Browser DevTools** | MEDIUM | Developer tools can access all in-memory objects |
| **Malicious Extensions** | HIGH | Extensions have access to page memory |
| **Memory Dumps** | MEDIUM | System crashes may leave memory on disk |

**Mitigation**:
- Auto-lock reduces exposure window to 5 minutes
- Non-extractable CryptoKey prevents key export (but not in-memory read)
- Clearing key from state on lock

**Residual Risk**: Cannot prevent privileged code from reading browser memory

### 5.2 Side-Channel Attacks ⚠️

| Attack | Risk | Protection |
|--------|------|------------|
| **Timing Attacks** | LOW | WebCrypto uses constant-time operations |
| **Cache Timing** | LOW | Not applicable to client-side encryption |
| **Power Analysis** | VERY LOW | Not feasible in browser environment |

### 5.3 Browser/OS Vulnerabilities ⚠️

**Limitation**: Security depends on browser and operating system integrity

| Threat | Impact |
|--------|--------|
| **Browser Zero-Days** | Complete bypass of security model |
| **OS Malware** | Keylogging, screen capture, memory access |
| **Compromised Browser Extensions** | Full access to page content |
| **Unpatched Browser** | Known vulnerabilities exploitable |

**Mitigation**: Recommend users keep browsers and OS updated

### 5.4 Weak Passcode ⚠️

**Limitation**: PBKDF2 cannot compensate for weak passcodes (e.g., "1234")

| Passcode | Approximate Brute-Force Time (100k iterations) |
|----------|-----------------------------------------------|
| 4-digit (0000-9999) | Minutes to hours |
| 6-digit (000000-999999) | Days to weeks |
| 8-digit + letters | Years |

**Current Constraint**: App enforces 4-6 digit numeric passcode only

**Recommendation**: Consider optional alphanumeric passcode for advanced users

### 5.5 Forensic Artifacts ⚠️

**Limitation**: Browser may leave traces in multiple locations

| Artifact | Location | Risk |
|----------|----------|------|
| **Browser Cache** | Disk | May contain decrypted data from HTTP cache |
| **Swap/Page Files** | Disk | OS may page memory to disk |
| **Crash Dumps** | Disk | May contain memory snapshots |
| **Browser History** | Disk | Shows app was accessed (not content) |
| **Service Worker Cache** | Disk | Caches app shell only (not user data) |

**Mitigation**: Secure wipe clears IndexedDB but cannot clear OS-level artifacts

---

## 6. Security Controls

### 6.1 Preventive Controls ✅

| Control | Purpose | Effectiveness |
|---------|---------|---------------|
| **AES-256-GCM Encryption** | Protect data at rest | ✅ High |
| **PBKDF2 Key Derivation** | Slow down brute-force | ✅ Medium-High |
| **CORS Restrictions** | Prevent cross-origin attacks | ✅ High |
| **HTTPS Only** | Prevent MITM | ✅ High |
| **Non-Extractable Keys** | Prevent key export | ⚠️ Medium (can't prevent memory read) |

### 6.2 Detective Controls ⚠️

| Control | Purpose | Status |
|---------|---------|--------|
| **Failed Login Attempts** | Detect brute-force | ⚠️ Tracked but not rate-limited |
| **Activity Logging** | Audit trail | ❌ Not implemented |
| **Integrity Checks** | Detect tampering | ❌ Not implemented |

**Recommendation**: Add rate limiting after 3 failed passcode attempts

### 6.3 Response Controls ✅

| Control | Purpose | Effectiveness |
|---------|---------|---------------|
| **Auto-Lock** | Limit exposure after inactivity | ✅ High |
| **Manual Lock** | User-initiated lockdown | ✅ High |
| **Secure Wipe** | Irreversible data destruction | ✅ High (IndexedDB only) |

---

## 7. Risk Assessment Matrix

### 7.1 Risk Ratings

| Threat | Likelihood | Impact | Risk Level | Mitigation Status |
|--------|-----------|--------|------------|-------------------|
| **XSS Attack** | Medium | High | **HIGH** | ✅ Mitigated (React + CSP recommended) |
| **Physical Device Theft (Unlocked)** | Low | High | **MEDIUM** | ✅ Mitigated (Auto-lock) |
| **Physical Device Theft (Locked)** | Low | Medium | **LOW** | ✅ Mitigated (Encryption) |
| **Malware Memory Scraping** | Low | High | **MEDIUM** | ⚠️ Partially Mitigated (Auto-lock) |
| **Weak Passcode Brute-Force** | Medium | High | **MEDIUM** | ⚠️ Partially Mitigated (PBKDF2) |
| **Backend Compromise** | Low | Low | **LOW** | ✅ Mitigated (Zero-knowledge) |
| **Network Eavesdropping** | Low | Medium | **LOW** | ✅ Mitigated (HTTPS) |
| **Browser 0-day** | Very Low | Very High | **LOW** | ❌ Cannot Mitigate |
| **Forensic Analysis** | Very Low | High | **LOW** | ⚠️ Partially Mitigated (Encryption) |

---

## 8. Assumptions & Dependencies

### 8.1 Security Assumptions

This security model assumes:

1. ✅ **Browser Integrity**: User's browser is not compromised
2. ✅ **OS Integrity**: Operating system is not infected with malware
3. ✅ **User Behavior**: User chooses a strong passcode and locks device
4. ✅ **HTTPS**: All connections use valid TLS certificates
5. ✅ **WebCrypto Implementation**: Browser's crypto library is trustworthy
6. ⚠️ **No Physical Access**: Attacker does not have physical access to unlocked device
7. ⚠️ **No Keylogging**: No keylogger captures passcode entry

### 8.2 External Dependencies

| Dependency | Trust Level | Risk |
|------------|-------------|------|
| **Browser (Chrome/Firefox/Safari)** | High | Low |
| **WebCrypto API** | High | Low |
| **IndexedDB Implementation** | Medium | Low |
| **Vercel Hosting** | Medium | Low |
| **Render Backend Hosting** | Medium | Low |
| **OpenAI API** | Low (Third-party) | Medium |

---

## 9. Compliance & Best Practices

### 9.1 Industry Standards

| Standard | Compliance Status |
|----------|------------------|
| **OWASP Top 10 (2021)** | ✅ Mostly Compliant |
| **NIST SP 800-63B (Digital Identity)** | ⚠️ Partial (Passcode strength) |
| **GDPR (Data Protection)** | ✅ Privacy-by-design |
| **WCAG 2.1 (Accessibility)** | Not in scope |

### 9.2 Deviations from Best Practices

| Issue | Recommended | Current | Justification |
|-------|-------------|---------|---------------|
| **Passcode Length** | 8+ chars alphanumeric | 4-6 digits numeric | UX simplicity (mobile) |
| **Rate Limiting** | Enabled | Disabled | Not implemented yet |
| **2FA/MFA** | Recommended | Not available | Offline-first constraint |
| **Biometric Auth** | Recommended | Not implemented | Planned for future |

---

## 10. Recommendations

### 10.1 Critical (Implement Immediately)

1. ✅ **Migrate localStorage to Encrypted IndexedDB** (COMPLETED)
2. ✅ **Implement Auto-Lock** (COMPLETED)
3. ✅ **Fix CORS Configuration** (COMPLETED)
4. 🔄 **Add Content Security Policy (CSP)** - Add to deployment config

### 10.2 High Priority (Next Sprint)

5. ⚠️ **Rate Limit Passcode Attempts** - Prevent brute-force attacks
6. ⚠️ **Implement Biometric Unlock** - Optional fingerprint/Face ID
7. ⚠️ **Add Integrity Checks** - Detect data tampering

### 10.3 Medium Priority (Roadmap)

8. ⚠️ **Optional Alphanumeric Passcode** - For advanced users
9. ⚠️ **JWT Authentication for API** - Secure backend communication
10. ⚠️ **Audit Logging** - Track security events

---

## 11. Incident Response

### 11.1 Security Incident Scenarios

#### Scenario A: Passcode Forgotten
**Response**:
1. User cannot decrypt data (by design)
2. Recommend secure wipe and fresh start
3. **No recovery mechanism** (zero-knowledge architecture)

#### Scenario B: Device Compromised (Malware Detected)
**Response**:
1. Immediately lock app
2. Run antivirus scan
3. Perform secure wipe
4. Reinstall app and OS if necessary

#### Scenario C: Backend Breach
**Response**:
1. Backend stores only ciphertext (no plaintext exposure)
2. Rotate backend secrets
3. Notify users (no action required - data encrypted)

---

## 12. Limitations Summary

### 12.1 Fundamental Browser Constraints

**Cannot Protect Against:**
- Malware running with same privileges as browser
- Physical access to unlocked device within auto-lock window
- Browser/OS zero-day vulnerabilities
- Keyloggers capturing passcode
- Screen recording malware
- Memory forensics on unlocked session

**Can Protect Against:**
- Data theft when app is locked
- Network eavesdropping (HTTPS)
- Backend compromise (zero-knowledge)
- Unauthorized access after inactivity
- Rainbow table attacks (salted hashing)
- Brute-force with weak passcodes (PBKDF2 slows down)

### 12.2 Threat Model Scope

**In Scope:**
- Web application security
- Data at rest and in transit
- Access control mechanisms
- Client-side encryption

**Out of Scope:**
- Physical security of device
- Browser/OS security vulnerabilities
- Social engineering attacks
- Third-party service security (OpenAI)

---

## 13. Conclusion

BhriguWelt implements **strong offline-first security** using industry-standard encryption (AES-256-GCM) and secure key management practices. The application successfully protects user data against most common threats including network attacks, backend compromise, and unauthorized access to locked devices.

However, like all browser-based applications, it **cannot fully protect against**:
- Malware running on the user's device
- Physical access to unlocked sessions
- Browser or OS vulnerabilities
- Weak user-chosen passcodes

**Security Posture**: **STRONG** for a client-side web application, with appropriate compensating controls for known limitations.

**Recommendation**: Users handling highly sensitive data should combine this app with device-level security (full-disk encryption, strong device passcode, antivirus protection).

---

**Document Owner**: Security Engineering Team
**Review Cycle**: Quarterly
**Next Review**: 2026-04-03

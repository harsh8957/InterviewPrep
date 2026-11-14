/**
 * PII Sanitizer and Moderation Safeguards for Company Interview Experiences.
 * Enforces strict confidentiality: blocks phone numbers, emails, and interviewer personal names.
 */

export interface PIIScanResult {
  hasViolations: boolean;
  violations: string[];
  sanitizedText: string;
}

// Regex patterns for detecting sensitive personal identifiable information
const EMAIL_REGEX = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/gi;
const PHONE_REGEX = /\b(?:\+?\d{1,3}[-.\s]*)?\(?\d{2,4}\)?[-.\s]*\d{3,4}[-.\s]*\d{3,4}\b/g;
const INTERVIEWER_NAME_REGEX = /\b(?:interviewer|recruiter|hiring manager|manager)\s+(?:was\s+|is\s+|named\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\b/gi;
const SSN_OR_GOV_ID = /\b\d{3}-\d{2}-\d{4}\b/g;

/**
 * Scans content for personally identifiable information (PII).
 */
export function scanForPII(content: string): PIIScanResult {
  const violations: string[] = [];
  let sanitized = content;

  // 1. Email addresses
  const emailMatches = content.match(EMAIL_REGEX);
  if (emailMatches && emailMatches.length > 0) {
    violations.push(`Email address detected (${emailMatches.length} occurrence(s)). Please remove personal email addresses.`);
    sanitized = sanitized.replace(EMAIL_REGEX, '[EMAIL REDACTED]');
  }

  // 2. Phone numbers (filter out small numbers that might be problem numbers like 1, 2)
  const phoneMatches = content.match(PHONE_REGEX);
  if (phoneMatches) {
    const validPhones = phoneMatches.filter(p => p.replace(/\D/g, '').length >= 10);
    if (validPhones.length > 0) {
      violations.push(`Phone number detected (${validPhones.length} occurrence(s)). Please remove phone numbers.`);
      for (const phone of validPhones) {
        sanitized = sanitized.replace(phone, '[PHONE REDACTED]');
      }
    }
  }

  // 3. Social Security or Gov IDs
  const ssnMatches = content.match(SSN_OR_GOV_ID);
  if (ssnMatches && ssnMatches.length > 0) {
    violations.push('Government identity / SSN pattern detected. Please remove sensitive identification numbers.');
    sanitized = sanitized.replace(SSN_OR_GOV_ID, '[ID REDACTED]');
  }

  // 4. Explicit interviewer / recruiter personal names
  const nameMatches = [...content.matchAll(INTERVIEWER_NAME_REGEX)];
  if (nameMatches.length > 0) {
    const names = nameMatches.map(m => m[1]).filter(Boolean);
    if (names.length > 0) {
      violations.push(`Personal interviewer/recruiter name detected (${names.join(', ')}). Do not mention company staff by name.`);
      sanitized = sanitized.replace(INTERVIEWER_NAME_REGEX, (match) => {
        return match.replace(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/, '[INTERVIEWER NAME REDACTED]');
      });
    }
  }

  return {
    hasViolations: violations.length > 0,
    violations,
    sanitizedText: sanitized,
  };
}

/**
 * Validates complete experience submission text across rounds, questions, and advice.
 */
export function validateExperiencePII(experiencePayload: {
  preparationTips?: string;
  timelineNotes?: string;
  rounds?: Array<{ questionsSummary: string }>;
  questions?: Array<{ questionText: string }>;
}): { isValid: boolean; violations: string[] } {
  const allViolations: string[] = [];

  if (experiencePayload.preparationTips) {
    const res = scanForPII(experiencePayload.preparationTips);
    if (res.hasViolations) {
      allViolations.push(...res.violations.map(v => `In Preparation Tips: ${v}`));
    }
  }

  if (experiencePayload.timelineNotes) {
    const res = scanForPII(experiencePayload.timelineNotes);
    if (res.hasViolations) {
      allViolations.push(...res.violations.map(v => `In Timeline Notes: ${v}`));
    }
  }

  if (experiencePayload.rounds) {
    experiencePayload.rounds.forEach((r, idx) => {
      const res = scanForPII(r.questionsSummary);
      if (res.hasViolations) {
        allViolations.push(...res.violations.map(v => `In Round ${idx + 1}: ${v}`));
      }
    });
  }

  if (experiencePayload.questions) {
    experiencePayload.questions.forEach((q, idx) => {
      const res = scanForPII(q.questionText);
      if (res.hasViolations) {
        allViolations.push(...res.violations.map(v => `In Question ${idx + 1}: ${v}`));
      }
    });
  }

  return {
    isValid: allViolations.length === 0,
    violations: allViolations,
  };
}

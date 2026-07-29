import CommissionStrategy from './CommissionStrategy';

/**
 * Membership Commission (Direct Referral) Strategy Defaults (Levels 1 to 20 editable):
 * Level 1: 10.00%
 * Level 2: 5.00%
 * Levels 3–6: 2.50%
 * Levels 7–11: 2.00%
 * Levels 12–16: 1.00%
 * Levels 17–20: 0.50%
 */
export const DEFAULT_MEMBERSHIP_RULES = {
  1: 10.0,
  2: 5.0,
  3: 2.5,
  4: 2.5,
  5: 2.5,
  6: 2.5,
  7: 2.0,
  8: 2.0,
  9: 2.0,
  10: 2.0,
  11: 2.0,
  12: 1.0,
  13: 1.0,
  14: 1.0,
  15: 1.0,
  16: 1.0,
  17: 0.5,
  18: 0.5,
  19: 0.5,
  20: 0.5,
};

export class MembershipCommissionStrategy extends CommissionStrategy {
  constructor(customRules = null) {
    super('MembershipCommissionStrategy');
    this.rules = customRules || DEFAULT_MEMBERSHIP_RULES;
  }

  /**
   * Returns rate percentage for a given hierarchy level (1-20)
   */
  getCommissionRate(level) {
    if (level < 1 || level > 20) return 0;
    
    // Support key-value map for individual levels 1-20
    if (typeof this.rules === 'object' && !Array.isArray(this.rules)) {
      return this.rules[level] !== undefined ? parseFloat(this.rules[level]) || 0 : 0;
    }

    // Support legacy array format
    if (Array.isArray(this.rules)) {
      const matchedTier = this.rules.find(
        (r) => level >= r.levelMin && level <= r.levelMax
      );
      return matchedTier ? matchedTier.rate : 0;
    }

    return 0;
  }

  /**
   * Get formatted tier label description for reporting & audit
   */
  getTierLabel(level) {
    const rate = this.getCommissionRate(level);
    if (level === 1) return `Level 1 Direct (${rate}%)`;
    if (level === 2) return `Level 2 Indirect (${rate}%)`;
    return `Level ${level} Direct Upline (${rate}%)`;
  }

  /**
   * Get full rule set
   */
  getRules() {
    return this.rules;
  }

  /**
   * Update active rule set dynamically
   */
  setRules(newRules) {
    this.rules = newRules;
  }
}

export default MembershipCommissionStrategy;

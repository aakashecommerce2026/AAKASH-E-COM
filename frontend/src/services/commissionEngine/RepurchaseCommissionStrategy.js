/**
 * RepurchaseCommissionStrategy Module
 * Implements strategy pattern for 20-level Unilevel Repurchase Commission calculation.
 */

export const DEFAULT_REPURCHASE_RULES = {
  1: 1.50,
  2: 0.75,
  3: 0.50,
  4: 0.40,
  5: 0.30,
  6: 0.25,
  7: 0.20,
  8: 0.15,
  9: 0.15,
  10: 0.10,
  11: 0.10,
  12: 0.10,
  13: 0.10,
  14: 0.10,
  15: 0.05,
  16: 0.05,
  17: 0.05,
  18: 0.05,
  19: 0.05,
  20: 0.05,
};

export class RepurchaseCommissionStrategy {
  /**
   * @param {Object} customRules - Map of level -> percentage rate
   */
  constructor(customRules = DEFAULT_REPURCHASE_RULES) {
    this.rules = { ...DEFAULT_REPURCHASE_RULES, ...customRules };
  }

  /**
   * Retrieves commission percentage for given level.
   * @param {number} level
   * @returns {number}
   */
  getCommissionRate(level) {
    return this.rules[level] !== undefined ? this.rules[level] : 0;
  }

  /**
   * Calculates repurchase commission amount for a level based on purchase amount.
   * @param {number} level
   * @param {number} purchaseAmount
   * @returns {number}
   */
  calculateCommission(level, purchaseAmount) {
    const rate = this.getCommissionRate(level);
    if (!rate || rate <= 0 || !purchaseAmount || purchaseAmount <= 0) {
      return 0;
    }
    const rawAmount = (purchaseAmount * rate) / 100;
    return Math.round(rawAmount * 100) / 100;
  }

  /**
   * Returns human readable tier label for level.
   * @param {number} level
   * @returns {string}
   */
  getTierLabel(level) {
    const rate = this.getCommissionRate(level);
    if (level === 1) return `Level 1 Direct Repurchase (${rate}%)`;
    if (level === 2) return `Level 2 Indirect Repurchase (${rate}%)`;
    return `Level ${level} Repurchase Upline (${rate}%)`;
  }
}

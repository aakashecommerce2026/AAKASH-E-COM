/**
 * Base Commission Strategy Class
 * Provides standard interface for all MLM commission strategies (Membership, Repurchase, etc.)
 */
export class CommissionStrategy {
  constructor(name = 'BaseStrategy') {
    this.name = name;
  }

  /**
   * Get commission percentage rate for a specific hierarchy level
   * @param {number} level - 1 to 20
   * @returns {number} Percentage rate (e.g. 10 for 10%)
   */
  getCommissionRate(_level) {
    throw new Error('getCommissionRate() must be implemented by concrete subclass');
  }

  /**
   * Calculate commission amount for a given level and membership payment amount
   * @param {number} level - 1 to 20
   * @param {number} amount - Total payment amount
   * @returns {number} Calculated commission amount
   */
  calculateCommission(level, amount) {
    const rate = this.getCommissionRate(level);
    if (!rate || rate <= 0) return 0;
    return parseFloat(((amount * rate) / 100).toFixed(2));
  }

  /**
   * Return full active strategy configuration rules
   */
  getRules() {
    throw new Error('getRules() must be implemented by concrete subclass');
  }
}

export default CommissionStrategy;

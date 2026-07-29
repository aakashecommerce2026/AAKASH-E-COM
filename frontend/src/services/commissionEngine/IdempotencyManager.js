/**
 * IdempotencyManager Module
 * Ensures commission processing is idempotent and prevents duplicate payouts for the same membership transaction.
 */
export class IdempotencyManager {
  constructor() {
    this.processedTxIds = new Set();
  }

  /**
   * Check if a membership transaction ID has already been processed
   * @param {string} membershipTxId 
   * @returns {boolean}
   */
  isProcessed(membershipTxId) {
    if (!membershipTxId) return false;
    return this.processedTxIds.has(String(membershipTxId));
  }

  /**
   * Register a transaction ID as successfully processed
   * @param {string} membershipTxId 
   */
  markProcessed(membershipTxId) {
    if (membershipTxId) {
      this.processedTxIds.add(String(membershipTxId));
    }
  }

  /**
   * Reset processed records (useful for testing or cache refresh)
   */
  clear() {
    this.processedTxIds.clear();
  }

  /**
   * Import array of existing processed IDs (e.g. from Redux or DB)
   * @param {Array<string>} ids 
   */
  loadExisting(ids = []) {
    ids.forEach((id) => this.processedTxIds.add(String(id)));
  }
}

export const globalIdempotencyManager = new IdempotencyManager();
export default IdempotencyManager;

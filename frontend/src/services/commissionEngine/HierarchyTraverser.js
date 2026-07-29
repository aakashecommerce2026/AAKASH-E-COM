/**
 * HierarchyTraverser Module
 * Responsible for traversing the Unilevel MLM sponsor tree upward along direct upline chain.
 */
export class HierarchyTraverser {
  /**
   * Traverses direct sponsor chain upward starting from the new member.
   * Max 20 levels, stops if sponsorId is null, undefined, or missing.
   *
   * @param {Object|number} newMember - The newly registered member object or ID
   * @param {Array} membersList - Full list of members in the system
   * @param {number} maxLevels - Maximum levels to traverse (default 20)
   * @returns {Array} List of upline steps: [{ level, beneficiaryMember, referrerRelationship }]
   */
  static traverseDirectUpline(newMember, membersList = [], maxLevels = 20) {
    const uplinePath = [];
    if (!newMember || !membersList || membersList.length === 0) {
      return uplinePath;
    }

    const memberMap = new Map();
    membersList.forEach((m) => {
      memberMap.set(String(m.id), m);
    });

    const newMemberObj = typeof newMember === 'object' ? newMember : memberMap.get(String(newMember));
    if (!newMemberObj) return uplinePath;

    let currentSponsorId = newMemberObj.sponsorId;
    let currentLevel = 1;
    const visitedSet = new Set(); // Guard against cyclic loops

    while (currentSponsorId && currentLevel <= maxLevels) {
      const sponsorStrKey = String(currentSponsorId);
      
      // Cycle detection protection
      if (visitedSet.has(sponsorStrKey)) {
        console.warn(`[HierarchyTraverser] Cycle detected at sponsorId ${currentSponsorId}. Stopping traversal.`);
        break;
      }
      visitedSet.add(sponsorStrKey);

      const uplineMember = memberMap.get(sponsorStrKey);
      if (!uplineMember) {
        // Sponsor ID exists but member record not found in system -> stop traversal
        break;
      }

      let relationship = `Level ${currentLevel} Direct Sponsor`;
      if (currentLevel === 2) relationship = `Level 2 Indirect Sponsor`;
      else if (currentLevel > 2) relationship = `Level ${currentLevel} Direct Upline`;

      uplinePath.push({
        level: currentLevel,
        beneficiaryMember: uplineMember,
        referrerRelationship: relationship,
      });

      // Move upward to next sponsor
      currentSponsorId = uplineMember.sponsorId;
      currentLevel += 1;
    }

    return uplinePath;
  }
}

export default HierarchyTraverser;

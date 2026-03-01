/*
 * Simple Content Guard
 * Rejects queries containing obvious red-flag keywords before sending to AI
 */

const BAD_WORDS = [
    "politics", "election", "democrat", "republican", "president", "gaza", "israel",
    "fatwa", "haram", "halal", "shia", "sunni", "jesus", "muhammad", "church", "mosque",
    "gossip", "rumor", "scandal", "leaked", "confession"
];

export const isQuerySafe = (query: string): boolean => {
    const q = query.toLowerCase();
    for (const word of BAD_WORDS) {
        if (q.includes(word)) {
            return false;
        }
    }
    return true;
};

import { CombinationEngine } from "./combination.engine";
import { ScoringEngine } from "./scoring.engine";

export class OptimizerService {
    static async generateOptimalSchedules(userId: string, preferences: any) {
        // TODO: Get available courses and user history
        // TODO: Generate all valid combinations
        const combinations = CombinationEngine.generate([]);
        // TODO: Score and rank combinations
        const scored = ScoringEngine.scoreAll(combinations, preferences);
        return scored;
    }
}

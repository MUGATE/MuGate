/**
 * Normalize portal academic status strings into a small closed set used by eligibility queries.
 */
export type NormalizedAcademicStatus =
    | "Passed"
    | "Transferred"
    | "Registered"
    | "Failed"
    | "Withdrawn"
    | "InProgress"
    | "Unknown";

const PASSED_ALIASES = new Set([
    "passed",
    "pass",
    "p",
    "complete",
    "completed",
    "credit",
    "credited",
    "satisfactory",
]);

const TRANSFERRED_ALIASES = new Set([
    "transferred",
    "transfer",
    "transfer credit",
    "t",
    "eq",
    "equivalent",
]);

const REGISTERED_ALIASES = new Set([
    "registered",
    "register",
    "current",
    "enrolled",
    "in progress",
    "inprogress",
    "ongoing",
]);

const FAILED_ALIASES = new Set(["failed", "fail", "f", "unsatisfactory"]);

const WITHDRAWN_ALIASES = new Set(["withdrawn", "withdraw", "w", "drop", "dropped"]);

export function normalizeAcademicStatus(raw: string | null | undefined): NormalizedAcademicStatus {
    const value = String(raw || "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ");

    if (!value) return "Unknown";
    if (PASSED_ALIASES.has(value)) return "Passed";
    if (TRANSFERRED_ALIASES.has(value)) return "Transferred";
    if (REGISTERED_ALIASES.has(value) || value.includes("progress")) return "Registered";
    if (FAILED_ALIASES.has(value)) return "Failed";
    if (WITHDRAWN_ALIASES.has(value)) return "Withdrawn";

    // Common portal fragments
    if (value.includes("transfer")) return "Transferred";
    if (value.includes("pass") || value.includes("complet")) return "Passed";
    if (value.includes("fail")) return "Failed";
    if (value.includes("withdraw") || value.includes("drop")) return "Withdrawn";
    if (value.includes("regist") || value.includes("enroll")) return "Registered";

    return "Unknown";
}

export function isCompletedStatus(status: string | null | undefined): boolean {
    const n = normalizeAcademicStatus(status);
    return n === "Passed" || n === "Transferred";
}

/** Currently enrolled / in-progress — should not be re-suggested by the scheduler. */
export function isRegisteredOrInProgressStatus(status: string | null | undefined): boolean {
    const n = normalizeAcademicStatus(status);
    return n === "Registered" || n === "InProgress";
}

/**
 * Question Classifier — Determines the nature of a user's question
 * and routes it to the appropriate retrieval strategy.
 */
export enum QuestionType {
    /** University-related academic question → retrieve from knowledge base */
    UNIVERSITY_ACADEMIC = "university_academic",

    /** Personal academic data question → needs student context */
    PERSONAL_ACADEMIC = "personal_academic",

    /** General knowledge that might relate to studying → allow AI general knowledge */
    STUDY_RELATED = "study_related",

    /** Completely off-topic (politics, entertainment, etc.) → refuse */
    OFF_TOPIC = "off_topic",
}

export class ClassifierService {

    // Keywords strongly indicating university-specific questions
    private static UNIVERSITY_KEYWORDS = [
        // Arabic university name variations
        "mu", "maaref", "maarif", "المعارف", "جامعة",
        // Academic structure
        "faculty", "faculties", "department", "departments", "college", "school",
        "program", "programs", "major", "majors", "degree", "degrees",
        "bachelor", "master", "phd", "diploma", "certificate",
        // Courses & academics
        "course", "courses", "class", "classes", "subject", "subjects",
        "curriculum", "syllabus", "prerequisite", "prerequisites",
        "credit", "credits", "gpa", "cgpa", "grade", "grades",
        "semester", "trimester", "quarter", "academic year",
        // Student lifecycle
        "admission", "admissions", "apply", "application", "enroll", "enrollment",
        "registration", "register", "transfer", "withdraw", "withdrawal",
        "graduate", "graduation", "commencement",
        // Financial
        "tuition", "fees", "scholarship", "scholarships", "financial aid",
        "payment", "installment", "discount", "waiver",
        // Campus & facilities
        "campus", "library", "lab", "laboratory", "computer lab",
        "cafeteria", "parking", "building", "room", "hall",
        // Policies & regulations
        "regulation", "regulations", "policy", "policies", "rule", "rules",
        "deadline", "deadlines", "calendar", "academic calendar",
        "probation", "dismissal", "suspension", "appeal",
        // University-specific roles
        "professor", "instructor", "dean", "advisor", "advisor",
        "registrar", "bursar", "provost",
        // Portal & app
        "portal", "ums", "mugate", "muchat", "student portal",
    ];

    // Keywords for personal academic questions (need auth context)
    private static PERSONAL_KEYWORDS = [
        "my", "mine", "i have", "i need", "i took", "i passed", "i failed",
        "my grade", "my gpa", "my schedule", "my courses", "my credits",
        "my history", "my transcript", "remaining credits", "how many credits",
        "am i", "do i", "can i register", "should i take", "what should i",
        "my advisor", "my major", "my degree",
    ];

    // Keywords for study-related general knowledge
    private static STUDY_KEYWORDS = [
        "study", "studying", "learn", "learning", "education", "academic",
        "exam", "exams", "test", "quiz", "assignment", "homework",
        "research", "thesis", "dissertation", "paper", "essay",
        "lecture", "tutorial", "lab report", "presentation",
        "textbook", "reference", "citation", "bibliography",
        "time management", "study tips", "productivity",
        "internship", "career", "resume", "job", "interview",
    ];

    // Off-topic patterns (clearly not related to university/studying)
    private static OFF_TOPIC_PATTERNS = [
        /\b(cook|recipe|food|restaurant|meal)\b/i,
        /\b(movie|film|tv show|netflix|series|anime|manga)\b/i,
        /\b(game|gaming|playstation|xbox|switch|fortnite|minecraft)\b/i,
        /\b(song|singer|artist|album|music|concert)\b/i,
        /\b(football|soccer|basketball|nba|fifa|world cup|match score)\b/i,
        /\b(dating|relationship|crush|love|tinder)\b/i,
        /\b(weather forecast|horoscope|zodiac)\b/i,
        /\b(stock market|crypto|bitcoin|trading|invest)\b/i,
        /\b(tell me a joke|riddle|fun fact|story for me)\b/i,
    ];

    /**
     * Classify a user question into one of the question types.
     * Uses a scoring approach: university-specific keywords take priority.
     */
    static classify(question: string): QuestionType {
        const q = question.toLowerCase().trim();

        // 1. Score university-specific keywords FIRST (highest priority)
        let universityScore = 0;
        for (const keyword of this.UNIVERSITY_KEYWORDS) {
            if (q.includes(keyword.toLowerCase())) {
                universityScore++;
            }
        }

        // 2. Score personal academic keywords
        let personalScore = 0;
        for (const keyword of this.PERSONAL_KEYWORDS) {
            if (q.includes(keyword)) {
                personalScore++;
            }
        }

        // 3. If question has both university AND personal markers,
        //    it's a university question that should search the KB
        //    (e.g., "What GPA do I need to stay in good standing?")
        if (universityScore >= 1) {
            return QuestionType.UNIVERSITY_ACADEMIC;
        }

        // 4. Pure personal questions (no university keywords)
        if (personalScore >= 1) {
            return QuestionType.PERSONAL_ACADEMIC;
        }

        // 5. Check if clearly off-topic
        for (const pattern of this.OFF_TOPIC_PATTERNS) {
            if (pattern.test(q)) {
                return QuestionType.OFF_TOPIC;
            }
        }

        // 4. Check for study-related general questions
        for (const keyword of this.STUDY_KEYWORDS) {
            if (q.includes(keyword)) {
                return QuestionType.STUDY_RELATED;
            }
        }

        // 5. Default: treat as potentially university-related
        // (Better to search the KB and find nothing than to refuse)
        return QuestionType.UNIVERSITY_ACADEMIC;
    }

    /**
     * Get a human-readable description of the classification
     */
    static describe(type: QuestionType): string {
        switch (type) {
            case QuestionType.UNIVERSITY_ACADEMIC:
                return "University/academic question → search knowledge base";
            case QuestionType.PERSONAL_ACADEMIC:
                return "Personal academic question → requires student context";
            case QuestionType.STUDY_RELATED:
                return "Study-related general question → AI general knowledge";
            case QuestionType.OFF_TOPIC:
                return "Off-topic question → controlled refusal";
        }
    }
}

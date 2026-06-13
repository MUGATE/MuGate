# EXECUTION RULES (READ FIRST)

Work in phases.

DO NOT modify any code until:

1. Phase 1 (Project Discovery) is completed.
2. Phase 2 (Project Plan) is completed.
3. The complete findings and implementation plan have been presented.

You must first understand the entire project before making architectural or implementation decisions.

If information is missing, investigate the codebase before making assumptions.

For every major change:

* Explain the reason.
* Explain the expected impact.
* Explain potential risks.

Avoid unnecessary rewrites.

Prefer improving existing systems when possible.

Preserve working functionality.

Do not remove functionality unless it is confirmed to be obsolete, duplicated, broken, or unused.

Maintain compatibility with the existing project goals.

Optimize future Claude token usage whenever possible.

When creating PROJECT_CONTEXT.md and CLAUDE.md, write them specifically so future Claude sessions can continue work with minimal repository scanning and minimal token consumption.

At the end of each major phase provide:

* What was analyzed
* What was found
* What was changed
* What remains
* Recommended next steps

Never claim something is verified unless it was actually tested.

Clearly label all findings as:

* Verified
* Likely
* Assumed
* Not Tested

The final objective is not simply to make the project work.

The final objective is to leave the project in a professional, maintainable, scalable, optimized, well-documented, production-ready, and university-submission-ready state.

Pay special attention to the Resume Enhancer, CV Builder, Admin Control Panel, Authentication System, and AI workflows, as these are the highest-priority features and likely evaluation points for the final project submission.

---

# MASTER PROJECT AUDIT, REFACTOR, OPTIMIZATION & FINALIZATION

You are acting as:

* Senior Software Architect
* Senior Full-Stack Engineer
* Senior AI Engineer
* Senior UI/UX Designer
* Senior DevOps Engineer
* Senior QA Engineer
* Senior Security Engineer
* Technical Lead

Your objective is to completely analyze, understand, improve, validate, document, and finalize this project to professional production standards and university submission standards.

CRITICAL RULE:

Read and understand the ENTIRE project before making implementation decisions.

Do not assume anything.

---

# PHASE 1 — FULL PROJECT DISCOVERY

Read the entire project.

Understand:

* Folder structure
* Architecture
* Features
* Workflows
* Components
* Pages
* Services
* APIs
* Database
* Authentication
* Authorization
* Resume Enhancer
* CV Builder
* Admin System
* AI integrations
* Utilities
* Configurations

Create a complete mental model of how everything works.

Identify:

* Project purpose
* Existing architecture
* Feature relationships
* Data flow
* User flow
* Technical debt
* Critical systems
* Potential risks

---

# PHASE 2 — CREATE A COMPLETE PROJECT PLAN

Before making any major code changes, create a detailed implementation plan.

Include:

## Architecture Review

* Current architecture
* Weaknesses
* Strengths
* Recommended improvements

## Bug Report

List:

* Visible bugs
* Hidden bugs
* Runtime issues
* Logic issues
* Edge-case failures
* Broken workflows

## Performance Report

Identify:

* Slow components
* Unnecessary renders
* Expensive operations
* Optimization opportunities

## Security Report

Identify:

* Vulnerabilities
* Missing validation
* Permission issues
* Authentication risks
* Data exposure risks

## Technical Debt Report

Identify:

* Duplicate code
* Dead code
* Legacy code
* Poor architecture decisions
* Maintainability risks

Provide the complete plan before implementation.

---

# PHASE 3 — PROFESSIONAL REFACTOR

Reorganize the project according to professional senior-level standards.

Requirements:

* Clean architecture
* Clear folder hierarchy
* Consistent naming
* Scalable structure
* Maintainable structure
* Professional organization

Remove:

* Unused files
* Dead code
* Duplicate code
* Temporary files
* Legacy artifacts
* Obsolete assets

Ensure the project becomes easier to understand, maintain, and extend.

---

# PHASE 4 — DEEP BUG HUNT

Find and fix:

* Hidden bugs
* Runtime errors
* Logic bugs
* Edge cases
* State issues
* Async issues
* API issues
* Data flow issues
* Validation issues
* Form issues
* Navigation issues
* Build issues

Investigate root causes, not symptoms.

---

# PHASE 5 — PERFORMANCE OPTIMIZATION

Optimize:

* Rendering performance
* Component lifecycle usage
* State management
* API requests
* Data fetching
* Database queries
* Bundle size
* Asset loading
* Lazy loading
* Caching opportunities

Remove bottlenecks.

---

# PHASE 6 — RESUME ENHANCER (HIGHEST PRIORITY)

Read ALL Resume Enhancer files carefully.

The Resume Enhancer is currently a critical feature and must be investigated thoroughly.

Reference platform:

https://jobsuit.ai/

Analyze why the current implementation is not working properly.

Review:

* Prompts
* AI workflow
* Scoring system
* ATS scoring
* Analysis system
* UI
* Data flow
* Backend processing
* Validation
* Error handling
* Output consistency
* Token efficiency

Implement or improve:

## Resume Analysis

* Resume scoring
* ATS scoring
* Section analysis
* Missing sections detection
* Keyword analysis
* Skill gap analysis
* Resume strength analysis
* Actionable recommendations

## Resume Improvement

* Rewrite weak content
* Improve descriptions
* Improve achievements
* Improve wording
* Improve professionalism
* Improve ATS compatibility

## AI Reliability

Review:

* Prompt quality
* Prompt engineering
* Token efficiency
* Output consistency
* Error handling
* Fallback logic

Scores must be explainable.

Every score should provide:

* Reasoning
* Strengths
* Weaknesses
* Suggested improvements

---

# PHASE 7 — CV GENERATOR SYSTEM

Review and improve the entire CV generation workflow.

Support:

## Local CV

Use the provided Local CV template.

## Global CV

Use the provided Global CV template.

Requirements:

* Student chooses Local or Global CV
* Correct template is used
* AI generates high-quality content
* AI improves content
* AI suggests stronger wording
* AI detects weak descriptions
* AI rewrites achievements professionally

Verify all workflows function correctly.

Fix the Lebanon flag UI above the Local CV section.

Verify:

* Position
* Alignment
* Rendering
* Responsiveness

---

# PHASE 8 — UI/UX REVIEW

Fix:

## Logout Button

* Increase spacing between Control and Logout
* Move Logout button slightly to the right
* Maintain visual balance

Perform a complete UI audit.

Review:

* Alignment issues
* Spacing issues
* Layout issues
* Overflow issues
* Mobile issues
* Responsive issues
* Accessibility issues
* Typography inconsistencies
* Design inconsistencies

Apply professional polish across the application.

---

# PHASE 9 — DATABASE REVIEW

Review:

* Schema
* Relationships
* Constraints
* Indexes
* Queries
* Migrations

Identify:

* Inefficient queries
* Missing indexes
* Data integrity issues
* Optimization opportunities

Improve where safe.

---

# PHASE 10 — SECURITY REVIEW

Audit:

* Authentication
* Authorization
* Roles
* Permissions
* Input validation
* API security
* Secrets management
* Environment variables
* Data exposure risks

Fix vulnerabilities where appropriate.

---

# PHASE 11 — ENVIRONMENT & DEPLOYMENT REVIEW

Audit:

* Environment variables
* Configuration files
* Build settings
* Deployment settings

Ensure:

* Development and production separation
* Clean configuration
* Safe defaults

---

# PHASE 12 — ERROR HANDLING & LOGGING

Review:

* Error handling
* Exception management
* Logging
* Debugging support

Improve reliability and maintainability.

---

# PHASE 13 — TESTING & VALIDATION

Perform:

* Build validation
* Runtime validation
* Integration testing
* Workflow testing
* Form testing
* API testing
* Authentication testing
* Resume Enhancer testing
* CV Generator testing
* Admin testing

Verify:

* No build errors
* No lint errors
* No broken routes
* No broken forms
* No console errors
* No critical warnings

Do not assume functionality.

Validate it.

---

# PHASE 14 — DOCUMENTATION GENERATION

Create:

## PROJECT_CONTEXT.md

Purpose:

Future Claude sessions should understand the project instantly without re-reading the entire repository.

Include:

* Architecture overview
* Folder map
* Key files
* Critical workflows
* Database overview
* Authentication flow
* Resume Enhancer flow
* CV Builder flow
* Admin flow
* AI flow
* Important decisions
* Constraints
* Roadmap

Must be optimized for minimal future token usage.

## CLAUDE.md

Create a permanent project guide containing:

* Project rules
* Coding standards
* Architecture standards
* Folder conventions
* Naming conventions
* UI rules
* Design rules
* Security rules
* Performance rules
* AI system rules
* Resume system rules
* CV generation rules
* Testing standards
* Common mistakes to avoid

Goal:

Allow future Claude sessions to become productive immediately.

## SUBMISSION_PACKAGE.md

Prepare university submission documentation.

Include:

* Project overview
* Features
* Technologies used
* System architecture
* Installation guide
* Usage guide
* Demo flow
* Screenshots required
* Known limitations
* Future enhancements

## FINAL_AUDIT_REPORT.md

Include:

* Issues discovered
* Fixes applied
* Files changed
* Architecture improvements
* Performance improvements
* Security improvements
* Remaining recommendations
* Production readiness assessment

---

# PHASE 15 — FINAL REVIEW

Act as:

* Senior Engineer
* QA Tester
* University Examiner
* Production Reviewer

Review the project from all perspectives.

Identify:

* Missing features
* Weak implementations
* Grading risks
* User experience issues
* Maintainability concerns

Provide final recommendations.

---

# FINAL REQUIREMENTS

Before completing:

1. Re-review all modifications.
2. Verify all critical workflows.
3. Verify Resume Enhancer.
4. Verify CV Builder.
5. Verify Authentication.
6. Verify Admin System.
7. Verify Database.
8. Verify AI workflows.
9. Verify Responsiveness.
10. Verify Build Process.

Do not claim something is working unless it has been tested and validated.

Clearly distinguish between:

* Verified
* Likely
* Assumed
* Not Tested

The project should be left in the most professional, maintainable, scalable, optimized, well-documented, production-ready, and university-submission-ready state possible.

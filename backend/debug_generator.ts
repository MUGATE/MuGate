import { pool } from './src/core/database/connection';
import { GeneratorService } from './src/modules/generator/generator.service';

async function run() {
    await pool.connect();
    const userId = '87288CA2-B987-43EE-85BC-742F30D34F3B';

    const eligibleCourses = await GeneratorService.getEligibleCourses(userId);
    const semesterId = 38;
    const schedules = await GeneratorService.generateSchedules(userId, semesterId, { maxCredits: 18 });

    require('fs').writeFileSync('debug_out.json', JSON.stringify({
        eligibleCodes: eligibleCourses.map(c => ({
            title: c.courseTitle,
            code: c.courseCode,
            type: c.type,
            category: c.category,
            placeholder: !!c.isElectivePlaceholder,
            allowedCodes: c.allowedCodes || null
        })),
        schedulesMeta: { found: schedules.offeringsFound, eligible: schedules.eligibleCount }
    }, null, 2));

    process.exit(0);
}

run().catch(e => {
    console.error(e);
    process.exit(1);
});

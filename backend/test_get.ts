import { pool } from "./src/core/database/connection";
import { SchedulesService } from "./src/modules/schedules/schedules.service";

async function run() {
    await pool.connect();
    try {
        const userId = '87288CA2-B987-43EE-85BC-742F30D34F3B';
        console.log("Testing GET schedules...");
        const result = await SchedulesService.getSavedSchedules(userId);
        console.log(JSON.stringify(result, null, 2));
    } catch (e: any) {
        console.error("Crash: ", e.message);
    }
    process.exit(0);
}

run();

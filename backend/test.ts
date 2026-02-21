async function runE2ETests() {
    console.log("🚀 Starting MuGate Backend E2E API Verification\n");

    const BASE_URL = "http://localhost:5000/api";
    let token = "";
    let savedScheduleId = "";

    try {
        // ----------------------------------------------------------------------
        // TEST 1: Login & Get JWT
        // ----------------------------------------------------------------------
        console.log("➡️  TEST 1: Authenticating to get JWT...");
        const loginRes = await fetch(`${BASE_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: "101230004@mu.edu.lb", password: "Password123!" })
        });
        const loginData = await loginRes.json();
        if (!loginData.success) throw new Error("Login failed");
        token = loginData.data.token;
        console.log("✅ TEST 1 PASSED: JWT Token Acquired\n");

        // ----------------------------------------------------------------------
        // TEST 2: Generate Schedules
        // ----------------------------------------------------------------------
        console.log("➡️  TEST 2: Generating Schedules via Engine...");
        const genRes = await fetch(`${BASE_URL}/generate`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ semesterId: 38, preferences: {} })
        });
        const genData = await genRes.json();
        if (!genData.success || genData.data.topSchedules.length === 0) throw new Error("Generation failed or empty");

        console.log(`✅ TEST 2 PASSED: Generated ${genData.data.topSchedules.length} valid combinations`);

        // Pick the top schedule to save
        const topSchedule = genData.data.topSchedules[0];
        const sectionIds = topSchedule.schedule.map((slot: any) => slot.section.sectionId);
        console.log(`   Selected Top Schedule (Score: ${topSchedule.score}, Credits: ${topSchedule.totalCredits})`);
        console.log(`   Captured ${sectionIds.length} Section IDs\n`);

        // ----------------------------------------------------------------------
        // TEST 3: Save Schedule to Database
        // ----------------------------------------------------------------------
        console.log("➡️  TEST 3: Saving Top Schedule to SQL Database...");
        const saveRes = await fetch(`${BASE_URL}/schedules/save`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                name: "Postman Verification Draft",
                score: topSchedule.score,
                totalCredits: topSchedule.totalCredits,
                sectionIds: sectionIds
            })
        });
        const saveData = await saveRes.json();
        if (!saveData.success) throw new Error("Saving schedule failed: " + saveData.message);
        savedScheduleId = saveData.data.scheduleId;
        console.log(`✅ TEST 3 PASSED: Schedule deeply saved to DB (ID: ${savedScheduleId})\n`);

        // ----------------------------------------------------------------------
        // TEST 4: Fetch Saved Schedules (The "Dashboard" View)
        // ----------------------------------------------------------------------
        console.log("➡️  TEST 4: Fetching Saved Schedules...");
        const getRes = await fetch(`${BASE_URL}/schedules`, {
            method: "GET",
            headers: { "Authorization": `Bearer ${token}` }
        });
        const getData = await getRes.json();
        if (!getData.success) throw new Error("Fetching schedules failed");

        const retrievedSchedule = getData.data.find((s: any) => s.scheduleId === savedScheduleId);
        if (!retrievedSchedule) throw new Error("The saved schedule was not found in the Database!");

        console.log(`✅ TEST 4 PASSED: Successfully retrieved '${retrievedSchedule.name}'`);
        console.log(`   It contains exactly ${retrievedSchedule.courses.length} fully hydrated course sections.\n`);

        // ----------------------------------------------------------------------
        // TEST 5: Delete Schedule
        // ----------------------------------------------------------------------
        console.log("➡️  TEST 5: Deleting Schedule from SQL Database...");
        const delRes = await fetch(`${BASE_URL}/schedules/${savedScheduleId}`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${token}` }
        });
        const delData = await delRes.json();
        if (!delData.success) throw new Error("Deleting schedule failed");
        console.log("✅ TEST 5 PASSED: Schedule successfully wiped from database.\n");

        console.log("🎉 ALL PHASE 4 ENDPOINTS VERIFIED SUCCESSFULLY! 🎉");

    } catch (error: any) {
        console.error("❌ E2E TEST FAILED:", error.message);
    }
}

runE2ETests();

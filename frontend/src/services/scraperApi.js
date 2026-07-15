import { apiFetch } from "../utils/api";

export async function getKbStats() {
    const data = await apiFetch("/scraper/university/stats");
    return data.data;
}

export async function getScraperStatus() {
    const data = await apiFetch("/scraper/university/status");
    return data;
}

export async function getScraperRuns(limit = 10) {
    const data = await apiFetch(`/scraper/university/runs?limit=${limit}`);
    return data.data;
}

export async function startFullCrawl(config = {}) {
    return apiFetch("/scraper/university/crawl", {
        method: "POST",
        body: JSON.stringify(config),
    });
}

export async function startIncrementalSync(maxAgeHours = 24) {
    return apiFetch("/scraper/university/sync", {
        method: "POST",
        body: JSON.stringify({ maxAgeHours }),
    });
}

export async function startRescrape(config = {}) {
    return apiFetch("/scraper/university/rescrape", {
        method: "POST",
        body: JSON.stringify(config),
    });
}

export async function reindexVectors() {
    return apiFetch("/scraper/university/reindex", { method: "POST" });
}

export async function refreshSitemap() {
    return apiFetch("/scraper/university/sitemap-refresh", { method: "POST" });
}

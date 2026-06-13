export const TYPE_COLORS = {
  workshop: "#e6a817",
  competition: "#d94a4a",
  hackathon: "#d94a4a",
  talk: "#4a90d9",
  meetup: "#48c6a0",
};

export const TYPE_LABELS = {
  workshop: "Workshop",
  competition: "Competition",
  hackathon: "Hackathon",
  talk: "Talk / Conference",
  meetup: "Networking / Meetup",
};

export const FILTER_OPTIONS = ["all", "workshop", "competition", "talk", "meetup"];

export const SOURCE_FILTER_OPTIONS = ["all", "university", "eventbrite", "zaka"];

export const formatDate = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

export const getDaysUntil = (dateStr) => {
  if (!dateStr) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + "T00:00:00");
  const diff = Math.ceil((target - now) / (1000 * 60 * 60 * 24));
  return diff;
};

export const isThisWeek = (dateStr) => {
  const days = getDaysUntil(dateStr);
  return days !== null && days >= 0 && days <= 7;
};

export const mapBackendEvent = (ev) => {
  const startStr = ev.startDate ? new Date(ev.startDate).toISOString().split("T")[0] : "";
  const endStr = ev.endDate ? new Date(ev.endDate).toISOString().split("T")[0] : "";
  const timeStr = ev.startDate
    ? new Date(ev.startDate).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
    : "";

  const categoryToType = {
    workshop: "workshop", hackathon: "hackathon", competition: "competition",
    talk: "talk", conference: "talk", meetup: "meetup", social: "meetup", other: "workshop",
  };

  const sourceLabels = {
    eventbrite: "Eventbrite", facebook: "Facebook", linkedin: "LinkedIn",
    meetup: "Meetup", instagram: "Instagram", university: "University", zaka: "Zaka AI", other: "Web",
  };

  const rawSource = ev.scraperSource || "other";
  return {
    id: String(ev.id),
    title: ev.title,
    type: categoryToType[ev.category] || "workshop",
    date: startStr,
    endDate: endStr || undefined,
    time: timeStr,
    location: ev.location || "Lebanon",
    description: ev.description || "",
    source: sourceLabels[rawSource] || rawSource,
    rawSource: rawSource,
    eventSource: ev.source || "scraped",
    tags: ev.tags ? ev.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
    isFree: ev.isFree ?? true,
    imageUrl: ev.imageUrl || "",
    registrationUrl: ev.externalUrl || "",
  };
};

const UNSPLASH_IMAGES = [
  "photo-1504384308090-c894fdcc538d",
  "photo-1540575467063-178a50c2df87",
  "photo-1519389950473-47ba0277781c",
  "photo-1522071820081-009f0129c71c",
  "photo-1505373877841-8d25f7d46678",
  "photo-1517694712202-14dd9538aa97",
  "photo-1550751827-4bd374c3f58b",
  "photo-1552664730-d307ca884978",
  "photo-1451187580459-43490279c0fa",
  "photo-1498050108023-c5249f4df085",
  "photo-1461749280684-dccba630e2f6",
  "photo-1526374965328-7f61d4dc18c5",
  "photo-1518432031352-d6fc5c10da5a",
  "photo-1531482615719-2afd82697983",
  "photo-1573164713714-d95e436ab8d6",
  "photo-1517245386807-bb43f82c33c4",
  "photo-1523580494863-6f3031224c94",
  "photo-1558494949-ef010cbdcc31",
  "photo-1531746790095-e5cb15763bcf",
  "photo-1488590528505-98d2b5aba04b",
  "photo-1504639725590-34d0984388bd",
  "photo-1516321165247-4aa6a5d403f1",
  "photo-1551033406-611cf9a28f67",
  "photo-1507721999472-8ed44223c192",
  "photo-1579829366248-204fe8413f31",
  "photo-1434030216411-0b793f4b4173",
  "photo-1516321318423-f06f85e504b3",
  "photo-1521791136064-7986c2920216",
  "photo-1485827404703-89b55fcc595e",
  "photo-1535378917042-10a22c95931a",
];

export const getUniqueEventImage = (event) => {
  if (event.imageUrl) return event.imageUrl;
  let hash = 0;
  for (let i = 0; i < event.title.length; i++) {
    hash = ((hash << 5) - hash) + event.title.charCodeAt(i);
    hash = hash & hash;
  }
  const idx = Math.abs(hash) % UNSPLASH_IMAGES.length;
  return `https://images.unsplash.com/${UNSPLASH_IMAGES[idx]}?w=600&h=400&fit=crop`;
};

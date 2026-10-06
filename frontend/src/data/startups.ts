// Sample data for the prototype. Every company, person and investor here is
// fictional. The backend (reach + marketing) will replace this with live data.

export type Region = "India" | "USA" | "Europe" | "Remote";
export type Round = "Pre-seed" | "Seed" | "Series A" | "Series B" | "Series C";
export type RemotePolicy = "Remote" | "Hybrid" | "Onsite";
export type PersonKind = "Founder" | "Engineering manager" | "Recruiter" | "Engineer";

export interface FundingEvent {
  round: Round;
  date: string; // ISO
  amountUsd: number;
}

export interface CultureSignal {
  label: string;
  positive: boolean;
  source: string;
}

export interface OpenRole {
  title: string;
  team: string;
  skills: string[];
}

export interface Person {
  id: string;
  companyId: string;
  name: string;
  title: string;
  kind: PersonKind;
  degree: 1 | 2 | 3;
  mutuals: number;
  school: string;
  pastEmployers: string[];
  recentlyActive: boolean;
  email: string; // pattern guess, verified by the backend later
}

export interface Startup {
  id: string;
  name: string;
  tagline: string;
  sector: string;
  city: string;
  country: string;
  region: Region;
  remote: RemotePolicy;
  round: Round;
  amountUsd: number;
  announced: string; // ISO
  investors: string[];
  history: FundingEvent[];
  headcount: number;
  headcountGrowth: number; // % over 6 months
  founded: number;
  culture: number; // 0–100
  signals: CultureSignal[];
  roles: OpenRole[];
  people: Person[];
  domain: string;
}

const TODAY = new Date("2026-10-06T00:00:00Z");
const daysAgo = (n: number) => new Date(TODAY.getTime() - n * 86_400_000).toISOString().slice(0, 10);

let personSeq = 0;
function person(
  companyId: string,
  domain: string,
  name: string,
  title: string,
  kind: PersonKind,
  degree: 1 | 2 | 3,
  mutuals: number,
  school: string,
  pastEmployers: string[],
  recentlyActive = false,
): Person {
  personSeq += 1;
  return {
    id: `p${personSeq}`,
    companyId,
    name,
    title,
    kind,
    degree,
    mutuals,
    school,
    pastEmployers,
    recentlyActive,
    email: `${name.split(" ")[0].toLowerCase()}@${domain}`,
  };
}

type Seed = Omit<Startup, "people" | "domain"> & {
  people: (companyId: string, domain: string) => Person[];
};

const SEEDS: Seed[] = [
  {
    id: "ledgerloop",
    name: "LedgerLoop",
    tagline: "Automated reconciliation for Indian SMB finance teams",
    sector: "Fintech",
    city: "Hyderabad",
    country: "India",
    region: "India",
    remote: "Hybrid",
    round: "Series A",
    amountUsd: 14_000_000,
    announced: daysAgo(6),
    investors: ["Deccan Seed Partners", "Kestrel Capital"],
    history: [
      { round: "Pre-seed", date: "2024-03-12", amountUsd: 600_000 },
      { round: "Seed", date: "2025-02-20", amountUsd: 3_500_000 },
      { round: "Series A", date: daysAgo(6), amountUsd: 14_000_000 },
    ],
    headcount: 64,
    headcountGrowth: 38,
    founded: 2023,
    culture: 84,
    signals: [
      { label: "2 remote days a week, flexible hours", positive: true, source: "Careers page" },
      { label: "Engineering blog posts every month", positive: true, source: "Company blog" },
      { label: "Founders reply to candidates on X", positive: true, source: "X / Twitter" },
      { label: "On-call rotation mentioned as heavy", positive: false, source: "Reddit r/developersIndia" },
    ],
    roles: [
      { title: "Senior Backend Engineer", team: "Platform", skills: ["Go", "PostgreSQL", "Kafka", "AWS"] },
      { title: "Full Stack Engineer", team: "Product", skills: ["React", "TypeScript", "Node.js"] },
    ],
    people: (c, d) => [
      person(c, d, "Ananya Reddy", "Co-founder & CTO", "Founder", 2, 14, "IIT Hyderabad", ["Microsoft"], true),
      person(c, d, "Rahul Varma", "Engineering Manager", "Engineering manager", 2, 9, "JNTU Hyderabad", ["Amazon", "Razorpay"], true),
      person(c, d, "Sneha Kulkarni", "Talent Partner", "Recruiter", 3, 3, "University of Hyderabad", ["Infosys"]),
      person(c, d, "Karthik Rao", "Senior Software Engineer", "Engineer", 1, 22, "BITS Pilani", ["Microsoft"], true),
    ],
  },
  {
    id: "medisight",
    name: "Medisight AI",
    tagline: "Radiology triage models for tier-2 hospitals",
    sector: "Health AI",
    city: "Hyderabad",
    country: "India",
    region: "India",
    remote: "Onsite",
    round: "Seed",
    amountUsd: 4_200_000,
    announced: daysAgo(12),
    investors: ["Monsoon Ventures", "Halcyon Fund"],
    history: [
      { round: "Pre-seed", date: "2025-06-02", amountUsd: 750_000 },
      { round: "Seed", date: daysAgo(12), amountUsd: 4_200_000 },
    ],
    headcount: 22,
    headcountGrowth: 57,
    founded: 2024,
    culture: 71,
    signals: [
      { label: "Clinical impact is front and centre", positive: true, source: "Careers page" },
      { label: "Learning budget ₹1L per year", positive: true, source: "Careers page" },
      { label: "Fully onsite in Gachibowli", positive: false, source: "Job descriptions" },
    ],
    roles: [
      { title: "ML Engineer", team: "Models", skills: ["Python", "PyTorch", "MLOps", "Docker"] },
      { title: "Backend Engineer", team: "Platform", skills: ["Python", "FastAPI", "PostgreSQL"] },
    ],
    people: (c, d) => [
      person(c, d, "Dr. Vikram Shetty", "Founder & CEO", "Founder", 3, 2, "AIIMS Delhi", ["GE Healthcare"]),
      person(c, d, "Priya Nair", "Head of Engineering", "Engineering manager", 2, 6, "IIIT Hyderabad", ["Google"], true),
      person(c, d, "Arjun Mehta", "ML Engineer", "Engineer", 2, 11, "IIT Hyderabad", ["Microsoft"], true),
    ],
  },
  {
    id: "kirana-stack",
    name: "KiranaStack",
    tagline: "Inventory + credit OS for neighbourhood stores",
    sector: "Retail tech",
    city: "Hyderabad",
    country: "India",
    region: "India",
    remote: "Remote",
    round: "Seed",
    amountUsd: 2_800_000,
    announced: daysAgo(33),
    investors: ["Indigo Peak", "Lumen Seed Fund"],
    history: [{ round: "Seed", date: daysAgo(33), amountUsd: 2_800_000 }],
    headcount: 18,
    headcountGrowth: 29,
    founded: 2025,
    culture: 79,
    signals: [
      { label: "Remote-first across India", positive: true, source: "Careers page" },
      { label: "Quarterly offsites in Hyderabad", positive: true, source: "LinkedIn posts" },
      { label: "Below-market cash, higher ESOPs", positive: false, source: "Job descriptions" },
    ],
    roles: [
      { title: "Android Engineer", team: "Mobile", skills: ["Kotlin", "Android", "Jetpack Compose"] },
      { title: "Frontend Engineer", team: "Web", skills: ["React", "TypeScript", "Tailwind"] },
    ],
    people: (c, d) => [
      person(c, d, "Farhan Ali", "Co-founder", "Founder", 2, 8, "Osmania University", ["Flipkart"], true),
      person(c, d, "Lakshmi Iyer", "Engineering Lead", "Engineering manager", 2, 5, "NIT Warangal", ["Swiggy", "TCS"]),
      person(c, d, "Nikhil Goud", "Frontend Engineer", "Engineer", 1, 17, "JNTU Hyderabad", ["Infosys"], true),
    ],
  },
  {
    id: "orbitops",
    name: "OrbitOps",
    tagline: "Observability for satellite ground stations",
    sector: "Space infra",
    city: "Bengaluru",
    country: "India",
    region: "India",
    remote: "Hybrid",
    round: "Series A",
    amountUsd: 18_500_000,
    announced: daysAgo(9),
    investors: ["Arcfield Partners", "Northbeam Ventures"],
    history: [
      { round: "Seed", date: "2025-01-15", amountUsd: 5_000_000 },
      { round: "Series A", date: daysAgo(9), amountUsd: 18_500_000 },
    ],
    headcount: 48,
    headcountGrowth: 41,
    founded: 2023,
    culture: 82,
    signals: [
      { label: "Open-source core with public roadmap", positive: true, source: "GitHub" },
      { label: "No-meeting Wednesdays", positive: true, source: "Engineering blog" },
      { label: "Hardware lab requires 3 days onsite", positive: false, source: "Job descriptions" },
    ],
    roles: [
      { title: "Site Reliability Engineer", team: "Infra", skills: ["Kubernetes", "Go", "Prometheus", "Terraform"] },
      { title: "Senior Frontend Engineer", team: "Console", skills: ["React", "TypeScript", "D3"] },
    ],
    people: (c, d) => [
      person(c, d, "Meera Krishnan", "CEO", "Founder", 3, 4, "IISc Bangalore", ["ISRO"]),
      person(c, d, "Siddharth Jain", "VP Engineering", "Engineering manager", 2, 12, "IIT Bombay", ["Google", "Atlassian"], true),
      person(c, d, "Divya Prakash", "Technical Recruiter", "Recruiter", 2, 7, "Christ University", ["Amazon"], true),
      person(c, d, "Rohan Das", "SRE", "Engineer", 2, 10, "BITS Pilani", ["Amazon"]),
    ],
  },
  {
    id: "vernacular",
    name: "Vernac",
    tagline: "Voice AI agents for Indian languages",
    sector: "AI",
    city: "Bengaluru",
    country: "India",
    region: "India",
    remote: "Remote",
    round: "Series B",
    amountUsd: 32_000_000,
    announced: daysAgo(20),
    investors: ["Banyan Growth", "Kestrel Capital", "Monsoon Ventures"],
    history: [
      { round: "Seed", date: "2023-08-10", amountUsd: 3_000_000 },
      { round: "Series A", date: "2024-11-04", amountUsd: 12_000_000 },
      { round: "Series B", date: daysAgo(20), amountUsd: 32_000_000 },
    ],
    headcount: 120,
    headcountGrowth: 33,
    founded: 2022,
    culture: 76,
    signals: [
      { label: "Remote with Bengaluru hub", positive: true, source: "Careers page" },
      { label: "Publishes model evals openly", positive: true, source: "Company blog" },
      { label: "Fast pace, frequent re-orgs", positive: false, source: "Glassdoor-style forum posts" },
    ],
    roles: [
      { title: "Applied ML Engineer", team: "Speech", skills: ["Python", "PyTorch", "LLM", "Speech"] },
      { title: "Backend Engineer", team: "Platform", skills: ["Python", "Go", "Kubernetes"] },
    ],
    people: (c, d) => [
      person(c, d, "Aditya Bhat", "Co-founder & CTO", "Founder", 3, 6, "IIT Madras", ["Google"]),
      person(c, d, "Pooja Hegde", "Engineering Manager, Speech", "Engineering manager", 2, 15, "IIT Hyderabad", ["Microsoft"], true),
      person(c, d, "Imran Shaikh", "Senior ML Engineer", "Engineer", 1, 19, "NIT Warangal", ["Amazon"], true),
    ],
  },
  {
    id: "carbonbook",
    name: "CarbonBook",
    tagline: "Scope 3 emissions accounting for exporters",
    sector: "Climate",
    city: "Bengaluru",
    country: "India",
    region: "India",
    remote: "Hybrid",
    round: "Seed",
    amountUsd: 5_500_000,
    announced: daysAgo(47),
    investors: ["Saltwater VC", "Halcyon Fund"],
    history: [{ round: "Seed", date: daysAgo(47), amountUsd: 5_500_000 }],
    headcount: 26,
    headcountGrowth: 24,
    founded: 2024,
    culture: 80,
    signals: [
      { label: "Mission-driven, B-Corp pending", positive: true, source: "Company site" },
      { label: "4-day work week trial", positive: true, source: "LinkedIn posts" },
    ],
    roles: [{ title: "Data Engineer", team: "Data", skills: ["Python", "SQL", "dbt", "Airflow"] }],
    people: (c, d) => [
      person(c, d, "Neha Sharma", "Founder", "Founder", 2, 5, "IIM Bangalore", ["McKinsey"], true),
      person(c, d, "Varun Reddy", "Lead Data Engineer", "Engineer", 2, 9, "IIIT Hyderabad", ["Infosys", "Walmart Labs"]),
    ],
  },
  {
    id: "tollgate",
    name: "Tollgate",
    tagline: "API security testing for fintechs",
    sector: "Security",
    city: "Pune",
    country: "India",
    region: "India",
    remote: "Remote",
    round: "Seed",
    amountUsd: 3_100_000,
    announced: daysAgo(58),
    investors: ["Lumen Seed Fund"],
    history: [{ round: "Seed", date: daysAgo(58), amountUsd: 3_100_000 }],
    headcount: 15,
    headcountGrowth: 50,
    founded: 2025,
    culture: 74,
    signals: [
      { label: "Fully remote, async-first", positive: true, source: "Careers page" },
      { label: "Small team, broad scope", positive: true, source: "Job descriptions" },
    ],
    roles: [{ title: "Security Engineer", team: "Core", skills: ["Rust", "Go", "Security"] }],
    people: (c, d) => [
      person(c, d, "Omkar Patil", "Co-founder", "Founder", 2, 4, "COEP Pune", ["Persistent Systems"]),
      person(c, d, "Ritika Joshi", "Founding Engineer", "Engineer", 2, 6, "BITS Pilani", ["Microsoft"], true),
    ],
  },
  {
    id: "paisaplan",
    name: "PaisaPlan",
    tagline: "Goal-based investing for first-time earners",
    sector: "Fintech",
    city: "Mumbai",
    country: "India",
    region: "India",
    remote: "Hybrid",
    round: "Series A",
    amountUsd: 11_000_000,
    announced: daysAgo(71),
    investors: ["Indigo Peak", "Banyan Growth"],
    history: [
      { round: "Seed", date: "2025-04-01", amountUsd: 2_400_000 },
      { round: "Series A", date: daysAgo(71), amountUsd: 11_000_000 },
    ],
    headcount: 55,
    headcountGrowth: 18,
    founded: 2024,
    culture: 68,
    signals: [
      { label: "Strong parental leave policy", positive: true, source: "Careers page" },
      { label: "Long hours around launches", positive: false, source: "Reddit r/IndianWorkplace" },
    ],
    roles: [{ title: "iOS Engineer", team: "Mobile", skills: ["Swift", "iOS", "SwiftUI"] }],
    people: (c, d) => [
      person(c, d, "Kabir Malhotra", "CEO", "Founder", 3, 2, "IIT Bombay", ["Zerodha"]),
      person(c, d, "Ishita Desai", "Recruiting Lead", "Recruiter", 2, 8, "Mumbai University", ["TCS"], true),
    ],
  },
  {
    id: "routewise",
    name: "Routewise",
    tagline: "Dispatch optimisation for last-mile fleets",
    sector: "Logistics",
    city: "Gurugram",
    country: "India",
    region: "India",
    remote: "Onsite",
    round: "Series A",
    amountUsd: 9_000_000,
    announced: daysAgo(84),
    investors: ["Arcfield Partners"],
    history: [
      { round: "Seed", date: "2025-03-11", amountUsd: 2_000_000 },
      { round: "Series A", date: daysAgo(84), amountUsd: 9_000_000 },
    ],
    headcount: 70,
    headcountGrowth: 12,
    founded: 2023,
    culture: 58,
    signals: [
      { label: "Hard optimisation problems", positive: true, source: "Engineering blog" },
      { label: "5 days onsite", positive: false, source: "Job descriptions" },
      { label: "High attrition last year", positive: false, source: "LinkedIn headcount trend" },
    ],
    roles: [{ title: "Backend Engineer", team: "Routing", skills: ["Java", "Spring", "PostgreSQL"] }],
    people: (c, d) => [
      person(c, d, "Ankit Gupta", "CTO", "Founder", 3, 3, "DTU Delhi", ["Delhivery"]),
      person(c, d, "Sana Khan", "Engineering Manager", "Engineering manager", 2, 4, "IIIT Delhi", ["Amazon"]),
    ],
  },
  {
    id: "quillbase",
    name: "Quillbase",
    tagline: "Docs-as-code platform for API companies",
    sector: "Dev tools",
    city: "San Francisco",
    country: "USA",
    region: "USA",
    remote: "Remote",
    round: "Series A",
    amountUsd: 22_000_000,
    announced: daysAgo(4),
    investors: ["Northbeam Ventures", "Foundry Row"],
    history: [
      { round: "Seed", date: "2024-09-18", amountUsd: 4_500_000 },
      { round: "Series A", date: daysAgo(4), amountUsd: 22_000_000 },
    ],
    headcount: 38,
    headcountGrowth: 46,
    founded: 2023,
    culture: 88,
    signals: [
      { label: "Remote across US + India time zones", positive: true, source: "Careers page" },
      { label: "Public handbook and salary bands", positive: true, source: "Company handbook" },
      { label: "Hires internationally via EOR", positive: true, source: "Job descriptions" },
    ],
    roles: [
      { title: "Senior Full Stack Engineer", team: "Editor", skills: ["React", "TypeScript", "Node.js", "PostgreSQL"] },
      { title: "Developer Advocate", team: "DevRel", skills: ["Writing", "APIs", "JavaScript"] },
    ],
    people: (c, d) => [
      person(c, d, "Maya Chen", "Co-founder & CEO", "Founder", 3, 2, "Stanford University", ["Stripe"]),
      person(c, d, "Daniel Okafor", "Head of Engineering", "Engineering manager", 2, 7, "Georgia Tech", ["GitHub"], true),
      person(c, d, "Sai Teja Pothula", "Software Engineer", "Engineer", 1, 25, "JNTU Hyderabad", ["Microsoft"], true),
      person(c, d, "Hannah Brooks", "Recruiter", "Recruiter", 2, 5, "UC Berkeley", ["Google"]),
    ],
  },
  {
    id: "helio-grid",
    name: "HelioGrid",
    tagline: "Software for community solar operators",
    sector: "Climate",
    city: "Austin",
    country: "USA",
    region: "USA",
    remote: "Hybrid",
    round: "Seed",
    amountUsd: 6_000_000,
    announced: daysAgo(16),
    investors: ["Saltwater VC", "Polar Bridge"],
    history: [{ round: "Seed", date: daysAgo(16), amountUsd: 6_000_000 }],
    headcount: 21,
    headcountGrowth: 31,
    founded: 2024,
    culture: 81,
    signals: [
      { label: "Clear mission, climate-first", positive: true, source: "Company site" },
      { label: "Generous equity at seed", positive: true, source: "Job descriptions" },
    ],
    roles: [{ title: "Full Stack Engineer", team: "Product", skills: ["Python", "Django", "React"] }],
    people: (c, d) => [
      person(c, d, "Luis Ramirez", "CTO", "Founder", 3, 1, "UT Austin", ["Tesla"]),
      person(c, d, "Priyanka Rao", "Senior Engineer", "Engineer", 2, 6, "Osmania University", ["Amazon"], true),
    ],
  },
  {
    id: "lumen-legal",
    name: "Lumen Legal",
    tagline: "AI drafting assistant for in-house counsel",
    sector: "Legal AI",
    city: "New York",
    country: "USA",
    region: "USA",
    remote: "Hybrid",
    round: "Series B",
    amountUsd: 40_000_000,
    announced: daysAgo(27),
    investors: ["Foundry Row", "Kestrel Capital"],
    history: [
      { round: "Seed", date: "2023-05-22", amountUsd: 5_000_000 },
      { round: "Series A", date: "2024-10-09", amountUsd: 16_000_000 },
      { round: "Series B", date: daysAgo(27), amountUsd: 40_000_000 },
    ],
    headcount: 140,
    headcountGrowth: 22,
    founded: 2022,
    culture: 66,
    signals: [
      { label: "Strong comp, top-of-band", positive: true, source: "Levels-style posts" },
      { label: "3 days in NYC office", positive: false, source: "Job descriptions" },
    ],
    roles: [{ title: "ML Platform Engineer", team: "AI", skills: ["Python", "LLM", "Kubernetes", "AWS"] }],
    people: (c, d) => [
      person(c, d, "Rachel Kim", "VP Engineering", "Engineering manager", 3, 2, "Columbia University", ["Meta"]),
      person(c, d, "Vivek Anand", "Staff Engineer", "Engineer", 2, 9, "IIT Hyderabad", ["Google"], true),
    ],
  },
  {
    id: "cascade-health",
    name: "Cascade Health",
    tagline: "Prior-authorisation automation for clinics",
    sector: "Health tech",
    city: "Seattle",
    country: "USA",
    region: "USA",
    remote: "Remote",
    round: "Series A",
    amountUsd: 15_000_000,
    announced: daysAgo(39),
    investors: ["Polar Bridge", "Halcyon Fund"],
    history: [
      { round: "Seed", date: "2025-02-27", amountUsd: 3_800_000 },
      { round: "Series A", date: daysAgo(39), amountUsd: 15_000_000 },
    ],
    headcount: 44,
    headcountGrowth: 27,
    founded: 2024,
    culture: 85,
    signals: [
      { label: "Remote (US time zones)", positive: true, source: "Careers page" },
      { label: "Transparent levels and pay", positive: true, source: "Company handbook" },
    ],
    roles: [{ title: "Backend Engineer", team: "Integrations", skills: ["TypeScript", "Node.js", "PostgreSQL", "AWS"] }],
    people: (c, d) => [
      person(c, d, "Emily Carter", "CEO", "Founder", 3, 1, "University of Washington", ["Microsoft"]),
      person(c, d, "Mohammed Rizwan", "Engineering Manager", "Engineering manager", 2, 7, "JNTU Hyderabad", ["Amazon", "Microsoft"], true),
    ],
  },
  {
    id: "fernweh",
    name: "Fernweh",
    tagline: "Group travel planning with shared budgets",
    sector: "Consumer",
    city: "Berlin",
    country: "Germany",
    region: "Europe",
    remote: "Hybrid",
    round: "Seed",
    amountUsd: 4_800_000,
    announced: daysAgo(14),
    investors: ["Polar Bridge", "Lumen Seed Fund"],
    history: [{ round: "Seed", date: daysAgo(14), amountUsd: 4_800_000 }],
    headcount: 19,
    headcountGrowth: 35,
    founded: 2024,
    culture: 83,
    signals: [
      { label: "Visa sponsorship for engineers", positive: true, source: "Careers page" },
      { label: "English-speaking team", positive: true, source: "Job descriptions" },
    ],
    roles: [{ title: "React Native Engineer", team: "App", skills: ["React Native", "TypeScript", "GraphQL"] }],
    people: (c, d) => [
      person(c, d, "Jonas Weber", "Co-founder & CTO", "Founder", 3, 2, "TU Munich", ["Zalando"]),
      person(c, d, "Aisha Rahman", "Senior Engineer", "Engineer", 2, 8, "IIIT Hyderabad", ["Delivery Hero"], true),
    ],
  },
  {
    id: "tallyho",
    name: "Tallyho",
    tagline: "Spend management for European scale-ups",
    sector: "Fintech",
    city: "London",
    country: "UK",
    region: "Europe",
    remote: "Hybrid",
    round: "Series A",
    amountUsd: 19_000_000,
    announced: daysAgo(52),
    investors: ["Northbeam Ventures", "Tidewater Capital"],
    history: [
      { round: "Seed", date: "2024-12-03", amountUsd: 4_000_000 },
      { round: "Series A", date: daysAgo(52), amountUsd: 19_000_000 },
    ],
    headcount: 61,
    headcountGrowth: 20,
    founded: 2023,
    culture: 72,
    signals: [
      { label: "Clear progression framework", positive: true, source: "Company handbook" },
      { label: "Busy quarter-end crunches", positive: false, source: "Forum posts" },
    ],
    roles: [{ title: "Senior Backend Engineer", team: "Payments", skills: ["Kotlin", "PostgreSQL", "AWS"] }],
    people: (c, d) => [
      person(c, d, "Oliver Grant", "Engineering Manager", "Engineering manager", 3, 2, "Imperial College London", ["Monzo"]),
      person(c, d, "Deepika Menon", "Talent Lead", "Recruiter", 2, 6, "University of Hyderabad", ["Revolut"], true),
    ],
  },
  {
    id: "polder",
    name: "Polder Robotics",
    tagline: "Autonomous greenhouse inspection robots",
    sector: "Robotics",
    city: "Amsterdam",
    country: "Netherlands",
    region: "Europe",
    remote: "Onsite",
    round: "Series A",
    amountUsd: 16_000_000,
    announced: daysAgo(66),
    investors: ["Tidewater Capital"],
    history: [
      { round: "Seed", date: "2025-01-30", amountUsd: 3_500_000 },
      { round: "Series A", date: daysAgo(66), amountUsd: 16_000_000 },
    ],
    headcount: 52,
    headcountGrowth: 25,
    founded: 2023,
    culture: 77,
    signals: [
      { label: "Relocation support + 30% ruling", positive: true, source: "Careers page" },
      { label: "Onsite for hardware work", positive: false, source: "Job descriptions" },
    ],
    roles: [{ title: "Robotics Software Engineer", team: "Autonomy", skills: ["C++", "ROS", "Python"] }],
    people: (c, d) => [
      person(c, d, "Sven de Vries", "CTO", "Founder", 3, 1, "TU Delft", ["ASML"]),
      person(c, d, "Harsha Vardhan", "Perception Engineer", "Engineer", 2, 5, "IIT Hyderabad", ["Bosch"]),
    ],
  },
  {
    id: "asyncly",
    name: "Asyncly",
    tagline: "Async video stand-ups for distributed teams",
    sector: "Productivity",
    city: "Remote",
    country: "Global",
    region: "Remote",
    remote: "Remote",
    round: "Seed",
    amountUsd: 3_600_000,
    announced: daysAgo(10),
    investors: ["Foundry Row", "Lumen Seed Fund"],
    history: [{ round: "Seed", date: daysAgo(10), amountUsd: 3_600_000 }],
    headcount: 14,
    headcountGrowth: 40,
    founded: 2025,
    culture: 90,
    signals: [
      { label: "Fully remote, 9 countries", positive: true, source: "Careers page" },
      { label: "Location-independent pay bands", positive: true, source: "Company handbook" },
      { label: "Annual team retreat", positive: true, source: "LinkedIn posts" },
    ],
    roles: [{ title: "Senior Frontend Engineer", team: "Web", skills: ["React", "TypeScript", "WebRTC"] }],
    people: (c, d) => [
      person(c, d, "Clara Jensen", "Co-founder", "Founder", 2, 3, "University of Copenhagen", ["Loom"], true),
      person(c, d, "Ravi Teja", "Founding Engineer", "Engineer", 1, 21, "JNTU Hyderabad", ["Microsoft"], true),
    ],
  },
  {
    id: "stackwise",
    name: "Stackwise",
    tagline: "Cost optimisation for Kubernetes clusters",
    sector: "Dev tools",
    city: "Remote",
    country: "Global",
    region: "Remote",
    remote: "Remote",
    round: "Series A",
    amountUsd: 13_000_000,
    announced: daysAgo(43),
    investors: ["Northbeam Ventures", "Arcfield Partners"],
    history: [
      { round: "Seed", date: "2025-03-19", amountUsd: 3_000_000 },
      { round: "Series A", date: daysAgo(43), amountUsd: 13_000_000 },
    ],
    headcount: 33,
    headcountGrowth: 36,
    founded: 2024,
    culture: 86,
    signals: [
      { label: "Remote, overlapping hours with IST + CET", positive: true, source: "Careers page" },
      { label: "Open-source agent with 4k stars", positive: true, source: "GitHub" },
    ],
    roles: [
      { title: "Platform Engineer", team: "Core", skills: ["Go", "Kubernetes", "Terraform", "AWS"] },
      { title: "Frontend Engineer", team: "Console", skills: ["React", "TypeScript"] },
    ],
    people: (c, d) => [
      person(c, d, "Marco Rossi", "CEO", "Founder", 3, 2, "Politecnico di Milano", ["Google"]),
      person(c, d, "Tejaswini Rao", "Engineering Manager", "Engineering manager", 2, 10, "IIIT Hyderabad", ["Microsoft"], true),
      person(c, d, "Ben Taylor", "Recruiter", "Recruiter", 2, 4, "University of Leeds", ["GitLab"]),
    ],
  },
];

export const STARTUPS: Startup[] = SEEDS.map((seed) => {
  const domain = `${seed.id.replace(/-/g, "")}.example`;
  return { ...seed, domain, people: seed.people(seed.id, domain) };
});

export const ALL_PEOPLE: Person[] = STARTUPS.flatMap((s) => s.people);

export const STARTUP_BY_ID: Record<string, Startup> = Object.fromEntries(
  STARTUPS.map((s) => [s.id, s]),
);

export const REGIONS: Region[] = ["India", "USA", "Europe", "Remote"];
export const ROUNDS: Round[] = ["Pre-seed", "Seed", "Series A", "Series B", "Series C"];

export const TODAY_ISO = TODAY.toISOString().slice(0, 10);

export function daysSince(iso: string): number {
  return Math.round((TODAY.getTime() - new Date(iso + "T00:00:00Z").getTime()) / 86_400_000);
}

// Résumé parsing runs entirely in the browser — the file never leaves the
// machine. The backend will later replace the heuristics with Claude extraction.

export type Seniority = "Junior" | "Mid" | "Senior" | "Staff";

export interface Profile {
  fileName: string;
  uploadedAt: string;
  name: string;
  email: string;
  headline: string;
  location: string;
  years: number;
  seniority: Seniority;
  skills: string[];
  schools: string[];
  employers: string[];
  // Preferences the user can edit on the profile page.
  targetRegions: string[];
  remoteOnly: boolean;
}

const SKILLS = [
  "Python", "Go", "Java", "Kotlin", "Swift", "Rust", "C++", "C#", "Ruby", "PHP", "Scala",
  "JavaScript", "TypeScript", "React", "React Native", "Next.js", "Vue", "Angular", "Node.js",
  "Django", "FastAPI", "Flask", "Spring", "GraphQL", "REST", "gRPC", "Tailwind", "D3",
  "PostgreSQL", "MySQL", "MongoDB", "Redis", "Kafka", "Elasticsearch", "SQL", "dbt", "Airflow",
  "Spark", "AWS", "GCP", "Azure", "Docker", "Kubernetes", "Terraform", "Prometheus", "Linux",
  "CI/CD", "PyTorch", "TensorFlow", "LLM", "NLP", "Computer Vision", "MLOps", "Speech",
  "Android", "iOS", "SwiftUI", "Jetpack Compose", "WebRTC", "ROS", "Security", "Figma",
  "Product Management", "Data Analysis", "Machine Learning", "APIs", "Writing",
];

// Variants people actually write on résumés → canonical skill.
const ALIASES: Record<string, string> = {
  golang: "Go",
  postgres: "PostgreSQL",
  k8s: "Kubernetes",
  "node js": "Node.js",
  nodejs: "Node.js",
  reactjs: "React",
  "react.js": "React",
  "amazon web services": "AWS",
  "google cloud": "GCP",
  "large language model": "LLM",
  llms: "LLM",
  genai: "LLM",
  "generative ai": "LLM",
  ml: "Machine Learning",
};

const TITLES = [
  "Staff Software Engineer", "Senior Software Engineer", "Software Engineer", "Software Developer",
  "Full Stack Engineer", "Full Stack Developer", "Frontend Engineer", "Frontend Developer",
  "Backend Engineer", "Backend Developer", "Data Engineer", "Data Scientist", "Data Analyst",
  "Machine Learning Engineer", "ML Engineer", "AI Engineer", "DevOps Engineer",
  "Site Reliability Engineer", "Platform Engineer", "Mobile Engineer", "Android Developer",
  "iOS Developer", "Product Manager", "Product Designer", "Engineering Manager", "SDE",
];

const CITIES = [
  "Hyderabad", "Bengaluru", "Bangalore", "Pune", "Mumbai", "Chennai", "Delhi", "Gurugram",
  "Noida", "Kolkata", "Ahmedabad", "San Francisco", "New York", "Seattle", "Austin", "Boston",
  "London", "Berlin", "Amsterdam", "Dublin", "Toronto", "Singapore", "Remote",
];

const KNOWN_EMPLOYERS = [
  "Microsoft", "Google", "Amazon", "Meta", "Apple", "Netflix", "Uber", "Flipkart", "Swiggy",
  "Zomato", "Razorpay", "Paytm", "PhonePe", "Infosys", "TCS", "Wipro", "HCL", "Accenture",
  "Deloitte", "Cognizant", "Capgemini", "Tech Mahindra", "Oracle", "Salesforce", "Adobe",
  "Atlassian", "Walmart Labs", "Goldman Sachs", "JPMorgan", "Stripe", "GitHub", "Zerodha",
  "Freshworks", "Zoho", "Persistent Systems", "Bosch", "Intel", "Nvidia", "Qualcomm", "IBM",
];

const SCHOOL_PATTERN =
  /\b(IIT|IIIT|NIT|BITS|IISc|IIM|JNTU|VIT|SRM|Osmania|Anna University|Manipal|Amity|DTU|COEP|[A-Z][A-Za-z.&' ]+ (?:University|Institute of Technology|Institute|College))\b[^\n,;|]*/g;

export async function extractText(file: File): Promise<string> {
  const name = file.name.toLowerCase();
  if (name.endsWith(".pdf")) {
    const pdfjs = await import("pdfjs-dist");
    const worker = await import("pdfjs-dist/build/pdf.worker.min.mjs?url");
    pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
    const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
    const pages: string[] = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      let line = "";
      const lines: string[] = [];
      for (const item of content.items) {
        if (!("str" in item)) continue;
        line += item.str;
        if (item.hasEOL) {
          lines.push(line);
          line = "";
        } else {
          line += " ";
        }
      }
      if (line) lines.push(line);
      pages.push(lines.join("\n"));
    }
    return pages.join("\n");
  }
  if (name.endsWith(".docx")) {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
    return result.value;
  }
  return file.text();
}

function escapeRegExp(text: string) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function findSkills(text: string): string[] {
  const lower = text.toLowerCase();
  const found = new Set<string>();
  for (const skill of SKILLS) {
    const pattern = new RegExp(`(^|[^a-z0-9+#])${escapeRegExp(skill.toLowerCase())}($|[^a-z0-9+#])`);
    if (pattern.test(lower)) found.add(skill);
  }
  for (const [alias, skill] of Object.entries(ALIASES)) {
    if (new RegExp(`\\b${escapeRegExp(alias)}\\b`).test(lower)) found.add(skill);
  }
  // "Go" is too ambiguous on its own; keep it only with supporting context.
  if (found.has("Go") && !/\bgolang\b|\bgo\b[^\n]{0,40}(microservice|backend|lang)|\bgo,/i.test(text)) {
    found.delete("Go");
  }
  return [...found];
}

function findYears(text: string): number {
  const explicit = [...text.matchAll(/(\d{1,2})(?:\.\d)?\+?\s*(?:years|yrs)/gi)].map((m) => Number(m[1]));
  const plausible = explicit.filter((n) => n > 0 && n < 40);
  if (plausible.length) return Math.max(...plausible);

  const currentYear = 2026;
  const years = [...text.matchAll(/\b(19[89]\d|20[0-3]\d)\b/g)].map((m) => Number(m[1]));
  const hasPresent = /\b(present|current|now)\b/i.test(text);
  if (years.length) {
    const start = Math.min(...years);
    const end = hasPresent ? currentYear : Math.max(...years);
    // Subtract a typical 4-year degree when the earliest year looks like college start.
    const span = end - start;
    return Math.max(0, Math.min(30, span > 6 && /b\.?tech|bachelor|b\.?e\b|b\.?sc/i.test(text) ? span - 4 : span));
  }
  return 0;
}

export function seniorityFor(years: number): Seniority {
  if (years >= 8) return "Staff";
  if (years >= 5) return "Senior";
  if (years >= 2) return "Mid";
  return "Junior";
}

export function parseProfile(text: string, fileName: string): Profile {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const email = text.match(/[\w.+-]+@[\w-]+\.[\w.-]+/)?.[0] ?? "";

  const nameLine = lines
    .slice(0, 6)
    .find((l) => /^[A-Za-z][A-Za-z.'-]+(?: [A-Za-z][A-Za-z.'-]+){1,3}$/.test(l) && !/resume|curriculum/i.test(l));
  const name = nameLine ?? fileName.replace(/\.[a-z]+$/i, "").replace(/[_-]+/g, " ").replace(/resume|cv/gi, "").trim();

  const headline =
    TITLES.find((t) => new RegExp(`\\b${escapeRegExp(t)}\\b`, "i").test(text)) ?? "Software Engineer";

  const location = CITIES.find((c) => new RegExp(`\\b${escapeRegExp(c)}\\b`, "i").test(text)) ?? "";

  const schools = [...new Set([...text.matchAll(SCHOOL_PATTERN)].map((m) => m[0].trim().replace(/\s+/g, " ")))]
    .map((s) => s.slice(0, 60))
    .slice(0, 4);

  const employers = KNOWN_EMPLOYERS.filter((e) => new RegExp(`\\b${escapeRegExp(e)}\\b`, "i").test(text));

  const years = findYears(text);

  return {
    fileName,
    uploadedAt: new Date().toISOString(),
    name: name || "You",
    email,
    headline,
    location: location === "Bangalore" ? "Bengaluru" : location,
    years,
    seniority: seniorityFor(years),
    skills: findSkills(text),
    schools,
    employers,
    targetRegions: ["India", "USA", "Europe", "Remote"],
    remoteOnly: false,
  };
}

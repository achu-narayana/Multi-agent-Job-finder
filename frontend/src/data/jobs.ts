// Placeholder data until the frontend is wired to backend/packages/reach.

export type JobSource = "LinkedIn" | "Boss直聘" | "Careers page" | "RSS";
export type JobStage = "new" | "applied" | "interview" | "offer";

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  remote: boolean;
  salary: string;
  source: JobSource;
  stage: JobStage;
  match: number;
  posted: string;
  tags: string[];
}

export const JOBS: Job[] = [
  {
    id: "j1",
    title: "Senior Frontend Engineer",
    company: "Northwind Labs",
    location: "Berlin",
    remote: true,
    salary: "€85–105k",
    source: "LinkedIn",
    stage: "interview",
    match: 94,
    posted: "2d",
    tags: ["React", "TypeScript"],
  },
  {
    id: "j2",
    title: "AI Platform Engineer",
    company: "Helix Systems",
    location: "Shenzhen",
    remote: false,
    salary: "¥45–60k / mo",
    source: "Boss直聘",
    stage: "new",
    match: 89,
    posted: "5h",
    tags: ["Python", "LLM"],
  },
  {
    id: "j3",
    title: "Product Designer",
    company: "Paperplane",
    location: "London",
    remote: true,
    salary: "£70–82k",
    source: "Careers page",
    stage: "applied",
    match: 81,
    posted: "1d",
    tags: ["Figma", "Design systems"],
  },
  {
    id: "j4",
    title: "Staff Backend Engineer",
    company: "Quanta Pay",
    location: "Remote — EU",
    remote: true,
    salary: "€120–140k",
    source: "LinkedIn",
    stage: "offer",
    match: 92,
    posted: "6d",
    tags: ["Go", "Postgres"],
  },
  {
    id: "j5",
    title: "Machine Learning Engineer",
    company: "Orbital Health",
    location: "Toronto",
    remote: false,
    salary: "CA$150–175k",
    source: "RSS",
    stage: "new",
    match: 77,
    posted: "3h",
    tags: ["PyTorch", "MLOps"],
  },
  {
    id: "j6",
    title: "Developer Advocate",
    company: "Cinder",
    location: "New York",
    remote: true,
    salary: "$140–160k",
    source: "Careers page",
    stage: "applied",
    match: 84,
    posted: "4d",
    tags: ["Community", "Workers"],
  },
];

export const STAGE_LABEL: Record<JobStage, string> = {
  new: "New",
  applied: "Applied",
  interview: "Interview",
  offer: "Offer",
};

export const STAGE_BADGE: Record<JobStage, string> = {
  new: "badge-teal",
  applied: "badge-iris",
  interview: "badge-lavender",
  offer: "badge-green",
};

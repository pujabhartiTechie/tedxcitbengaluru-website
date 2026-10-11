/**
 * Everything the apply form asks lives in this one file.
 *
 * To change a question, a team, or a dropdown option, edit it here.
 * The form (apply-flow.tsx) and the server check (api/recruitment/route.ts)
 * both read from this file, so they can never disagree.
 */

/* ------------------------------------------------------------------ */
/* Step 1: general questions                                           */
/* ------------------------------------------------------------------ */

export const DEPARTMENTS = [
  "CSE", "CSE-IOT", "CSE-DS", "ISE", "ECE", "AIML",
  "EEE", "MECH", "CIVIL", "BBA", "BCA", "BCOM", "Other",
] as const;

export const SEMESTERS = ["1", "2", "3", "4", "5", "6", "7", "8"] as const;

export type BasicDetails = {
  name: string;
  collegeEmail: string;
  personalEmail: string;
  usn: string;
  phone: string;
  department: string;
  semester: string;
  otherClubs: string;
};

export const EMPTY_BASIC: BasicDetails = {
  name: "",
  collegeEmail: "",
  personalEmail: "",
  usn: "",
  phone: "",
  department: "",
  semester: "",
  otherClubs: "",
};

/** Column titles for the general questions, in the order they go into the sheet. */
export const BASIC_COLUMNS = [
  "Timestamp", "Name", "USN", "College Email", "Personal Email",
  "Phone", "Department", "Semester", "otherClubs", "Team",
];

/* ------------------------------------------------------------------ */
/* Steps 2 and 3: teams and their questions                            */
/* ------------------------------------------------------------------ */

export type Question = {
  /** Short internal name for the answer. Must be unique within a team. */
  key: string;
  /** Column title in the Google Sheet. */
  column: string;
  /** The question shown to the applicant. */
  label: string;
  /** long = big text box, short = one line, url = one line that must be a link. */
  kind: "long" | "short" | "url";
  rows?: number;
  maxLength?: number;
  optional?: boolean;
  placeholder?: string;
  /** Pictures shown above the answer box. */
  images?: { src: string; alt: string }[];
  /** YouTube video shown above the answer box (the part after "v=" in the link). */
  videoId?: string;
  videoTitle?: string;
};

export type Team = {
  /** Used in code and saved drafts. Lowercase, no spaces. */
  slug: string;
  name: string;
  /** Name of the tab in the Google Sheet. */
  sheetName: string;
  /** One line shown on the team card. */
  blurb: string;
  /** YouTube id of the team lead's intro video. Leave "" to hide the video. */
  videoId: string;
  questions: Question[];
};

/** Link to the "team responsibilities" document. Leave "" to hide the link. */
export const TEAM_GUIDE_URL =
  "https://drive.google.com/file/d/1ouk_5WnyNV-Sne1Vqs8uVYddrpaQGy-G/view";

export const TEAMS: Team[] = [
  {
    slug: "technical",
    name: "Technical",
    sheetName: "Technical",
    blurb: "Build and run the website, ticketing and every tool the event depends on.",
    videoId: "W9UmLw_Whxw",
    questions: [
      {
        key: "project",
        column: "Project Description",
        label: "Share a tech project, website, or script you've built or contributed to. What problem did it solve?",
        kind: "long",
        rows: 5,
        placeholder: "Describe the project, stack, and impact",
      },
      {
        key: "crazyFeature",
        column: "Crazy Feature",
        label: "If you could build one crazy feature for TEDx — no budget limits — what would it be?",
        kind: "long",
        rows: 3,
        placeholder: "Dream big",
      },
      {
        key: "incidentResponse",
        column: "Incident Response",
        label: "A few hours before the event, the website backend for ticketing stops responding. What's your first move?",
        kind: "long",
        rows: 3,
        placeholder: "Triage steps, comms, rollback, observability",
      },
      {
        key: "portfolioLink",
        column: "Portfolio Link",
        label: "Portfolio / GitHub / Website link",
        kind: "url",
        placeholder: "Paste a link",
      },
      {
        key: "toolsAndNext",
        column: "Tools & Next Learning",
        label: "What tools, languages, or frameworks do you vibe with right now — and what's on your \"I want to learn this next\" list?",
        kind: "long",
        rows: 3,
        placeholder: "Stacks you love + next-to-learn",
      },
      {
        key: "oneWord",
        column: "One Word",
        label: "In one word — what do you bring to the team?",
        kind: "short",
        maxLength: 20,
        placeholder: "One word",
      },
      {
        key: "proofLink",
        column: "Proof Link",
        label: "Upload or link something that proves you build stuff — a repo, a design, a script, an automation, even a screenshot.",
        kind: "long",
        rows: 3,
        placeholder: "Link(s) and short context",
      },
      {
        key: "goals",
        column: "Goals",
        label: "What do you want to learn, build, or prove here?",
        kind: "long",
        rows: 3,
        placeholder: "Your goals",
      },
      {
        key: "otherTeams",
        column: "otherTeams",
        label: "Are you interested in being a part of any other team? If so, please specify which team and share why you would like to join that team.",
        kind: "long",
        rows: 3,
        placeholder: "Technical, Sponsorship, Media, Design, Curation, Event Management or type No if you aren't interested",
      },
    ],
  },
  {
    slug: "event-management",
    name: "Event Management",
    sheetName: "Event Management",
    blurb: "Plan the day and make it happen: logistics, vendors, volunteers and the venue.",
    videoId: "iB5lyjPt14Y",
    questions: [
      {
        key: "why",
        column: "Why Event Management",
        label: "Why do you want to be part of TEDxCIT's Event Management team?",
        kind: "long",
        rows: 3,
        placeholder: "Share your motivation and what draws you to event management",
      },
      {
        key: "meaning",
        column: "TEDx Meaning",
        label: "What does \"TEDx\" mean to you?",
        kind: "long",
        rows: 3,
        placeholder: "Your understanding and perspective",
      },
      {
        key: "excites",
        column: "What Excites You",
        label: "What excites you most about working in event management?",
        kind: "long",
        rows: 3,
        placeholder: "What aspects of event management energize you?",
      },
      {
        key: "pressure",
        column: "Handle Pressure",
        label: "How do you handle work under pressure or tight deadlines?",
        kind: "long",
        rows: 3,
        placeholder: "Describe your approach and give an example if possible",
      },
      {
        key: "teamwork",
        column: "Teamwork Example",
        label: "Describe a time when you successfully worked as part of a team.",
        kind: "long",
        rows: 4,
        placeholder: "Share a specific example with context and outcome",
      },
      {
        key: "experience",
        column: "Prior Experience",
        label: "Do you have any prior experience in logistics, coordination, or event setup?",
        kind: "long",
        rows: 3,
        placeholder: "List any relevant experience or type 'None' if you're starting fresh",
      },
      {
        key: "prefer",
        column: "Preferred Tasks",
        label: "What kind of tasks would you prefer taking up?",
        kind: "long",
        rows: 3,
        placeholder: "E.g., logistics, vendor coordination, on-ground execution, planning, etc.",
      },
      {
        key: "strategies",
        column: "Management Strategies",
        label: "Enlist 3 niche strategies for managing the team well in event management.",
        kind: "long",
        rows: 4,
        placeholder: "List three specific strategies with brief explanations",
      },
      {
        key: "tackle",
        column: "Tackle Non-Working Members",
        label: "Suppose you are the lead and some member(s) are not working, how will you tackle it?",
        kind: "long",
        rows: 4,
        placeholder: "Describe your leadership approach to handling underperformance",
      },
      {
        key: "portfolio",
        column: "Portfolio Link",
        label: "Upload portfolio & attach your social handles (if you have one)",
        kind: "short",
        optional: true,
        placeholder: "Paste a portfolio link (Drive/Notion/Behance/etc.)",
      },
      {
        key: "campaign",
        column: "Campaign Idea",
        label: "Mention a unique campaigning idea for the event.",
        kind: "long",
        rows: 4,
        placeholder: "Share a creative and unique campaign idea for TEDxCIT",
      },
      {
        key: "otherTeams",
        column: "otherTeams",
        label: "Are you interested in being a part of any other team? If so, please specify which team and share why you would like to join that team.",
        kind: "long",
        rows: 3,
        placeholder: "Technical, Sponsorship, Media, Design, Curation, Event Management or type 'No' if you aren't interested",
      },
    ],
  },
  {
    slug: "sponsorship",
    name: "Sponsorship",
    sheetName: "Sponsorship",
    blurb: "Find sponsors and stalls, pitch to them and look after those partnerships.",
    videoId: "ZQmIOtdMJ70",
    questions: [
      {
        key: "outreach",
        column: "Outreach Strategy",
        label: "How will you reach out to small or mid-sized businesses for sponsorships or stalls?",
        kind: "long",
        rows: 4,
        placeholder: "Outline your outreach approach",
      },
      {
        key: "pitch",
        column: "Pitch Script",
        label: "What will you say in a call or DM to grab a sponsor's attention?",
        kind: "long",
        rows: 3,
        placeholder: "Write a short pitch script",
      },
      {
        key: "channels",
        column: "Channels Used",
        label: "Which channels or platforms will you use to find and contact small businesses?",
        kind: "long",
        rows: 3,
        placeholder: "e.g., Instagram, LinkedIn, local directories, WhatsApp groups",
      },
      {
        key: "selection",
        column: "Business Selection",
        label: "How will you choose which local businesses to approach for the event?",
        kind: "long",
        rows: 3,
        placeholder: "Selection criteria (relevance, audience fit, locality, etc.)",
      },
      {
        key: "relationships",
        column: "Relationship Building",
        label: "How will you build and maintain good relationships with sponsors?",
        kind: "long",
        rows: 4,
        placeholder: "Follow-ups, deliverables, updates, hospitality, post-event reports",
      },
      {
        key: "proposal",
        column: "Proposal Contents",
        label: "What will you include in a simple and appealing sponsorship proposal?",
        kind: "long",
        rows: 4,
        placeholder: "Benefits, audience, visibility, tiers, pricing, timelines",
      },
      {
        key: "objections",
        column: "Handle Objections",
        label: "How will you handle a sponsor saying no or not responding?",
        kind: "long",
        rows: 3,
        placeholder: "Objection handling and re-engagement strategy",
      },
      {
        key: "availability",
        column: "Availability Plan",
        label: "How will you ensure you stay online and reachable to the team and sponsors throughout the duration of the event?",
        kind: "long",
        rows: 3,
        placeholder: "Describe your plan to stay reachable",
      },
      {
        key: "otherTeams",
        column: "otherTeams",
        label: "Are you interested in being a part of any other team? If so, please specify which team and share why you would like to join that team.",
        kind: "long",
        rows: 3,
        placeholder: "Technical, Sponsorship, Media, Design, Curation, Event Management or type No if you aren't interested",
      },
    ],
  },
  {
    slug: "curation",
    name: "Curation",
    sheetName: "Curation",
    blurb: "Shape the theme, find and coach speakers, and write the words TEDx is known for.",
    videoId: "M71r_Jmmsd4",
    questions: [
      {
        key: "writingProficiency",
        column: "Writing Proficiency",
        label: "How proficient are you with creative writing skills? Please describe your experience and self-assessed proficiency level.",
        kind: "long",
        rows: 3,
        placeholder: "e.g., I have written short stories and blog posts for 2 years, self-assessed proficiency: 8/10",
      },
      {
        key: "captions",
        column: "Captions",
        label: "Write 3 eye-catching captions related to the image.",
        kind: "long",
        rows: 4,
        placeholder: "Write three options separated by new lines",
        images: [
          { src: 'https://res.cloudinary.com/dkbvknwcu/image/upload/v1760461420/Picture3_wtdno4.png', alt: 'First image for captions' },
          { src: 'https://res.cloudinary.com/dkbvknwcu/image/upload/v1760461420/Picture2_yflw5y.png', alt: 'Second image for captions' },
        ],
      },
      {
        key: "themes",
        column: "Theme Ideas",
        label: "Based on the video, suggest at least two theme ideas for the next TEDx event along with taglines.",
        kind: "long",
        rows: 4,
        placeholder: "Theme idea + short tagline for each",
        videoId: 'PY_kd46RfVE',
        videoTitle: 'Margaret Heffernan: Dare to Disagree',
      },
      {
        key: "resonate",
        column: "What Resonates",
        label: "Which movie/book/music/series do you resonate with most and how did it impact you?",
        kind: "long",
        rows: 4,
        placeholder: "Explain briefly",
      },
      {
        key: "philosophy",
        column: "Philosophical Thought",
        label: "Share a philosophical thought or an idea that you find particularly fascinating.",
        kind: "long",
        rows: 3,
        placeholder: "Your idea",
      },
      {
        key: "why",
        column: "Why Curation",
        label: "Why have you chosen curation?",
        kind: "long",
        rows: 3,
        placeholder: "Your motivation",
      },
      {
        key: "ai",
        column: "AI vs Curators",
        label: "When we have AI for content, why do you think we need a team of curators?",
        kind: "long",
        rows: 3,
        placeholder: "Your perspective",
      },
      {
        key: "enhance",
        column: "Content Enhancement",
        label: "In what aspects would you enhance a given content?",
        kind: "long",
        rows: 3,
        placeholder: "Structure, tone, hooks, call-to-action, etc.",
      },
      {
        key: "imageDesc",
        column: "Image Description",
        label: "For a given image, give us a description based on your creativity.",
        kind: "long",
        rows: 3,
        placeholder: "Write an evocative description",
        images: [
          { src: 'https://res.cloudinary.com/dkbvknwcu/image/upload/v1760461419/Picture1_oel361.png', alt: 'TEDx stage with vibrant lighting and an engaged audience' },
        ],
      },
      {
        key: "otherTeams",
        column: "otherTeams",
        label: "Are you interested in being a part of any other team? If so, please specify which team and share why you would like to join that team.",
        kind: "long",
        rows: 3,
        placeholder: "Technical, Sponsorship, Media, Design, Curation, Event Management or type No if you aren't interested",
      },
    ],
  },
  {
    slug: "design",
    name: "Design",
    sheetName: "Design",
    blurb: "Create the visual identity: posters, social posts, stage and merchandise.",
    videoId: "sKUo3XQlszU",
    questions: [
      {
        key: "proficiency",
        column: "Software Proficiency",
        label: "How proficient are you with the following software: Figma, Adobe Photoshop, Adobe Illustrator, Canva, and any other tools? Please specify your proficiency level for each.",
        kind: "long",
        rows: 4,
        placeholder: "e.g., Figma: Advanced, Adobe Photoshop: Intermediate, Adobe Illustrator: Beginner, Canva: Expert, Sketch: Intermediate",
      },
      {
        key: "newTools",
        column: "Learning New Tools",
        label: "How comfortable are you with trying new tools or learning on the go?",
        kind: "long",
        rows: 3,
        placeholder: "Share your approach",
      },
      {
        key: "strategies",
        column: "Engagement Strategies",
        label: "What strategies do you use to make an event visually and experientially engaging?",
        kind: "long",
        rows: 4,
        placeholder: "Share ideas across visual design and experience",
      },
      {
        key: "project",
        column: "Proud Project",
        label: "Tell us about a design project you're proud of and how you made it.",
        kind: "long",
        rows: 4,
        placeholder: "Process, tools, outcome",
      },
      {
        key: "trends",
        column: "Design Trends",
        label: "What latest trends in design and technology excite you, and how do you use them?",
        kind: "long",
        rows: 3,
        placeholder: "Trends and applications",
      },
      {
        key: "inspiration",
        column: "Inspiration Sources",
        label: "What inspires your creative work, and how do you translate it into tangible projects?",
        kind: "long",
        rows: 3,
        placeholder: "Inspiration and execution",
      },
      {
        key: "communication",
        column: "Team Communication",
        label: "TEDx designs often need coordination with curation and tech — how do you communicate your ideas?",
        kind: "long",
        rows: 3,
        placeholder: "Handoffs, feedback loops, tools",
      },
      {
        key: "links",
        column: "Past Work Links",
        label: "Share past work links (Instagram/Behance/YouTube/Pinterest/Dribbble/Figma/Other)",
        kind: "long",
        rows: 3,
        placeholder: "Paste links here",
      },
      {
        key: "otherTeams",
        column: "otherTeams",
        label: "Are you interested in being a part of any other team? If so, please specify which team and share why you would like to join that team.",
        kind: "long",
        rows: 3,
        placeholder: "Technical, Sponsorship, Media, Design, Curation, Event Management or type No if you aren't interested",
      },
    ],
  },
  {
    slug: "media",
    name: "Media",
    sheetName: "Media",
    blurb: "Shoot and edit the photos, reels and films that tell the story of the event.",
    videoId: "lQqc0ytkbKM",
    questions: [
      {
        key: "proficiency",
        column: "Software Proficiency",
        label: "How proficient are you with the following software: After Effects, Premiere Pro, VN App, CapCut App, and any other tools? Please specify your proficiency level for each.",
        kind: "long",
        rows: 4,
        placeholder: "e.g., After Effects: Intermediate, Premiere Pro: Advanced, VN App: Beginner, CapCut: Expert, Photoshop: Intermediate",
      },
      {
        key: "project",
        column: "Proud Project",
        label: "Can you tell us about a media project you're proud of?",
        kind: "long",
        rows: 4,
        placeholder: "Describe the project, goals, outcome and impact",
      },
      {
        key: "inspiration",
        column: "Inspiration",
        label: "What inspires you, and how do you channel that into engaging content?",
        kind: "long",
        rows: 4,
        placeholder: "Your sources of inspiration and creative process",
      },
      {
        key: "tools",
        column: "New Tools Comfort",
        label: "How comfortable are you with exploring new tools for trending/visual content?",
        kind: "long",
        rows: 3,
        placeholder: "Share how you learn and adapt to new tools",
      },
      {
        key: "strategy",
        column: "Engagement Strategy",
        label: "What strategies do you use to make media engaging on event day and online?",
        kind: "long",
        rows: 4,
        placeholder: "On-ground coverage, reels, posts, captions, etc.",
      },
      {
        key: "links",
        column: "Past Work Links",
        label: "Share past work links (Instagram/Behance/YouTube/Pinterest/Dribbble/Other)",
        kind: "long",
        rows: 3,
        placeholder: "Paste any relevant links here",
      },
      {
        key: "otherTeams",
        column: "otherTeams",
        label: "Are you interested in being a part of any other team? If so, please specify which team and share why you would like to join that team.",
        kind: "long",
        rows: 3,
        placeholder: "Technical, Sponsorship, Media, Design, Curation, Event Management or type No if you aren't interested",
      },
    ],
  },];

export function getTeam(slug: string): Team | undefined {
  return TEAMS.find((team) => team.slug === slug);
}

/* ------------------------------------------------------------------ */
/* Checks. Used by the form AND by the server.                         */
/* ------------------------------------------------------------------ */

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MAX_SHORT = 200;
const MAX_LONG = 3000;

export type Errors = Record<string, string>;

/** Keeps only the digits of a phone number and drops a leading +91 / 0. */
export function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) return digits.slice(1);
  return digits;
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

/** Returns one message per wrong field. An empty object means all good. */
export function validateBasic(basic: BasicDetails): Errors {
  const errors: Errors = {};
  const name = basic.name.trim();
  const collegeEmail = basic.collegeEmail.trim();
  const personalEmail = basic.personalEmail.trim();
  const usn = basic.usn.trim();

  if (name.length < 2) errors.name = "Enter your full name.";
  else if (name.length > 100) errors.name = "Keep your name under 100 characters.";

  if (!collegeEmail) errors.collegeEmail = "Enter your college email, or N/A if you don't have one yet.";
  else if (collegeEmail.toUpperCase() !== "N/A" && !EMAIL.test(collegeEmail))
    errors.collegeEmail = "That doesn't look like an email. Type N/A if you don't have one yet.";

  if (!EMAIL.test(personalEmail)) errors.personalEmail = "Enter a valid email address.";

  if (usn.length < 2) errors.usn = "Enter your USN, or your name and section if you don't have one yet.";
  else if (usn.length > 60) errors.usn = "Keep this under 60 characters.";

  if (!/^[6-9]\d{9}$/.test(normalizePhone(basic.phone)))
    errors.phone = "Enter a 10-digit mobile number.";

  if (!(DEPARTMENTS as readonly string[]).includes(basic.department))
    errors.department = "Select your department.";

  if (!(SEMESTERS as readonly string[]).includes(basic.semester))
    errors.semester = "Select your semester.";

  if (basic.otherClubs.length > MAX_LONG)
    errors.otherClubs = `Keep this under ${MAX_LONG} characters.`;

  return errors;
}

/** Checks one team's answers. An empty object means all good. */
export function validateAnswers(team: Team, answers: Record<string, string>): Errors {
  const errors: Errors = {};
  for (const question of team.questions) {
    const value = (answers[question.key] ?? "").trim();
    const limit = question.maxLength ?? (question.kind === "long" ? MAX_LONG : MAX_SHORT);

    if (!value) {
      if (!question.optional) errors[question.key] = "Please answer this question.";
      continue;
    }
    if (value.length > limit) {
      errors[question.key] = `Keep this under ${limit} characters.`;
    } else if (question.kind === "url" && !isHttpUrl(value)) {
      errors[question.key] = "Paste a full link starting with https://";
    }
  }
  return errors;
}

export function hasErrors(errors: Errors): boolean {
  return Object.keys(errors).length > 0;
}

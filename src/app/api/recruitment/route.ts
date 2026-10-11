import { NextRequest, NextResponse } from "next/server";
import {
  BASIC_COLUMNS,
  EMPTY_BASIC,
  getTeam,
  hasErrors,
  normalizePhone,
  validateAnswers,
  validateBasic,
  type BasicDetails,
} from "@/app/joinus/config";

/**
 * Receives a finished application from the form, checks it again on the
 * server, and passes it to the Google Apps Script that writes to the sheet.
 *
 * The form already checks everything in the browser, but a browser check can
 * be skipped by anyone who sends a request by hand. This check cannot.
 *
 * Two settings are read from the environment (.env.local on your laptop,
 * "Environment Variables" on Vercel):
 *   APPS_SCRIPT_URL     the web app link Apps Script gives you after deploying
 *   APPS_SCRIPT_SECRET  the same password you saved inside the Apps Script
 */

const APPS_SCRIPT_URL = process.env.APPS_SCRIPT_URL;
const APPS_SCRIPT_SECRET = process.env.APPS_SCRIPT_SECRET;

/** Sheets treats text starting with = + - @ as a formula. A leading ' stops that. */
function safeCell(value: string): string {
  return /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
}

function asText(value: unknown): string {
  return typeof value === "string" ? value : "";
}

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "The request was not valid." }, { status: 400 });
  }
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "The request was not valid." }, { status: 400 });
  }

  // Hidden field that real people never see or fill. Bots fill everything.
  if (asText(body.website)) {
    return NextResponse.json({ success: true });
  }

  // 1. General questions
  const rawBasic = (body.basic ?? {}) as Record<string, unknown>;
  const basic = { ...EMPTY_BASIC } as BasicDetails;
  for (const key of Object.keys(EMPTY_BASIC) as (keyof BasicDetails)[]) {
    basic[key] = asText(rawBasic[key]).trim();
  }
  const basicErrors = validateBasic(basic);
  if (hasErrors(basicErrors)) {
    return NextResponse.json(
      { error: "Some of your details are missing or wrong.", step: 1, fields: basicErrors },
      { status: 400 }
    );
  }

  // 2. Team
  const team = getTeam(asText(body.team));
  if (!team) {
    return NextResponse.json({ error: "Please choose a team.", step: 2 }, { status: 400 });
  }

  // 3. Team questions
  const rawAnswers = (body.answers ?? {}) as Record<string, unknown>;
  const answers: Record<string, string> = {};
  for (const question of team.questions) {
    answers[question.key] = asText(rawAnswers[question.key]).trim();
  }
  const answerErrors = validateAnswers(team, answers);
  if (hasErrors(answerErrors)) {
    return NextResponse.json(
      { error: "Some answers are missing or too long.", step: 3, fields: answerErrors },
      { status: 400 }
    );
  }

  // Build the row in the same column order as the header row.
  const usn = basic.usn.toUpperCase();
  const headers = [...BASIC_COLUMNS, ...team.questions.map((question) => question.column)];
  const row = [
    new Date().toISOString(),
    basic.name,
    usn,
    basic.collegeEmail,
    basic.personalEmail,
    normalizePhone(basic.phone),
    basic.department,
    basic.semester,
    basic.otherClubs,
    team.name,
    ...team.questions.map((question) => answers[question.key]),
  ].map(safeCell);

  if (!APPS_SCRIPT_URL || !APPS_SCRIPT_SECRET) {
    // On your laptop, before the sheet is connected, print the row in the
    // terminal so the whole form can still be tested.
    if (process.env.NODE_ENV !== "production") {
      console.log("\n[recruitment] Sheet not connected yet. This row would be saved:");
      console.log(Object.fromEntries(headers.map((header, index) => [header, row[index]])));
      return NextResponse.json({ success: true, saved: false });
    }
    console.error("[recruitment] APPS_SCRIPT_URL or APPS_SCRIPT_SECRET is not set.");
    return NextResponse.json(
      { error: "Applications can't be saved right now. Please try again later." },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        secret: APPS_SCRIPT_SECRET,
        sheetName: team.sheetName,
        headers,
        row,
        usn,
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(25_000),
    });

    const text = await response.text();
    let result: { ok?: boolean; error?: string };
    try {
      result = JSON.parse(text);
    } catch {
      // Apps Script answers with an HTML page when the deployment is wrong.
      throw new Error(`Apps Script did not return JSON (status ${response.status}).`);
    }

    if (result.ok) {
      return NextResponse.json({ success: true, saved: true });
    }
    if (result.error === "duplicate") {
      return NextResponse.json(
        {
          error: "This USN has already applied. Each person can apply once.",
          step: 1,
          fields: { usn: "This USN has already applied." },
        },
        { status: 409 }
      );
    }
    throw new Error(`Apps Script refused the row: ${result.error ?? "unknown reason"}`);
  } catch (error) {
    console.error("[recruitment] Could not save to the sheet:", error);
    return NextResponse.json(
      { error: "We couldn't save your application. Please try again in a minute." },
      { status: 502 }
    );
  }
}

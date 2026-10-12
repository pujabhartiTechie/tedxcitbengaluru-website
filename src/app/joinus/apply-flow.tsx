"use client";

/**
 * The whole apply form: general questions, team choice, team questions, and
 * the thank-you screen.
 *
 * All four screens live on ONE address (/joinus). Which screen is showing is
 * decided by the `step` value below, never by the URL, so nobody can jump to
 * a later screen by typing an address. Before any step is shown, `maxStep`
 * checks that the earlier steps are properly filled.
 */

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  DEPARTMENTS,
  EMPTY_BASIC,
  SEMESTERS,
  TEAMS,
  TEAM_GUIDE_URL,
  getTeam,
  hasErrors,
  validateAnswers,
  validateBasic,
  type BasicDetails,
  type Errors,
  type Question,
  type Team,
} from "./config";

type Step = 1 | 2 | 3;

type Draft = {
  step: Step;
  basic: BasicDetails;
  team: string;
  /** Answers are kept per team, so switching team and back loses nothing. */
  answers: Record<string, Record<string, string>>;
};

const EMPTY_DRAFT: Draft = { step: 1, basic: EMPTY_BASIC, team: "", answers: {} };
const STORAGE_KEY = "tedx-apply-draft-v2";
const STEP_NAMES = ["Your details", "Choose a team", "Team questions"];

/** The furthest step this draft is allowed to see. */
function maxStep(draft: Draft): Step {
  if (hasErrors(validateBasic(draft.basic))) return 1;
  if (!getTeam(draft.team)) return 2;
  return 3;
}

function clampStep(wanted: number, draft: Draft): Step {
  const allowed = maxStep(draft);
  if (wanted >= 3 && allowed >= 3) return 3;
  if (wanted >= 2 && allowed >= 2) return 2;
  return 1;
}

/** Reads the saved draft. The answers survive a refresh; closing the tab clears them. */
function loadDraft(): Draft {
  try {
    const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? "null");
    if (!saved || typeof saved !== "object") return EMPTY_DRAFT;
    const draft: Draft = {
      step: 1,
      basic: { ...EMPTY_BASIC },
      team: typeof saved.team === "string" && getTeam(saved.team) ? saved.team : "",
      answers: {},
    };
    for (const key of Object.keys(EMPTY_BASIC) as (keyof BasicDetails)[]) {
      if (typeof saved.basic?.[key] === "string") draft.basic[key] = saved.basic[key];
    }
    for (const team of TEAMS) {
      const savedAnswers = saved.answers?.[team.slug];
      if (!savedAnswers || typeof savedAnswers !== "object") continue;
      draft.answers[team.slug] = {};
      for (const question of team.questions) {
        if (typeof savedAnswers[question.key] === "string") {
          draft.answers[team.slug][question.key] = savedAnswers[question.key];
        }
      }
    }
    draft.step = clampStep(Number(saved.step) || 1, draft);
    return draft;
  } catch {
    return EMPTY_DRAFT;
  }
}

export default function ApplyFlow() {
  const [status, setStatus] = useState<"loading" | "form" | "done">("loading");
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [errors, setErrors] = useState<Errors>({});
  const [notice, setNotice] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [website, setWebsite] = useState(""); // hidden bot trap, see the form below

  const draftRef = useRef(draft);
  draftRef.current = draft;
  const statusRef = useRef(status);
  statusRef.current = status;
  const headingRef = useRef<HTMLHeadingElement>(null);

  // Bring back a saved draft once the page is in the browser.
  useEffect(() => {
    const saved = loadDraft();
    setDraft(saved);
    setStatus("form");
    window.history.replaceState({ applyStep: saved.step }, "");
  }, []);

  // Save the draft whenever it changes.
  useEffect(() => {
    if (status !== "form") return;
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    } catch {
      /* private mode or storage full: the form still works, it just won't survive a refresh */
    }
  }, [draft, status]);

  // Browser back and forward buttons move between steps, still guarded.
  useEffect(() => {
    function onPopState(event: PopStateEvent) {
      const wanted = Number(event.state?.applyStep) || 1;
      if (statusRef.current === "done") {
        setDraft(EMPTY_DRAFT);
        setStatus("form");
        return;
      }
      setErrors({});
      setNotice("");
      setDraft((current) => ({ ...current, step: clampStep(wanted, current) }));
    }
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  // After a step change, start at the top with the heading focused.
  const firstRender = useRef(true);
  useEffect(() => {
    if (status === "loading") return;
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    window.scrollTo({ top: 0 });
    headingRef.current?.focus({ preventScroll: true });
  }, [draft.step, status]);

  const goTo = useCallback((wanted: Step) => {
    const next = clampStep(wanted, draftRef.current);
    if (next === draftRef.current.step) return;
    setErrors({});
    setNotice("");
    setDraft((current) => ({ ...current, step: next }));
    window.history.pushState({ applyStep: next }, "");
  }, []);

  function showErrors(found: Errors, idPrefix: string) {
    setErrors(found);
    const first = Object.keys(found)[0];
    if (first) document.getElementById(idPrefix + first)?.focus();
  }

  function setBasic(key: keyof BasicDetails, value: string) {
    setDraft((current) => ({ ...current, basic: { ...current.basic, [key]: value } }));
    if (errors[key]) setErrors(({ [key]: _removed, ...rest }) => rest);
  }

  function setAnswer(teamSlug: string, key: string, value: string) {
    setDraft((current) => ({
      ...current,
      answers: {
        ...current.answers,
        [teamSlug]: { ...current.answers[teamSlug], [key]: value },
      },
    }));
    if (errors[key]) setErrors(({ [key]: _removed, ...rest }) => rest);
  }

  function submitBasic(event: React.FormEvent) {
    event.preventDefault();
    const found = validateBasic(draft.basic);
    if (hasErrors(found)) {
      setNotice("Please fix the highlighted fields.");
      showErrors(found, "basic-");
      return;
    }
    goTo(2);
  }

  function chooseTeam(slug: string) {
    draftRef.current = { ...draftRef.current, team: slug };
    setDraft((current) => ({ ...current, team: slug }));
    goTo(3);
  }

  async function submitApplication(event: React.FormEvent) {
    event.preventDefault();
    if (submitting) return;
    const team = getTeam(draft.team);
    if (!team) return goTo(2);

    const answers = draft.answers[team.slug] ?? {};
    const found = validateAnswers(team, answers);
    if (hasErrors(found)) {
      setNotice("Please answer the highlighted questions.");
      showErrors(found, "q-");
      return;
    }

    setSubmitting(true);
    setNotice("");
    try {
      const response = await fetch("/api/recruitment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ basic: draft.basic, team: team.slug, answers, website }),
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        // The server found a problem. Go to the step it belongs to.
        const step = result.step === 1 || result.step === 2 ? (result.step as Step) : 3;
        if (step !== draft.step) {
          setDraft((current) => ({ ...current, step }));
          window.history.pushState({ applyStep: step }, "");
        }
        setErrors(result.fields ?? {});
        setNotice(result.error ?? "Something went wrong. Please try again.");
        return;
      }

      try {
        sessionStorage.removeItem(STORAGE_KEY);
      } catch {
        /* nothing to clear */
      }
      setStatus("done");
      window.history.replaceState({ applyStep: 1 }, "");
    } catch {
      setNotice("We couldn't reach the server. Check your internet and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const team = getTeam(draft.team);
  const allowed = maxStep(draft);

  return (
    <main className="flex min-h-screen flex-col bg-black text-white">
      <div className="h-[2px] w-full bg-[var(--color-red)]" />

      <div className="container flex-1 py-10 md:py-16">
        <div className="mx-auto w-full max-w-3xl">
          <Link href="/" className="text-sm text-gray-400 hover:text-white">
            ← TEDxCITBengaluru
          </Link>

          {status === "loading" && <div className="min-h-[60vh]" aria-busy="true" />}

          {status === "done" && <Done headingRef={headingRef} />}

          {status === "form" && (
            <>
              <Progress current={draft.step} allowed={allowed} onPick={goTo} />

              {notice && (
                <p
                  role="alert"
                  className="mb-8 rounded-md border border-red-600/40 bg-red-600/10 px-4 py-3 text-sm text-red-200"
                >
                  {notice}
                </p>
              )}

              {draft.step === 1 && (
                <form onSubmit={submitBasic} noValidate>
                  <StepHeading ref={headingRef} title="Join" accent="TEDxCITBengaluru">
                    Start with a few details about you. You&apos;ll pick your team next.
                  </StepHeading>

                  <div className="grid gap-6 sm:grid-cols-2">
                    <TextField
                      id="basic-name"
                      label="Full name"
                      value={draft.basic.name}
                      onChange={(value) => setBasic("name", value)}
                      error={errors.name}
                      autoComplete="name"
                      placeholder="e.g. Veronica Smith"
                    />
                    <TextField
                      id="basic-usn"
                      label="USN / Roll number"
                      hint="Not received yet? Write your name and section."
                      value={draft.basic.usn}
                      onChange={(value) => setBasic("usn", value)}
                      error={errors.usn}
                      placeholder="e.g. 1CD23CS001"
                    />
                    <TextField
                      id="basic-collegeEmail"
                      label="College email"
                      hint="Type N/A if you haven't received one."
                      value={draft.basic.collegeEmail}
                      onChange={(value) => setBasic("collegeEmail", value)}
                      error={errors.collegeEmail}
                      inputMode="email"
                      placeholder="you@cambridge.edu.in"
                    />
                    <TextField
                      id="basic-personalEmail"
                      label="Personal email"
                      type="email"
                      value={draft.basic.personalEmail}
                      onChange={(value) => setBasic("personalEmail", value)}
                      error={errors.personalEmail}
                      autoComplete="email"
                      placeholder="yourname@gmail.com"
                    />
                    <TextField
                      id="basic-phone"
                      label="Phone number"
                      type="tel"
                      value={draft.basic.phone}
                      onChange={(value) => setBasic("phone", value)}
                      error={errors.phone}
                      autoComplete="tel"
                      placeholder="9XXXXXXXXX"
                    />
                    <SelectField
                      id="basic-department"
                      label="Department"
                      value={draft.basic.department}
                      onChange={(value) => setBasic("department", value)}
                      error={errors.department}
                      options={DEPARTMENTS}
                      placeholder="Select department"
                    />
                    <SelectField
                      id="basic-semester"
                      label="Semester"
                      value={draft.basic.semester}
                      onChange={(value) => setBasic("semester", value)}
                      error={errors.semester}
                      options={SEMESTERS}
                      placeholder="Select semester"
                    />
                  </div>

                  <div className="mt-6">
                    <FieldShell
                      id="basic-otherClubs"
                      label="Other clubs / communities"
                      hint="Optional. Mention the community and your role."
                      error={errors.otherClubs}
                    >
                      <textarea
                        id="basic-otherClubs"
                        rows={3}
                        maxLength={3000}
                        value={draft.basic.otherClubs}
                        onChange={(event) => setBasic("otherClubs", event.target.value)}
                        className="form-textarea"
                      />
                    </FieldShell>
                  </div>

                  <ButtonBar>
                    <span />
                    <button type="submit" className="btn btn-primary">
                      Continue to teams →
                    </button>
                  </ButtonBar>
                </form>
              )}

              {draft.step === 2 && (
                <section>
                  <StepHeading ref={headingRef} title="Choose your" accent="team">
                    Open a team to hear from its lead, then continue with the one you want.
                    {TEAM_GUIDE_URL && (
                      <>
                        {" "}
                        <a
                          href={TEAM_GUIDE_URL}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-white underline underline-offset-4 hover:text-[var(--color-red)]"
                        >
                          Read what each team does
                        </a>
                        .
                      </>
                    )}
                  </StepHeading>

                  <TeamPicker selected={draft.team} onChoose={chooseTeam} />

                  <ButtonBar>
                    <button type="button" className="btn btn-secondary" onClick={() => goTo(1)}>
                      ← Back to your details
                    </button>
                    <span />
                  </ButtonBar>
                </section>
              )}

              {draft.step === 3 && team && (
                <form onSubmit={submitApplication} noValidate>
                  <StepHeading ref={headingRef} title={team.name} accent="questions">
                    Applying as {draft.basic.name.trim()}.{" "}
                    <button
                      type="button"
                      onClick={() => goTo(2)}
                      className="cursor-pointer text-white underline underline-offset-4 hover:text-[var(--color-red)]"
                    >
                      Change team
                    </button>
                  </StepHeading>

                  <ol className="flex flex-col gap-10">
                    {team.questions.map((question, index) => (
                      <li key={question.key}>
                        <QuestionField
                          number={index + 1}
                          question={question}
                          value={draft.answers[team.slug]?.[question.key] ?? ""}
                          onChange={(value) => setAnswer(team.slug, question.key, value)}
                          error={errors[question.key]}
                          disabled={submitting}
                        />
                      </li>
                    ))}
                  </ol>

                  {/* Bot trap: hidden from people, so only bots fill it. */}
                  <div aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
                    <label>
                      Website
                      <input
                        type="text"
                        tabIndex={-1}
                        autoComplete="off"
                        value={website}
                        onChange={(event) => setWebsite(event.target.value)}
                      />
                    </label>
                  </div>

                  <ButtonBar>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => goTo(2)}
                      disabled={submitting}
                    >
                      ← Back to teams
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary disabled:cursor-wait disabled:opacity-60"
                      disabled={submitting}
                    >
                      {submitting ? "Submitting…" : "Submit application"}
                    </button>
                  </ButtonBar>
                </form>
              )}
            </>
          )}
        </div>
      </div>

      <div className="h-[2px] w-full bg-[var(--color-red)]" />
    </main>
  );
}

/* ------------------------------------------------------------------ */
/* Small building blocks                                               */
/* ------------------------------------------------------------------ */

function Progress({
  current,
  allowed,
  onPick,
}: {
  current: Step;
  allowed: Step;
  onPick: (step: Step) => void;
}) {
  return (
    <nav aria-label="Application steps" className="mb-10 mt-8">
      <ol className="grid grid-cols-3 gap-2">
        {STEP_NAMES.map((name, index) => {
          const step = (index + 1) as Step;
          const reachable = step <= allowed && step !== current;
          const tone =
            step === current
              ? "border-[var(--color-red)] text-white"
              : step < current
                ? "border-white/60 text-gray-300"
                : "border-white/15 text-gray-500";
          return (
            <li key={name}>
              <button
                type="button"
                disabled={!reachable}
                aria-current={step === current ? "step" : undefined}
                onClick={() => onPick(step)}
                className={`w-full border-t-2 pt-3 text-left text-xs font-semibold uppercase tracking-wide sm:text-sm ${tone} ${
                  reachable ? "cursor-pointer hover:text-white" : "cursor-default"
                }`}
              >
                <span className="mr-1 text-gray-500">{step}.</span>
                {name}
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function StepHeading({
  ref,
  title,
  accent,
  children,
}: {
  ref: React.Ref<HTMLHeadingElement>;
  title: string;
  accent: string;
  children: React.ReactNode;
}) {
  return (
    <header className="mb-10">
      <h1
        ref={ref}
        tabIndex={-1}
        className="text-3xl font-bold leading-tight tracking-tight outline-none md:text-5xl"
      >
        {title} <span className="text-[var(--color-red)]">{accent}</span>
      </h1>
      <p className="mt-4 text-base leading-relaxed text-gray-400">{children}</p>
    </header>
  );
}

function ButtonBar({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-12 flex flex-col-reverse gap-4 border-t border-white/10 pt-8 sm:flex-row sm:items-center sm:justify-between">
      {children}
    </div>
  );
}

function FieldShell({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string;
  label: React.ReactNode;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-semibold text-white">
        {label}
      </label>
            {children}
      {hint && <p className="text-xs text-gray-500">{hint}</p>}
      {error && (
        <p id={`${id}-error`} className="text-sm text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}

const INVALID = "!border-red-500";

function TextField({
  id,
  label,
  hint,
  value,
  onChange,
  error,
  type = "text",
  ...rest
}: {
  id: string;
  label: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  type?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value" | "id" | "type">) {
  return (
    <FieldShell id={id} label={label} hint={hint} error={error}>
      <input
        id={id}
        type={type}
        value={value}
        maxLength={200}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
                className={`form-input h-14 placeholder:text-white/30 ${error ? INVALID : ""}`}
        {...rest}
      />
    </FieldShell>
  );
}

function SelectField({
  id,
  label,
  value,
  onChange,
  error,
  options,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  options: readonly string[];
  placeholder: string;
}) {
  return (
    <FieldShell id={id} label={label} error={error}>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`form-select [&>option]:bg-black ${value ? "" : "text-white/40"} ${
          error ? INVALID : ""
        }`}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </FieldShell>
  );
}

function QuestionField({
  number,
  question,
  value,
  onChange,
  error,
  disabled,
}: {
  number: number;
  question: Question;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled: boolean;
}) {
  const id = `q-${question.key}`;
  const shared = {
    id,
    value,
    disabled,
    placeholder: question.placeholder,
    "aria-invalid": error ? (true as const) : undefined,
    "aria-describedby": error ? `${id}-error` : undefined,
  };

  return (
    <div className="flex flex-col gap-4">
      <label htmlFor={id} className="text-lg font-semibold leading-snug text-white">
        <span className="mr-2 text-[var(--color-red)]">{number}.</span>
        {question.label}
        {question.optional && (
          <span className="ml-2 text-sm font-normal text-gray-500">(optional)</span>
        )}
      </label>

      {question.images && (
        <div className={`grid gap-4 ${question.images.length > 1 ? "sm:grid-cols-2" : ""}`}>
          {question.images.map((image) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={image.src}
              src={image.src}
              alt={image.alt}
              loading="lazy"
              decoding="async"
              className="max-h-[480px] w-full rounded-lg border border-white/10 object-contain"
            />
          ))}
        </div>
      )}

      {question.videoId && (
        <LiteVideo id={question.videoId} title={question.videoTitle ?? "Video for this question"} />
      )}

      {question.kind === "long" ? (
        <textarea
          {...shared}
          rows={question.rows ?? 3}
          maxLength={question.maxLength ?? 3000}
          onChange={(event) => onChange(event.target.value)}
          className={`form-textarea placeholder:text-white/30 ${error ? INVALID : ""}`}
        />
      ) : (
        <input
          {...shared}
          type={question.kind === "url" ? "url" : "text"}
          inputMode={question.kind === "url" ? "url" : undefined}
          maxLength={question.maxLength ?? 200}
          onChange={(event) => onChange(event.target.value)}
          className={`form-input placeholder:text-white/30 ${error ? INVALID : ""}`}
        />
      )}

      {error && (
        <p id={`${id}-error`} className="text-sm text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}

/**
 * A YouTube video that costs nothing until someone presses play.
 * It shows only the thumbnail picture first. The real player (which is heavy)
 * is loaded after the click.
 */
function LiteVideo({ id, title }: { id: string; title: string }) {
  const [playing, setPlaying] = useState(false);

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-white/10 bg-neutral-900">
      {playing ? (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 h-full w-full border-0"
        />
      ) : (
        <button
          type="button"
          onClick={() => setPlaying(true)}
          aria-label={`Play video: ${title}`}
          className="group absolute inset-0 h-full w-full cursor-pointer"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`}
            alt=""
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover opacity-70 group-hover:opacity-90"
          />
          <span className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[var(--color-red)] shadow-xl group-hover:scale-110">
            <svg viewBox="0 0 24 24" className="ml-1 h-7 w-7 fill-white" aria-hidden="true">
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
        </button>
      )}
    </div>
  );
}

function TeamPicker({
  selected,
  onChoose,
}: {
  selected: string;
  onChoose: (slug: string) => void;
}) {
  const [open, setOpen] = useState(selected);

  return (
    <ul className="flex flex-col gap-3">
      {TEAMS.map((team) => (
        <TeamRow
          key={team.slug}
          team={team}
          isOpen={open === team.slug}
          isSelected={selected === team.slug}
          onToggle={() => setOpen(open === team.slug ? "" : team.slug)}
          onChoose={() => onChoose(team.slug)}
        />
      ))}
    </ul>
  );
}

function TeamRow({
  team,
  isOpen,
  isSelected,
  onToggle,
  onChoose,
}: {
  team: Team;
  isOpen: boolean;
  isSelected: boolean;
  onToggle: () => void;
  onChoose: () => void;
}) {
  const panelId = `team-panel-${team.slug}`;

  return (
    <li
      className={`rounded-xl border ${
        isOpen ? "border-[var(--color-red)] bg-white/[0.04]" : "border-white/10 bg-white/[0.02]"
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={panelId}
        className="team-toggle flex w-full cursor-pointer items-center justify-between gap-4 rounded-xl px-5 py-4 text-left"
      >
        <span>
          <span className="block text-lg font-bold text-white">
            {team.name}
            {isSelected && (
              <span className="ml-3 align-middle text-xs font-semibold uppercase tracking-wide text-[var(--color-red)]">
                Your current choice
              </span>
            )}
          </span>
          <span className="mt-1 block text-sm leading-relaxed text-gray-400">{team.blurb}</span>
        </span>
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          className={`h-5 w-5 shrink-0 fill-none stroke-current stroke-2 text-gray-400 ${
            isOpen ? "rotate-180" : ""
          }`}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div id={panelId} className="flex flex-col gap-5 px-5 pb-5 pt-3">
          {team.videoId && <LiteVideo id={team.videoId} title={`${team.name} team lead`} />}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-gray-400">
              {team.questions.length} questions come next. You can switch teams until you submit.
            </p>
            <button type="button" onClick={onChoose} className="btn btn-primary shrink-0">
              Continue with {team.name} →
            </button>
          </div>
        </div>
      )}
    </li>
  );
}

function Done({ headingRef }: { headingRef: React.Ref<HTMLHeadingElement> }) {
  return (
    <section className="flex min-h-[70vh] flex-col items-center justify-center text-center">
      <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-full border-2 border-[var(--color-red)] bg-red-600/10">
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          className="h-10 w-10 fill-none stroke-[var(--color-red)] stroke-[2.5]"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h1
        ref={headingRef}
        tabIndex={-1}
        className="text-3xl font-bold leading-tight tracking-tight outline-none md:text-5xl"
      >
        Application <span className="text-[var(--color-red)]">submitted</span>
      </h1>
      <p className="mt-6 max-w-xl leading-relaxed text-gray-300">
        Thank you for applying to TEDxCITBengaluru. We&apos;ve received your application and our
        team will review it carefully.
      </p>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-gray-400">
        Please check your email regularly for updates and next steps.
      </p>
      <Link href="/" className="btn btn-primary mt-10">
        Return to home
      </Link>
      <p className="mt-12 border-t border-white/10 pt-6 text-sm text-gray-500">
        Questions? Write to{" "}
        <a
          href="mailto:tedxcitbengaluru@cambridge.edu.in"
          className="text-[var(--color-red)] hover:underline"
        >
          tedxcitbengaluru@cambridge.edu.in
        </a>
      </p>
    </section>
  );
}

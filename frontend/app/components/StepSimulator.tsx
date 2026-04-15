import { motion, AnimatePresence } from "motion/react";
import { useEffect, useRef, useState } from "react";
import type { CodeConfig } from "~/lib/codeConfig";

export type SimStep = { text: string };

type Props = {
  pendingSteps: SimStep[];
  successSteps: SimStep[];
  errorText: string;
  isVisible: boolean;
  isDone: boolean;
  isSuccess: boolean;
  isError: boolean;
  codeConfig: CodeConfig;
  onComplete?: () => void;
};

const STEP_DELAY_MS = 1150;

export function StepSimulator({
  pendingSteps,
  successSteps,
  errorText,
  isVisible,
  isDone,
  isSuccess,
  isError,
  codeConfig,
  onComplete,
}: Props) {
  const [pendingCount, setPendingCount] = useState(0);
  const [successCount, setSuccessCount] = useState(0);
  const [inResultPhase, setInResultPhase] = useState(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (!isVisible) {
      setPendingCount(0);
      setSuccessCount(0);
      setInResultPhase(false);
      return;
    }
    setPendingCount(1);
    setSuccessCount(0);
    setInResultPhase(false);
  }, [isVisible]);

  useEffect(() => {
    if (!isVisible || pendingCount === 0 || pendingCount >= pendingSteps.length)
      return;
    const t = setTimeout(() => setPendingCount((c) => c + 1), STEP_DELAY_MS);
    return () => clearTimeout(t);
  }, [isVisible, pendingCount, pendingSteps.length]);

  // Skifter til resultatfasen når alle ventende trin er vist OG API'et har svaret
  useEffect(() => {
    if (inResultPhase) return;
    if (pendingCount < pendingSteps.length) return;
    if (!isDone) return;

    const t = setTimeout(() => {
      setInResultPhase(true);
      if (isSuccess) setSuccessCount(1);
    }, 400);
    return () => clearTimeout(t);
  }, [inResultPhase, pendingCount, pendingSteps.length, isDone, isSuccess]);

  useEffect(() => {
    if (
      !inResultPhase ||
      !isSuccess ||
      successCount === 0 ||
      successCount >= successSteps.length
    )
      return;
    const t = setTimeout(() => setSuccessCount((c) => c + 1), STEP_DELAY_MS);
    return () => clearTimeout(t);
  }, [inResultPhase, isSuccess, successCount, successSteps.length]);

  // Kalder onComplete en gang efter det sidste succestrin er vist
  useEffect(() => {
    if (!inResultPhase || !isSuccess) return;
    if (successCount < successSteps.length) return;
    const t = setTimeout(() => onCompleteRef.current?.(), 900);
    return () => clearTimeout(t);
  }, [inResultPhase, isSuccess, successCount, successSteps.length]);

  const activeLines: number[] = (() => {
    if (inResultPhase) {
      if (isError) return codeConfig.errorHighlights;
      if (isSuccess && successCount > 0) {
        return codeConfig.successHighlights[successCount - 1] ?? [];
      }
      return [];
    }
    if (pendingCount > 0) {
      return codeConfig.pendingHighlights[pendingCount - 1] ?? [];
    }
    return [];
  })();

  const allPendingShown = pendingCount >= pendingSteps.length;
  const waitingForApi = allPendingShown && !isDone;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="w-full rounded-xl border border-white/10 bg-gray-900/70 backdrop-blur-sm overflow-hidden"
        >
          <div className="flex items-center gap-2 px-5 py-3 border-b border-white/8">
            <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            <span className="text-xs font-semibold uppercase tracking-widest text-indigo-400">
              Backend-proces
            </span>
          </div>

          <div className="flex flex-col md:flex-row min-h-[260px]">
            <div className="md:w-[42%] shrink-0 p-5 space-y-3 border-b md:border-b-0 md:border-r border-white/8">
              {pendingSteps.slice(0, pendingCount).map((step, i) => {
                const isLast = i === pendingCount - 1;
                const isActive = isLast && !allPendingShown;
                return (
                  <StepRow
                    key={`p-${i}`}
                    text={step.text}
                    status={isActive ? "active" : "done"}
                  />
                );
              })}

              <AnimatePresence>
                {waitingForApi && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2 pl-7"
                  >
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className="w-1.5 h-1.5 rounded-full bg-indigo-400"
                        animate={{ opacity: [0.2, 1, 0.2] }}
                        transition={{
                          duration: 1.4,
                          delay: i * 0.25,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                      />
                    ))}
                    <span className="text-xs text-gray-600">
                      Venter på svar...
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {inResultPhase &&
                  isSuccess &&
                  successSteps.slice(0, successCount).map((step, i) => {
                    const isLast = i === successCount - 1;
                    const allDone = successCount >= successSteps.length;
                    return (
                      <StepRow
                        key={`s-${i}`}
                        text={step.text}
                        status={
                          isLast && allDone
                            ? "success"
                            : isLast
                              ? "active"
                              : "done"
                        }
                      />
                    );
                  })}
              </AnimatePresence>

              <AnimatePresence>
                {inResultPhase && isError && (
                  <StepRow text={errorText} status="error" />
                )}
              </AnimatePresence>
            </div>

            <div className="flex-1 flex flex-col min-w-0 bg-gray-950/60">
              <div className="flex items-center gap-2 px-4 py-2 border-b border-white/8 bg-gray-950/40">
                <CSharpIcon />
                <span className="text-xs text-gray-500 font-mono">
                  {codeConfig.fileName}
                </span>
              </div>

              <div className="flex-1 overflow-auto py-2">
                {codeConfig.lines.map((line, i) => {
                  const isHighlighted = activeLines.includes(i);
                  const highlightColor =
                    inResultPhase && isError
                      ? "bg-rose-500/12 border-l-2 border-rose-500"
                      : "bg-indigo-500/12 border-l-2 border-indigo-500";

                  return (
                    <div
                      key={i}
                      className={`flex items-start px-3 transition-all duration-300 border-l-2 ${
                        isHighlighted ? highlightColor : "border-transparent"
                      }`}
                    >
                      <span
                        className={`w-7 shrink-0 text-right mr-3 text-[10px] leading-5 select-none font-mono transition-colors duration-300 ${
                          isHighlighted ? "text-indigo-400" : "text-gray-700"
                        }`}
                      >
                        {i + 1}
                      </span>
                      <span
                        className={`font-mono text-[11px] leading-5 whitespace-pre transition-opacity duration-300 ${
                          isHighlighted ? "opacity-100" : "opacity-20"
                        }`}
                      >
                        {line ? <CodeLine text={line} /> : <span>&nbsp;</span>}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Trin-række

type StepStatus = "active" | "done" | "success" | "error";

function StepRow({ text, status }: { text: string; status: StepStatus }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.28, ease: "easeOut" }}
      className="flex items-start gap-3"
    >
      <span className="mt-0.5 shrink-0">
        {status === "active" && <SpinnerIcon />}
        {status === "done" && <CheckIcon className="text-gray-600" />}
        {status === "success" && <CheckIcon className="text-emerald-400" />}
        {status === "error" && <ErrorIcon />}
      </span>
      <span
        className={`text-sm leading-relaxed ${
          status === "active"
            ? "text-white font-medium"
            : status === "success"
              ? "text-emerald-400 font-semibold"
              : status === "error"
                ? "text-rose-400 font-semibold"
                : "text-gray-400"
        }`}
      >
        {text}
      </span>
    </motion.div>
  );
}

// Syntaksfremhæver
const KEYWORDS = new Set([
  "var",
  "new",
  "return",
  "if",
  "out",
  "null",
  "is",
  "not",
  "with",
  "using",
  "record",
  "void",
  "string",
  "bool",
  "int",
  "async",
  "await",
]);
const KNOWN_TYPES = new Set([
  "Results",
  "BCrypt",
  "Net",
  "HttpContext",
  "TimeSpan",
  "SameSiteMode",
  "AppDbContext",
  "User",
  "LoginRequest",
  "RegisterRequest",
  "ChangePasswordRequest",
  "Session",
]);

type Token = { text: string; className: string };

function tokenizeLine(raw: string): Token[] {
  const trimmed = raw.trimStart();

  if (trimmed.startsWith("//")) {
    const indent = raw.slice(0, raw.length - trimmed.length);
    return [
      { text: indent, className: "" },
      { text: trimmed, className: "text-gray-500 italic" },
    ];
  }

  const tokens: Token[] = [];
  let i = 0;

  while (i < raw.length) {
    if (raw[i] === " ") {
      let j = i;
      while (j < raw.length && raw[j] === " ") j++;
      tokens.push({ text: raw.slice(i, j), className: "" });
      i = j;
      continue;
    }

    // Streng-literal (håndterer escaped anførselstegn naivt — tilstrækkeligt for vores kode)
    if (raw[i] === '"') {
      let j = i + 1;
      while (j < raw.length && raw[j] !== '"') j++;
      tokens.push({ text: raw.slice(i, j + 1), className: "text-amber-300" });
      i = j + 1;
      continue;
    }

    if (/[a-zA-Z_]/.test(raw[i])) {
      let j = i;
      while (j < raw.length && /[a-zA-Z0-9_]/.test(raw[j])) j++;
      const word = raw.slice(i, j);
      const next = raw[j];
      let cls: string;
      if (KEYWORDS.has(word)) cls = "text-violet-400";
      else if (KNOWN_TYPES.has(word)) cls = "text-sky-400";
      else if (next === "(") cls = "text-teal-300";
      else cls = "text-gray-200";
      tokens.push({ text: word, className: cls });
      i = j;
      continue;
    }

    if (/\d/.test(raw[i])) {
      let j = i;
      while (j < raw.length && /\d/.test(raw[j])) j++;
      tokens.push({ text: raw.slice(i, j), className: "text-orange-300" });
      i = j;
      continue;
    }

    const ch = raw[i];
    let cls = "text-gray-400";
    if ("(){};,".includes(ch)) cls = "text-gray-500";
    else if ("=!<>&|".includes(ch)) cls = "text-pink-400";
    else if (ch === "." || ch === "[" || ch === "]") cls = "text-gray-500";
    tokens.push({ text: ch, className: cls });
    i++;
  }

  return tokens;
}

function CodeLine({ text }: { text: string }) {
  const tokens = tokenizeLine(text);
  return (
    <>
      {tokens.map((t, i) => (
        <span key={i} className={t.className}>
          {t.text}
        </span>
      ))}
    </>
  );
}

// Ikoner
function SpinnerIcon() {
  return (
    <svg
      className="w-4 h-4 text-indigo-400 animate-spin"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      />
    </svg>
  );
}

function CheckIcon({ className }: { className: string }) {
  return (
    <svg
      className={`w-4 h-4 ${className}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2.5}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function ErrorIcon() {
  return (
    <svg
      className="w-4 h-4 text-rose-400"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  );
}

function CSharpIcon() {
  return (
    <svg
      className="w-3.5 h-3.5 text-violet-500"
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M11.5 15.97l.41 2.44c-.26.14-.68.27-1.24.39-.57.13-1.24.2-2.01.2-2.21-.04-3.87-.7-4.98-1.96C2.56 15.77 2 14.16 2 12.15c.05-2.29.72-4.08 2.02-5.38 1.3-1.3 3.01-1.95 5.15-1.95.76 0 1.43.07 2 .19s.97.25 1.21.38l-.58 2.45-.92-.27c-.34-.09-.73-.13-1.17-.13-1.08.02-1.89.33-2.43.92-.54.59-.82 1.38-.83 2.38-.01 1.93.97 2.94 2.93 3.05.47.02.91-.03 1.32-.13l.9-.28zM13.89 19l.61-4H13l.34-2h1.5l.32-2h-1.5L14 9h1.5l.61-4h2l-.61 4H19l.61-4h2l-.61 4H22.5l-.34 2H20.5l-.32 2h1.5l-.34 2h-1.5l-.61 4h-2l.61-4H16l-.61 4h-1.5zm2.07-6h1.5l.32-2h-1.5l-.32 2z" />
    </svg>
  );
}

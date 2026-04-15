import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "motion/react";
import { api } from "~/lib/api";
import { registerCode } from "~/lib/codeConfig";
import { StepSimulator } from "~/components/StepSimulator";

export function meta() {
  return [{ title: "Opret konto — AuthFlow" }];
}

const REGISTER_PENDING_STEPS = [
  { text: "Sender registreringsanmodning til backend..." },
  { text: "Validerer at felter ikke er tomme..." },
  { text: "Validerer brugernavn (min. 3 tegn)..." },
  { text: "Validerer kodeord (min. 6 tegn)..." },
  { text: "Søger i databasen efter brugernavnet..." },
  { text: "Hasher kodeord med bcrypt (work factor 12)..." },
];

const REGISTER_SUCCESS_STEPS = [
  { text: "Brugernavnet var ledigt!" },
  { text: "Gemmer ny bruger i databasen..." },
  { text: "Konto oprettet!" },
];

export default function Register() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: me, isLoading: meLoading } = useQuery({
    queryKey: ["me"],
    queryFn: api.me,
  });

  useEffect(() => {
    if (!meLoading && me?.username) navigate("/account", { replace: true });
  }, [me, meLoading, navigate]);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [simVisible, setSimVisible] = useState(false);
  const [localError, setLocalError] = useState("");

  const mutation = useMutation({
    mutationFn: () => api.register(username, password),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["me"] });
    },
    onError: () => {
      setTimeout(() => setSimVisible(false), 4500);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError("");
    if (password !== confirm) {
      setLocalError("Kodeordene stemmer ikke overens.");
      return;
    }
    setSimVisible(false);
    mutation.reset();
    requestAnimationFrame(() => {
      setSimVisible(true);
      mutation.mutate();
    });
  };

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center px-4 py-12">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-130 h-130 bg-violet-600/12 rounded-full blur-[110px]" />
        <div className="absolute -bottom-32 -right-32 w-130 h-130 bg-indigo-600/12 rounded-full blur-[110px]" />
        <div className="absolute top-1/3 left-1/3 w-65 h-65 bg-violet-400/6 rounded-full blur-[70px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-140 h-140 rounded-full border border-white/4.5" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-230 h-230 rounded-full border border-white/2.5" />
      </div>

      <div className="relative w-full flex flex-col items-center gap-5">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="w-full max-w-md"
        >
          <div className="mb-8 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-violet-500/10 border border-violet-500/20 mb-4">
              <UserPlusIcon />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Opret konto
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Kom i gang på et øjeblik
            </p>
          </div>

          <div className="rounded-xl border border-white/10 bg-gray-900/50 backdrop-blur-sm p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <Field
                label="Brugernavn"
                type="text"
                value={username}
                onChange={setUsername}
                placeholder="dit_brugernavn"
                hint="Mindst 3 tegn"
                disabled={mutation.isPending}
              />
              <Field
                label="Kodeord"
                type="password"
                value={password}
                onChange={setPassword}
                placeholder="••••••••"
                hint="Mindst 6 tegn"
                disabled={mutation.isPending}
              />
              <Field
                label="Bekræft kodeord"
                type="password"
                value={confirm}
                onChange={setConfirm}
                placeholder="••••••••"
                disabled={mutation.isPending}
              />

              <AnimatePresence>
                {(localError || (mutation.isError && !simVisible)) && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="text-rose-400 text-sm py-1"
                  >
                    {localError || mutation.error?.message}
                  </motion.p>
                )}
              </AnimatePresence>

              <button
                type="submit"
                disabled={
                  mutation.isPending || !username || !password || !confirm
                }
                className="w-full py-2.5 px-4 rounded-lg font-semibold text-sm text-white
                  bg-gradient-to-r from-violet-600 to-indigo-600
                  hover:from-violet-500 hover:to-indigo-500
                  disabled:opacity-50 disabled:cursor-not-allowed
                  transition-all duration-150 active:scale-[0.98]
                  shadow-lg shadow-violet-500/20"
              >
                {mutation.isPending ? "Opretter konto..." : "Opret konto"}
              </button>
            </form>
          </div>

          <p className="text-center text-sm text-gray-500 mt-5">
            Har du allerede en konto?{" "}
            <Link
              to="/login"
              className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
            >
              Log ind her
            </Link>
          </p>
        </motion.div>

        <div className="w-full max-w-3xl">
          <StepSimulator
            pendingSteps={REGISTER_PENDING_STEPS}
            successSteps={REGISTER_SUCCESS_STEPS}
            errorText={mutation.error?.message ?? "Noget gik galt."}
            isVisible={simVisible}
            isDone={mutation.isSuccess || mutation.isError}
            isSuccess={mutation.isSuccess}
            isError={mutation.isError}
            codeConfig={registerCode}
            onComplete={() => navigate("/login")}
          />
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  type,
  value,
  onChange,
  placeholder,
  hint,
  disabled,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  hint?: string;
  disabled?: boolean;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1.5">
        <label className="text-sm font-medium text-gray-300">{label}</label>
        {hint && <span className="text-xs text-gray-600">{hint}</span>}
      </div>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        required
        className="w-full px-3.5 py-2.5 rounded-md bg-gray-800/80 border border-white/10
          text-white placeholder:text-gray-600 text-sm
          focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50
          disabled:opacity-50 transition-all duration-150"
      />
    </div>
  );
}

function UserPlusIcon() {
  return (
    <svg
      className="w-6 h-6 text-violet-400"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
      />
    </svg>
  );
}

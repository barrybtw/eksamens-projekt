import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "motion/react";
import { api } from "~/lib/api";
import { loginCode } from "~/lib/codeConfig";
import { StepSimulator } from "~/components/StepSimulator";

export function meta() {
  return [{ title: "Log ind — AuthFlow" }];
}

const LOGIN_PENDING_STEPS = [
  { text: "Sender loginoplysninger til backend..." },
  { text: "Søger i databasen efter brugernavnet..." },
  { text: "Verificerer kodeordet med bcrypt..." },
];

const LOGIN_SUCCESS_STEPS = [
  { text: "Bruger fundet og kodeord korrekt!" },
  { text: "Opretter en ny session på serveren..." },
  { text: "Sender session-cookie til browseren..." },
  { text: "Du er nu logget ind!" },
];

export default function Login() {
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
  const [simVisible, setSimVisible] = useState(false);

  const mutation = useMutation({
    mutationFn: () => api.login(username, password),
    onError: () => {
      setTimeout(() => setSimVisible(false), 4000);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSimVisible(false);
    mutation.reset();
    // Kort forsinkelse så AnimatePresence kan afslutte exit-animationen inden genindtræden
    requestAnimationFrame(() => {
      setSimVisible(true);
      mutation.mutate();
    });
  };

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center px-4 py-12">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-[520px] h-[520px] bg-indigo-600/12 rounded-full blur-[110px]" />
        <div className="absolute -bottom-32 -left-32 w-[520px] h-[520px] bg-violet-600/12 rounded-full blur-[110px]" />
        <div className="absolute top-1/3 right-1/3 w-[260px] h-[260px] bg-indigo-400/6 rounded-full blur-[70px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[560px] h-[560px] rounded-full border border-white/[0.045]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[920px] h-[920px] rounded-full border border-white/[0.025]" />
      </div>

      <div className="relative w-full flex flex-col items-center gap-5">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="w-full max-w-md"
        >
          <div className="mb-8 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 mb-4">
              <LockIcon />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Log ind
            </h1>
            <p className="text-gray-500 text-sm mt-1">Velkommen tilbage</p>
          </div>

          <div className="rounded-xl border border-white/10 bg-gray-900/50 backdrop-blur-sm p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <Field
                label="Brugernavn"
                type="text"
                value={username}
                onChange={setUsername}
                placeholder="dit_brugernavn"
                disabled={mutation.isPending}
              />
              <Field
                label="Kodeord"
                type="password"
                value={password}
                onChange={setPassword}
                placeholder="••••••••"
                disabled={mutation.isPending}
              />

              <AnimatePresence>
                {mutation.isError && !simVisible && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="text-rose-400 text-sm py-1"
                  >
                    {mutation.error?.message ??
                      "Forkert brugernavn eller kodeord."}
                  </motion.p>
                )}
              </AnimatePresence>

              <button
                type="submit"
                disabled={mutation.isPending || !username || !password}
                className="w-full py-2.5 px-4 rounded-lg font-semibold text-sm text-white
                  bg-gradient-to-r from-indigo-600 to-violet-600
                  hover:from-indigo-500 hover:to-violet-500
                  disabled:opacity-50 disabled:cursor-not-allowed
                  transition-all duration-150 active:scale-[0.98]
                  shadow-lg shadow-indigo-500/20"
              >
                {mutation.isPending ? "Logger ind..." : "Log ind"}
              </button>
            </form>
          </div>

          <p className="text-center text-sm text-gray-500 mt-5">
            Ingen konto?{" "}
            <Link
              to="/register"
              className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
            >
              Opret en her
            </Link>
          </p>
        </motion.div>

        <div className="w-full max-w-3xl">
          <StepSimulator
            pendingSteps={LOGIN_PENDING_STEPS}
            successSteps={LOGIN_SUCCESS_STEPS}
            errorText={
              mutation.error?.message ?? "Forkert brugernavn eller kodeord."
            }
            isVisible={simVisible}
            isDone={mutation.isSuccess || mutation.isError}
            isSuccess={mutation.isSuccess}
            isError={mutation.isError}
            codeConfig={loginCode}
            onComplete={() => {
              queryClient.invalidateQueries({ queryKey: ["me"] });
              navigate("/account");
            }}
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
  disabled,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-1.5">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        required
        className="w-full px-3.5 py-2.5 rounded-md bg-gray-800/80 border border-white/10
          text-white placeholder:text-gray-600 text-sm
          focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50
          disabled:opacity-50 transition-all duration-150"
      />
    </div>
  );
}

function LockIcon() {
  return (
    <svg
      className="w-6 h-6 text-indigo-400"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
      />
    </svg>
  );
}

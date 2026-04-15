import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "motion/react";
import { api } from "~/lib/api";
import { logoutCode, changePasswordCode, deleteCode } from "~/lib/codeConfig";
import { StepSimulator } from "~/components/StepSimulator";

export function meta() {
  return [{ title: "Min konto — AuthFlow" }];
}

const LOGOUT_PENDING_STEPS = [
  { text: "Sender logout-anmodning til backend..." },
  { text: "Backend finder session via cookie..." },
  { text: "Sletter session fra serverens hukommelse..." },
];
const LOGOUT_SUCCESS_STEPS = [
  { text: "Session slettet! Fjerner cookie fra browseren..." },
  { text: "Du er nu logget ud." },
];

const CHANGE_PASSWORD_PENDING_STEPS = [
  { text: "Sender kodeordsskift til backend..." },
  { text: "Verificerer din aktive session..." },
  { text: "Slår bruger op i databasen..." },
  { text: "Verificerer nuværende kodeord med bcrypt..." },
  { text: "Validerer nyt kodeord (min. 6 tegn)..." },
];
const CHANGE_PASSWORD_SUCCESS_STEPS = [
  { text: "Kodeord korrekt! Hasher det nye kodeord..." },
  { text: "Det nye hash gemmes — det gamle kasseres..." },
  { text: "Kodeord ændret!" },
];

const DELETE_PENDING_STEPS = [
  { text: "Sender sletningsanmodning til backend..." },
  { text: "Verificerer din aktive session..." },
  { text: "Sletter din bruger fra databasen..." },
];
const DELETE_SUCCESS_STEPS = [
  { text: "Bruger slettet! Invaliderer session..." },
  { text: "Cookie fjernet. Sender dig til login..." },
];

type ActiveSim = "logout" | "changePassword" | "delete" | null;

export default function Account() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: me, isLoading } = useQuery({
    queryKey: ["me"],
    queryFn: api.me,
  });

  useEffect(() => {
    if (!isLoading && !me?.username) navigate("/login", { replace: true });
  }, [me, isLoading, navigate]);

  const [activeSim, setActiveSim] = useState<ActiveSim>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [localError, setLocalError] = useState("");
  const [showChangeForm, setShowChangeForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const logoutMutation = useMutation({
    mutationFn: api.logout,
    onError: () => setTimeout(() => setActiveSim(null), 3000),
  });

  const changePasswordMutation = useMutation({
    mutationFn: () => api.changePassword(currentPassword, newPassword),
    onSuccess: () => {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: () => setTimeout(() => setActiveSim(null), 4000),
  });

  const deleteMutation = useMutation({
    mutationFn: api.deleteAccount,
    onError: () => setTimeout(() => setActiveSim(null), 3000),
  });

  const handleLogout = () => {
    setActiveSim("logout");
    logoutMutation.reset();
    logoutMutation.mutate();
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError("");
    if (newPassword !== confirmPassword) {
      setLocalError("De nye kodeord stemmer ikke overens.");
      return;
    }
    setActiveSim("changePassword");
    changePasswordMutation.reset();
    changePasswordMutation.mutate();
  };

  const handleDelete = () => {
    setActiveSim("delete");
    deleteMutation.reset();
    deleteMutation.mutate();
  };

  if (isLoading || !me?.username) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 px-4 py-12">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-[480px] h-[480px] bg-indigo-600/10 rounded-full blur-[100px]" />
        <div className="absolute -bottom-32 -left-32 w-[480px] h-[480px] bg-violet-600/10 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[560px] h-[560px] rounded-full border border-white/[0.04]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] rounded-full border border-white/[0.022]" />
      </div>

      <div className="relative flex flex-col items-center gap-4">
        <div className="w-full max-w-md space-y-4">
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="text-center mb-6"
          >
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-emerald-500/10 border border-emerald-500/20 mb-4">
              <UserIcon />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Hej, {me.username}
            </h1>
            <p className="text-gray-500 text-sm mt-1">Du er logget ind</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05 }}
            className="rounded-xl border border-white/10 bg-gray-900/50 backdrop-blur-sm p-5"
          >
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
              <span className="text-sm text-gray-300">
                Session aktiv — autentificeret via session-cookie
              </span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="rounded-xl border border-white/10 bg-gray-900/50 backdrop-blur-sm overflow-hidden"
          >
            <button
              onClick={() => {
                setShowChangeForm((v) => !v);
                setLocalError("");
                changePasswordMutation.reset();
              }}
              className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-white/5 transition-colors duration-150"
            >
              <div className="flex items-center gap-3">
                <KeyIcon />
                <span className="font-medium text-white text-sm">
                  Skift kodeord
                </span>
              </div>
              <motion.span
                animate={{ rotate: showChangeForm ? 180 : 0 }}
                transition={{ duration: 0.2 }}
                className="text-gray-500"
              >
                <ChevronIcon />
              </motion.span>
            </button>

            <AnimatePresence>
              {showChangeForm && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <div className="px-6 pb-5 border-t border-white/5">
                    <form
                      onSubmit={handleChangePassword}
                      className="space-y-3 pt-4"
                    >
                      <Field
                        label="Nuværende kodeord"
                        type="password"
                        value={currentPassword}
                        onChange={setCurrentPassword}
                        placeholder="••••••••"
                        disabled={changePasswordMutation.isPending}
                      />
                      <Field
                        label="Nyt kodeord"
                        type="password"
                        value={newPassword}
                        onChange={setNewPassword}
                        placeholder="••••••••"
                        hint="Mindst 6 tegn"
                        disabled={changePasswordMutation.isPending}
                      />
                      <Field
                        label="Bekræft nyt kodeord"
                        type="password"
                        value={confirmPassword}
                        onChange={setConfirmPassword}
                        placeholder="••••••••"
                        disabled={changePasswordMutation.isPending}
                      />

                      <AnimatePresence>
                        {(localError || changePasswordMutation.isError) && (
                          <motion.p
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="text-rose-400 text-sm py-1"
                          >
                            {localError ||
                              changePasswordMutation.error?.message}
                          </motion.p>
                        )}
                      </AnimatePresence>

                      <button
                        type="submit"
                        disabled={
                          changePasswordMutation.isPending ||
                          !currentPassword ||
                          !newPassword ||
                          !confirmPassword
                        }
                        className="w-full py-2.5 rounded-lg font-semibold text-sm text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 active:scale-[0.98]"
                      >
                        {changePasswordMutation.isPending
                          ? "Skifter..."
                          : "Skift kodeord"}
                      </button>
                    </form>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
          >
            <button
              onClick={handleLogout}
              disabled={logoutMutation.isPending}
              className="w-full py-3 rounded-xl border border-white/10 bg-gray-900/50
                text-gray-300 hover:text-white hover:bg-white/5
                font-medium text-sm flex items-center justify-center gap-2
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-all duration-150 active:scale-[0.98]"
            >
              <LogoutIcon />
              {logoutMutation.isPending ? "Logger ud..." : "Log ud"}
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="rounded-xl border border-rose-500/10 bg-rose-950/20 backdrop-blur-sm overflow-hidden"
          >
            <button
              onClick={() => setShowDeleteConfirm((v) => !v)}
              className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-rose-500/5 transition-colors duration-150"
            >
              <div className="flex items-center gap-3">
                <TrashIcon />
                <span className="font-medium text-rose-400 text-sm">
                  Slet min konto
                </span>
              </div>
              <motion.span
                animate={{ rotate: showDeleteConfirm ? 180 : 0 }}
                transition={{ duration: 0.2 }}
                className="text-rose-600"
              >
                <ChevronIcon />
              </motion.span>
            </button>

            <AnimatePresence>
              {showDeleteConfirm && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <div className="px-6 pb-5 border-t border-rose-500/10">
                    <p className="text-sm text-gray-400 mt-4 mb-4">
                      Dette kan ikke fortrydes. Din konto og alle data slettes
                      permanent.
                    </p>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setShowDeleteConfirm(false)}
                        className="flex-1 py-2.5 rounded-xl border border-white/10 text-gray-400 hover:bg-white/5 text-sm font-medium transition-colors duration-150"
                      >
                        Annuller
                      </button>
                      <button
                        onClick={handleDelete}
                        disabled={deleteMutation.isPending}
                        className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 active:scale-[0.98]"
                      >
                        {deleteMutation.isPending ? "Sletter..." : "Slet konto"}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        <div className="w-full max-w-3xl">
          <AnimatePresence mode="wait">
            {activeSim === "changePassword" && (
              <StepSimulator
                key="changePassword"
                pendingSteps={CHANGE_PASSWORD_PENDING_STEPS}
                successSteps={CHANGE_PASSWORD_SUCCESS_STEPS}
                errorText={
                  changePasswordMutation.error?.message ?? "Noget gik galt."
                }
                isVisible
                isDone={
                  changePasswordMutation.isSuccess ||
                  changePasswordMutation.isError
                }
                isSuccess={changePasswordMutation.isSuccess}
                isError={changePasswordMutation.isError}
                codeConfig={changePasswordCode}
                onComplete={() => {
                  setActiveSim(null);
                  setShowChangeForm(false);
                }}
              />
            )}
            {activeSim === "logout" && (
              <StepSimulator
                key="logout"
                pendingSteps={LOGOUT_PENDING_STEPS}
                successSteps={LOGOUT_SUCCESS_STEPS}
                errorText="Noget gik galt ved logout."
                isVisible
                isDone={logoutMutation.isSuccess || logoutMutation.isError}
                isSuccess={logoutMutation.isSuccess}
                isError={logoutMutation.isError}
                codeConfig={logoutCode}
                onComplete={() => {
                  queryClient.clear();
                  navigate("/login", { replace: true });
                }}
              />
            )}
            {activeSim === "delete" && (
              <StepSimulator
                key="delete"
                pendingSteps={DELETE_PENDING_STEPS}
                successSteps={DELETE_SUCCESS_STEPS}
                errorText="Noget gik galt ved sletning."
                isVisible
                isDone={deleteMutation.isSuccess || deleteMutation.isError}
                isSuccess={deleteMutation.isSuccess}
                isError={deleteMutation.isError}
                codeConfig={deleteCode}
                onComplete={() => {
                  queryClient.clear();
                  navigate("/login", { replace: true });
                }}
              />
            )}
          </AnimatePresence>
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
          focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50
          disabled:opacity-50 transition-all duration-150"
      />
    </div>
  );
}

function UserIcon() {
  return (
    <svg
      className="w-7 h-7 text-emerald-400"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.8}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
      />
    </svg>
  );
}
function KeyIcon() {
  return (
    <svg
      className="w-4 h-4 text-gray-400"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
      />
    </svg>
  );
}
function LogoutIcon() {
  return (
    <svg
      className="w-4 h-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
      />
    </svg>
  );
}
function TrashIcon() {
  return (
    <svg
      className="w-4 h-4 text-rose-400"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
      />
    </svg>
  );
}
function ChevronIcon() {
  return (
    <svg
      className="w-4 h-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

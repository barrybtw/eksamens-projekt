import { useEffect } from "react";
import { useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "~/lib/api";

export function meta() {
  return [{ title: "AuthFlow" }];
}

export default function Home() {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: ["me"],
    queryFn: api.me,
  });

  useEffect(() => {
    if (isLoading) return;
    if (data?.username) {
      navigate("/account", { replace: true });
    } else {
      navigate("/login", { replace: true });
    }
  }, [data, isLoading, navigate]);

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

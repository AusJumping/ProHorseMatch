import { useEffect } from "react";
import { useLocation } from "wouter";
import {
  CreditCard,
  Heart,
  Home,
  List,
  MessageCircle,
  PlusCircle,
  Search,
} from "lucide-react";
import Layout from "@/components/Layout";
import { useAuth } from "@/lib/auth";

const Dashboard = () => {
  const [, navigate] = useLocation();
  const { user, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  if (isLoading || !user) {
    return null;
  }

  const options = [
    { label: "Find Horses", path: "/filter", icon: Home },
    { label: "My Horses", path: "/my-horses", icon: List },
    ...(user.is_selling
      ? [{ label: "Add Horse", path: "/add-horse", icon: PlusCircle }]
      : []),
    { label: "My Favourites", path: "/favorites", icon: Heart },
    { label: "Messages", path: "/messages", icon: MessageCircle },
    { label: "Saved Searches", path: "/saved-searches", icon: Search },
    { label: "Subscription", path: "/subscription", icon: CreditCard },
  ];

  const displayName =
    user.name || user.business_name || "User";

  return (
    <Layout pageTitle="Home">
      <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        <h1 className="mb-8 font-accent text-3xl font-bold text-neutral-900 sm:text-4xl">
          Welcome, {displayName}
        </h1>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {options.map(({ label, path, icon: Icon }) => (
            <button
              key={path}
              type="button"
              onClick={() => navigate(path)}
              className="group flex min-h-36 flex-col items-start justify-between rounded-xl border border-neutral-200 bg-white p-6 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#cdac6e] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#cdac6e] focus-visible:ring-offset-2"
            >
              <Icon className="h-8 w-8 text-[#cdac6e]" aria-hidden="true" />
              <span className="mt-5 text-lg font-semibold text-neutral-900 group-hover:text-[#9b793e]">
                {label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
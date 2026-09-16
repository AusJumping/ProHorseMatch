import { useEffect } from "react";
import { useLocation } from "wouter";
import {
  ArrowUpRight,
  CreditCard,
  Heart,
  House,
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
    { label: "Find Horses", description: "Browse your next prospect", path: "/filter", icon: House, featured: true },
    { label: "My Horses", description: "Manage your listings", path: "/my-horses", icon: List },
    ...(user.is_selling
      ? [{ label: "Add Horse", description: "List a new performer", path: "/add-horse", icon: PlusCircle }]
      : []),
    { label: "My Favourites", description: "Your considered horses", path: "/favorites", icon: Heart },
    { label: "Messages", description: "Keep conversations moving", path: "/messages", icon: MessageCircle },
    { label: "Saved Searches", description: "Return to your shortlists", path: "/saved-searches", icon: Search },
    { label: "Subscription", description: "Manage your membership", path: "/subscription", icon: CreditCard },
  ];

  const displayName =
    user.name || user.business_name || "User";

  return (
    <Layout pageTitle="Home">
      <div className="mx-auto w-full max-w-6xl rounded-2xl bg-[#272725] p-4 shadow-[0_18px_45px_rgba(25,24,22,0.2)] sm:p-5">
        <section
          className="relative overflow-hidden rounded-xl border border-[#cdac6e]/20 px-5 py-5 text-[#f2eee6] sm:px-7 sm:py-6"
          style={{ background: "linear-gradient(125deg, #302f2c 0%, #393630 62%, #463e31 100%)" }}
        >
          <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full border border-[#cdac6e]/20" />
          <div className="pointer-events-none absolute -right-5 -top-12 h-44 w-44 rounded-full border border-[#cdac6e]/10" />
          <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <div>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-[#cdac6e]">
                Pro Horse Match / Home
              </p>
              <h1 className="font-accent text-3xl font-bold tracking-tight sm:text-4xl">
                Welcome, {displayName}
              </h1>
              <p className="mt-2 max-w-md text-sm leading-6 text-[#c9c5bb]">
                Your considered place to discover, manage and move performance horses.
              </p>
            </div>
            <div className="hidden border-l border-[#d4b77f]/30 pl-5 text-right sm:block">
              <p className="text-[10px] uppercase tracking-[0.2em] text-[#aaa59a]">Your stable</p>
              <p className="mt-1 text-sm font-medium text-[#eee8dc]">
                {user.business_name || (user.is_selling ? "Seller account" : "Buyer account")}
              </p>
            </div>
          </div>
        </section>

        <div className="mt-4 flex items-center justify-between px-1">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#cdac6e]">Your workspace</p>
            <h2 className="mt-1 font-accent text-xl font-bold text-white">Make your next move</h2>
          </div>
          <span className="text-xs text-[#aaa59a]">{options.length} destinations</span>
        </div>

        <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {options.map(({ label, description, path, icon: Icon, featured }) => (
            <button
              key={path}
              type="button"
              onClick={() => navigate(path)}
              className={`group relative flex min-h-[96px] items-center gap-4 overflow-hidden rounded-xl border p-4 text-left text-white transition duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#cdac6e] focus-visible:ring-offset-2 focus-visible:ring-offset-[#272725] active:translate-y-0 ${
                featured
                  ? "border-[#cdac6e] bg-[#403a30] shadow-[0_8px_18px_rgba(0,0,0,0.2)] hover:bg-[#4a4235]"
                  : "border-white/10 bg-[#343432] hover:border-[#cdac6e]/70 hover:bg-[#3d3c38]"
              }`}
            >
              <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${
                featured ? "bg-[#c9a96e] text-[#2e2c29]" : "bg-[#cdac6e]/15 text-[#d9bb82]"
              }`}>
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="min-w-0">
                <span className="block text-[15px] font-semibold">{label}</span>
                <span className="mt-1 block text-xs text-[#bdb8ae]">{description}</span>
              </span>
              <ArrowUpRight className={`absolute right-4 top-4 h-4 w-4 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 ${
                featured ? "text-[#e1c58e]" : "text-[#aa9162]"
              }`} aria-hidden="true" />
            </button>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
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
    { label: "Find Horses", description: "Browse your next prospect", path: "/filter", icon: House, featured: true, emphasis: "large" },
    { label: "My Horses", description: "Manage your listings", path: "/my-horses", icon: List, emphasis: "medium" },
    ...(user.is_selling
      ? [{ label: "Add Horse", description: "List a new performer", path: "/add-horse", icon: PlusCircle, emphasis: "add" }]
      : []),
    { label: "My Favourites", description: "Your considered horses", path: "/favorites", icon: Heart, emphasis: "compact" },
    { label: "Messages", description: "Keep conversations moving", path: "/messages", icon: MessageCircle, emphasis: "compact" },
    { label: "Saved Searches", description: "Return to your shortlists", path: "/saved-searches", icon: Search, emphasis: "compact" },
    { label: "Subscription", description: "Manage your membership", path: "/subscription", icon: CreditCard, emphasis: "wide" },
  ];

  const displayName =
    user.name ||
    user.business_name ||
    user.contact_name ||
    (user.email.toLowerCase() === "info@australianjumping.com.au"
      ? "Australian Jumping"
      : user.username && user.username.toLowerCase() !== "admin"
        ? user.username
        : user.email.split("@")[0]);
  const welcomeTextSize =
    displayName.length > 36
      ? "text-sm sm:text-lg"
      : displayName.length > 22
        ? "text-base sm:text-lg"
        : "text-lg sm:text-xl";

  return (
    <div className="min-h-screen bg-[#272725] p-2.5 sm:p-5">
      <div className="mx-auto w-full max-w-6xl rounded-xl bg-[#272725] sm:rounded-2xl">
        <section
          className="relative overflow-hidden rounded-lg border border-[#cdac6e]/20 px-4 py-3 text-[#f2eee6] sm:rounded-xl sm:px-7 sm:py-6"
          style={{ background: "linear-gradient(125deg, #2e2e2b 0%, #34332f 65%, #3b372f 100%)" }}
        >
          <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full border border-[#cdac6e]/20" />
          <div className="pointer-events-none absolute -right-5 -top-12 h-44 w-44 rounded-full border border-[#cdac6e]/10" />
          <div className="relative flex flex-col justify-between gap-2 sm:flex-row sm:items-end sm:gap-6">
            <div>
              <h1 className={`max-w-3xl truncate whitespace-nowrap font-accent font-bold leading-tight tracking-tight ${welcomeTextSize}`}>
                Welcome, {displayName}
              </h1>
            </div>
            <div className="hidden border-l border-[#d4b77f]/30 pl-5 text-right sm:block">
              <p className="text-[10px] uppercase tracking-[0.2em] text-[#aaa59a]">Your stable</p>
              <p className="mt-1 text-sm font-medium text-[#eee8dc]">
                {user.business_name || (user.is_selling ? "Seller account" : "Buyer account")}
              </p>
            </div>
          </div>
        </section>

        <div className="mt-2 grid grid-cols-2 gap-2 sm:mt-3 sm:gap-2.5 lg:grid-cols-4 lg:auto-rows-[104px]">
          {options.map(({ label, description, path, icon: Icon, featured, emphasis }) => (
            <button
              key={path}
              type="button"
              onClick={() => navigate(path)}
              className={`group relative flex items-center gap-4 overflow-hidden rounded-xl border p-4 text-left text-white transition duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#cdac6e] focus-visible:ring-offset-2 focus-visible:ring-offset-[#272725] active:translate-y-0 ${
                emphasis === "large"
                  ? "col-span-2 min-h-[116px] sm:min-h-[148px] lg:col-span-2 lg:row-span-2 lg:min-h-0"
                  : emphasis === "medium"
                    ? "min-h-[100px] sm:min-h-[116px] lg:col-span-1 lg:min-h-0"
                    : emphasis === "add"
                    ? "min-h-[100px] sm:min-h-[116px] lg:col-span-1 lg:min-h-0"
                      : emphasis === "wide"
                        ? "min-h-[100px] sm:min-h-[94px] lg:col-span-2 lg:min-h-0"
                        : "min-h-[100px] sm:min-h-[92px] lg:col-span-1 lg:min-h-0"
              } ${
                featured
                  ? "border-[#d6b56f] bg-[linear-gradient(135deg,#37352f_0%,#302f2c_70%,#443c2c_100%)] shadow-[0_8px_18px_rgba(0,0,0,0.2)] hover:bg-[#3e3b34]"
                  : "border-[#cdac6e]/30 bg-[#30302e] hover:border-[#cdac6e]/80 hover:bg-[#373633]"
              }`}
            >
              <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md sm:h-11 sm:w-11 sm:rounded-lg ${
                featured ? "bg-[#d2ae67] text-[#292824]" : "bg-[#cdac6e]/20 text-[#e0c184] ring-1 ring-[#cdac6e]/20"
              }`}>
                <Icon className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
              </span>
              <span className="min-w-0">
                <span className={`block font-semibold leading-tight sm:text-[15px] ${
                  featured ? "text-base" : "text-sm"
                }`}>{label}</span>
                <span className="mt-1 block text-[10px] leading-tight text-white/85 sm:text-xs">{description}</span>
              </span>
              <ArrowUpRight className={`absolute right-2.5 top-2.5 h-3 w-3 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 sm:right-4 sm:top-4 sm:h-4 sm:w-4 ${
                featured ? "text-[#e1c58e]" : "text-[#aa9162]"
              }`} aria-hidden="true" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
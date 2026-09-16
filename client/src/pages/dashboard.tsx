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
import logoImage from "../assets/logo.jpg";

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
    <div className="min-h-screen bg-[linear-gradient(180deg,#c9a96e_0%,#e1d1b4_34%,#f1ece3_100%)] p-2.5 sm:p-5">
      <div className="mx-auto w-full max-w-6xl rounded-xl sm:rounded-2xl">
        <section
          className="relative overflow-hidden rounded-lg border border-[#f1dcad]/70 bg-[linear-gradient(125deg,#d7b976_0%,#cba968_65%,#e0c58b_100%)] px-4 py-3 text-[#292824] shadow-[0_8px_24px_rgba(66,52,27,0.16)] sm:rounded-xl sm:px-7 sm:py-5"
        >
          <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full border border-white/30" />
          <div className="pointer-events-none absolute -right-5 -top-12 h-44 w-44 rounded-full border border-white/20" />
          <div className="relative flex flex-col items-center justify-between gap-2 sm:flex-row sm:gap-6">
            <div className="flex min-w-0 items-center gap-3">
              <img
                src={logoImage}
                alt="Pro Horse Match"
                className="h-12 w-16 shrink-0 rounded-md object-cover shadow-sm sm:h-14 sm:w-[74px]"
              />
              <h1 className={`max-w-3xl truncate whitespace-nowrap font-accent font-bold leading-tight tracking-tight ${welcomeTextSize}`}>
                Welcome, {displayName}
              </h1>
            </div>
            <div className="hidden border-l border-[#5b492b]/25 pl-5 text-right sm:block">
              <p className="text-[10px] uppercase tracking-[0.2em] text-[#675536]">Your stable</p>
              <p className="mt-1 text-sm font-medium text-[#292824]">
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
              className={`group relative flex items-center gap-4 overflow-hidden rounded-xl border p-4 text-left text-white shadow-[0_7px_18px_rgba(43,39,31,0.16)] transition duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8f713c] focus-visible:ring-offset-2 focus-visible:ring-offset-[#e1d1b4] active:translate-y-0 ${
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
                  ? "border-[#f0cf82] bg-[linear-gradient(135deg,#3b372e_0%,#302f2c_68%,#55482e_100%)] hover:bg-[#423d32]"
                  : "border-[#d8b96f] bg-[#383733] hover:border-[#f0cf82] hover:bg-[#403f3a]"
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
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
    <div className="min-h-screen bg-[#272725] p-2.5 sm:p-5">
      <div className="mx-auto w-full max-w-6xl rounded-xl sm:rounded-2xl">
        <section
          className="relative overflow-hidden rounded-lg border border-[#cdac6e]/25 bg-[#292929] px-4 py-4 text-[#f2eee6] sm:rounded-xl sm:px-7 sm:py-5"
        >
          <div className="relative flex flex-col items-center justify-between gap-2 sm:flex-row sm:gap-6">
            <div className="flex min-w-0 flex-col items-center gap-2 sm:flex-row sm:gap-3">
              <img
                src={logoImage}
                alt="Pro Horse Match"
                className="h-20 w-auto shrink-0 object-contain sm:h-24"
              />
              <div className="hidden h-8 w-px bg-[#c9a96e]/40 sm:block" />
              <h1 className={`max-w-3xl whitespace-nowrap text-center font-accent font-bold leading-tight tracking-tight sm:text-left ${welcomeTextSize}`}>
                Welcome, {displayName}
              </h1>
            </div>
            <div className="hidden border-l border-[#c9a96e]/30 pl-5 text-right sm:block">
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
              className={`group relative flex flex-col items-center justify-center gap-2 overflow-hidden rounded-xl border p-3 text-center text-white shadow-[0_7px_18px_rgba(0,0,0,0.2)] transition duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#cdac6e] focus-visible:ring-offset-2 focus-visible:ring-offset-[#272725] active:translate-y-0 ${
                emphasis === "large"
                  ? "col-span-2 min-h-[116px] sm:min-h-[148px] lg:col-span-2 lg:row-span-2 lg:min-h-0"
                  : emphasis === "medium"
                    ? "min-h-[100px] sm:min-h-[116px] lg:col-span-1 lg:min-h-0"
                    : emphasis === "add"
                    ? "min-h-[100px] sm:min-h-[116px] lg:col-span-1 lg:min-h-0"
                    : emphasis === "wide"
                        ? "min-h-[78px] sm:min-h-[94px] lg:col-span-2 lg:min-h-0"
                        : "min-h-[100px] sm:min-h-[92px] lg:col-span-1 lg:min-h-0"
              } ${
                featured
                  ? "border-[#cdac6e] bg-[#302f2c] hover:bg-[#393733]"
                  : "border-white/10 bg-[#343432] hover:border-[#cdac6e] hover:bg-[#3d3c38]"
              }`}
            >
              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg sm:h-11 sm:w-11 ${
                featured ? "bg-[#c9a96e] text-[#2e2c29]" : "bg-[#cdac6e]/15 text-[#d9bb82]"
              }`}>
                <Icon className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
              </span>
              <span className="min-w-0">
                <span className="block text-[15px] font-semibold leading-tight sm:text-[17px]">{label}</span>
                <span className="mt-1 block text-[11px] leading-tight text-white sm:text-xs">{description}</span>
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
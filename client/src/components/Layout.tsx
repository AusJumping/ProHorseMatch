import { ReactNode } from "react";
import { useLocation } from "wouter";
import Sidebar from "./Sidebar";
import MobileNavbar from "./MobileNavbar";
import { ArrowLeft, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMobile } from "@/hooks/use-mobile";

interface LayoutProps {
  children: ReactNode;
  pageTitle: string;
  showBackButton?: boolean;
  onBackClick?: () => void;
  showFilterButton?: boolean;
  onFilterClick?: () => void;
}

const Layout = ({
  children,
  pageTitle,
  showBackButton = false,
  onBackClick,
  showFilterButton = false,
  onFilterClick,
}: LayoutProps) => {
  const isMobile = useMobile();
  const [, navigate] = useLocation();

  const handleBack = () => {
    if (onBackClick) {
      onBackClick();
    } else {
      navigate("/");
    }
  };

  return (
    <div className="flex min-h-screen bg-neutral-100">
      {/* Desktop Sidebar */}
      {!isMobile && <Sidebar />}

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-neutral-200 p-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              {showBackButton && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="mr-2" 
                  onClick={handleBack}
                >
                  <ArrowLeft size={18} />
                </Button>
              )}
              <h2 className="font-display font-bold text-xl">{pageTitle}</h2>
            </div>

            {/* Filter Button (Mobile only) */}
            {isMobile && showFilterButton && onFilterClick && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onFilterClick}
              >
                <Filter size={18} />
              </Button>
            )}

            {/* Desktop Header Content */}
            {!isMobile && (
              <div className="flex items-center gap-4">
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="Search for horses..." 
                    className="bg-neutral-100 border border-neutral-200 rounded-lg px-4 py-2 pr-10 w-64" 
                  />
                  <button className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <svg className="h-4 w-4 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </button>
                </div>
                <div className="border-l border-neutral-200 h-8"></div>
                <button className="relative">
                  <svg className="h-6 w-6 text-neutral-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  <span className="absolute -top-1 -right-1 bg-destructive text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">2</span>
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          {children}
        </main>

        {/* Mobile Navbar */}
        {isMobile && <MobileNavbar />}
      </div>
    </div>
  );
};

export default Layout;

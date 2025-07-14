import { ReactNode } from "react";
import { useLocation } from "wouter";
import Sidebar from "./Sidebar";
import MobileNavbar from "./MobileNavbar";
import { ArrowLeft, Filter, PlusCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

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
  const [location, navigate] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  
  // Debug log
  console.log("Layout - Auth state:", { isAuthenticated, userType: user?.type });
  
  const handleRefreshSession = () => {
    toast({
      title: "Refreshing session",
      description: "Please wait while we refresh your session...",
    });
    
    // Force a page reload to refresh the session
    window.location.reload();
  };

  const isOwner = user?.is_selling;

  const handleBack = (e: React.MouseEvent) => {
    e.preventDefault();
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
                  size="sm" 
                  className="mr-2 px-2" 
                  onClick={handleBack}
                >
                  <ArrowLeft size={16} />
                </Button>
              )}
              {pageTitle && <h2 className="font-accent font-bold text-xl">{pageTitle}</h2>}
            </div>

            <div className="flex items-center gap-2">
              {/* Add Horse Button for mobile (only on home page for owners) */}
              {isMobile && isOwner && location === "/" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate("/add-horse");
                  }}
                  className="flex items-center"
                >
                  <PlusCircle className="mr-1 h-4 w-4" />
                  <span className="text-sm">Add Horse</span>
                </Button>
              )}
              
              {/* Filter Button removed as requested */}
              
              {/* Mobile Menu Button */}
              {isMobile && (
                <MobileNavbar />
              )}
            </div>


          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;

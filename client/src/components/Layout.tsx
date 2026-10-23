import { ReactNode } from "react";
import { useLocation } from "wouter";
import Sidebar from "./Sidebar";
import MobileNavbar from "./MobileNavbar";
import { PWAInstallBanner } from "./PWAInstallBanner";
import { NotificationBell } from "./NotificationBell";
import { UnreadNotificationBanner } from "./UnreadNotificationBanner";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/lib/auth";

interface LayoutProps {
  children: ReactNode;
  pageTitle: string;
  showBackButton?: boolean;
  onBackClick?: () => void;
  horseCount?: number;
  currentHorseIndex?: number;
  browseMode?: boolean;
}

const Layout = ({
  children,
  pageTitle,
  showBackButton = false,
  onBackClick,
  horseCount,
  currentHorseIndex,
  browseMode = false,
}: LayoutProps) => {
  const isMobile = useMobile();
  const [, navigate] = useLocation();
  const { isAuthenticated } = useAuth();

  const handleBack = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onBackClick) {
      onBackClick();
    } else {
      navigate("/");
    }
  };

  return (
    <div className={`flex min-h-screen bg-neutral-100 ${isMobile ? 'w-screen max-w-full overflow-x-hidden' : ''}`}>
      {/* Desktop Sidebar */}
      {!isMobile && <Sidebar />}

      {/* Main Content */}
      <div className={`flex-1 flex flex-col ${isMobile ? 'w-full max-w-full' : ''}`}>
        {/* Header */}
        {!browseMode ? <header
          className={`bg-white border-b border-neutral-200 p-4 ${isMobile ? 'w-full' : ''}`}
          style={{ paddingTop: "calc(1rem + env(safe-area-inset-top, 0px))" }}
        >
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              {/* Mobile horse counter */}
              {isMobile && horseCount && currentHorseIndex !== undefined && (
                <div className="text-xs text-gray-500 mr-3">
                  Horse {currentHorseIndex + 1} of {horseCount}
                </div>
              )}
              
              {showBackButton && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="mr-2 h-8 w-8" 
                  onClick={handleBack}
                >
                  <ArrowLeft size={16} />
                </Button>
              )}
              {pageTitle && <h2 className="font-accent font-bold text-xl">{pageTitle}</h2>}
            </div>

            <div className="flex items-center gap-2">
              {/* Notification Bell - shows for authenticated users */}
              {isAuthenticated && (
                <NotificationBell />
              )}
              
            </div>


          </div>
        </header> : null}

        {/* Main Content Area */}
        <main
          className={`flex-1 overflow-auto ${browseMode ? "p-0" : "p-4 md:p-6"} ${isMobile ? 'w-full max-w-full' : ''}`}
          style={isMobile ? { paddingBottom: "calc(5.5rem + env(safe-area-inset-bottom, 0px))" } : undefined}
        >
          {children}
        </main>
      </div>

      {isMobile && <MobileNavbar />}
      {/* Unread Notification Banner - shows on login if user has unread messages */}
      {isAuthenticated && <UnreadNotificationBanner />}

      {/* Contextual Notification Prompt */}
      
      {/* PWA Install Banner */}
      {isAuthenticated && <PWAInstallBanner />}
    </div>
  );
};

export default Layout;

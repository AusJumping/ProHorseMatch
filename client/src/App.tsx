import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Auth from "@/pages/auth";
import HorseDetail from "@/pages/horse-detail";

import Profile from "@/pages/profile";
import AddHorse from "@/pages/add-horse";
import MyHorses from "@/pages/my-horses";
import EditHorse from "@/pages/edit-horse";
// Account Settings page removed as requested
import MigrateHorses from "@/pages/migrate-horses";
import AdminPanel from "@/pages/admin";
import Favorites from "@/pages/favorites";
import Messages from "@/pages/messages";
import SavedSearches from "@/pages/SavedSearches";
import Landing from "@/pages/landing";
import Checkout from "@/pages/checkout";
import PaymentSuccess from "@/pages/payment-success";
import Subscription from "@/pages/subscription";
import SubscriptionSuccess from "@/pages/subscription/success";
import DonationSuccess from "@/pages/donation-success";
import DonationCheckout from "@/pages/donation-checkout";
import WelcomePage from "@/pages/welcome";
import VerifyEmail from "@/pages/verify-email";
import { AuthProvider } from "@/lib/auth";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { useAutoLogout } from "@/hooks/useAutoLogout";

function Router() {
  // Initialize auto-logout functionality
  useAutoLogout();
  
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/browse" component={Home} />
      <Route path="/filter" component={Home} />
      <Route path="/auth" component={Auth} />
      <Route path="/verify-email/:token?" component={VerifyEmail} />
      <Route path="/horse/:id" component={HorseDetail} />

      <Route path="/profile" component={Profile} />
      {/* Account Settings page removed as requested */}
      <Route path="/add-horse" component={AddHorse} />
      <Route path="/my-horses" component={MyHorses} />
      <Route path="/edit-horse/:id" component={EditHorse} />
      <Route path="/migrate-horses" component={MigrateHorses} />
      <Route path="/admin" component={AdminPanel} />
      <Route path="/favorites" component={Favorites} />
      <Route path="/messages" component={Messages} />
      <Route path="/saved-searches" component={SavedSearches} />
      <Route path="/checkout/:horseId" component={Checkout} />
      <Route path="/payment-success" component={PaymentSuccess} />
      <Route path="/subscription" component={Subscription} />
      <Route path="/subscription/success" component={SubscriptionSuccess} />
      <Route path="/donation-checkout" component={DonationCheckout} />
      <Route path="/donation-success" component={DonationSuccess} />
      <Route path="/welcome" component={WelcomePage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CurrencyProvider initialCurrency="AUD">
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </CurrencyProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;

import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Auth from "@/pages/auth";
import HorseDetail from "@/pages/horse-detail";
import Messages from "@/pages/messages";
import Profile from "@/pages/profile";
import AddHorse from "@/pages/add-horse";
import MyHorses from "@/pages/my-horses";
import EditHorse from "@/pages/edit-horse";
import AccountSettings from "@/pages/account-settings";
import MigrateHorses from "@/pages/migrate-horses";
import AdminPanel from "@/pages/admin";
import Favorites from "@/pages/favorites";
import { AuthProvider } from "@/lib/auth";
import { CurrencyProvider } from "@/contexts/CurrencyContext";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/auth" component={Auth} />
      <Route path="/horse/:id" component={HorseDetail} />
      <Route path="/messages" component={Messages} />
      <Route path="/profile" component={Profile} />
      <Route path="/account-settings" component={AccountSettings} />
      <Route path="/add-horse" component={AddHorse} />
      <Route path="/my-horses" component={MyHorses} />
      <Route path="/edit-horse/:id" component={EditHorse} />
      <Route path="/migrate-horses" component={MigrateHorses} />
      <Route path="/admin" component={AdminPanel} />
      <Route path="/favorites" component={Favorites} />
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

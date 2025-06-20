import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Helmet } from "react-helmet";

export default function WelcomePage() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center" style={{ backgroundColor: "#2b2b2b" }}>
      <Helmet>
        <title>Welcome to Pro Horse Match</title>
        <meta name="description" content="Using smart technology to connect performance horses with the right riders." />
      </Helmet>
      
      <div className="container max-w-3xl mx-auto px-4 py-16 text-center text-white">
        <h1 className="text-4xl md:text-5xl font-accent font-bold mb-6 text-white">Welcome to<br />
          <span>
            <span className="text-[#cdac6e]">Pro</span>Horse<span className="text-[#cdac6e]">Match</span>
          </span>
        </h1>
        
        <div className="space-y-6 text-lg">
          <p className="max-w-md mx-auto">
            ProHorseMatch uses smart technology to connect performance horses with the right owners.
          </p>
          
          <p className="max-w-md mx-auto">
            Whether you're buying or selling, find the perfect match fast using filters for discipline, level, price, location, and more.
          </p>
          
          <p className="max-w-md mx-auto">
            We are in Beta phase and value your feedback to help us improve.
          </p>
        </div>
        
        <Button 
          className="mt-12 px-8 py-6 text-lg bg-[#cdac6e] hover:bg-[#b89b5d] text-white"
          onClick={() => navigate("/filter")}
        >
          Get Started
        </Button>
      </div>
    </div>
  );
}
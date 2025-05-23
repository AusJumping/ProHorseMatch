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
        
        <p className="text-xl mb-8 max-w-lg mx-auto">
          ProHorseMatch uses intelligent technology to connect performance horses with their ideal new owners.
        </p>
        
        <div className="space-y-6 text-lg">
          <p className="max-w-lg mx-auto">
            Whether you're looking for your next top competitor or listing a quality horse for sale, our platform is designed to help you make the right match — quickly and confidently.
          </p>
          
          <p className="max-w-lg mx-auto">
            Use smart filters to search by discipline, competition level, price, location, and more, making it easier than ever to connect horses and owners that truly align.
          </p>
          
          <p className="max-w-lg mx-auto">
            We're currently in our Beta phase and welcome your feedback — your insights will help us shape the future of equine matchmaking.
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
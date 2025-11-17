import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="absolute top-0 left-0 right-0 z-10">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="text-lg font-semibold">ChatAI</div>
          <Button onClick={() => navigate("/auth")} variant="ghost" size="sm">
            Sign in
          </Button>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <h1 className="text-6xl font-light tracking-tight sm:text-7xl">
            Chat with AI
          </h1>
          <p className="text-xl text-muted-foreground font-light max-w-2xl mx-auto">
            Experience intelligent conversations with a minimal, modern interface
          </p>
          <Button 
            onClick={() => navigate("/auth")} 
            size="lg"
            className="h-12 px-8 rounded-full"
          >
            Get started
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </main>

      <footer className="py-8">
        <div className="container mx-auto px-6 text-center text-sm text-muted-foreground">
          Built for seamless conversations
        </div>
      </footer>
    </div>
  );
};

export default Index;

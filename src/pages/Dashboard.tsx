import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Brain, TrendingUp, Map, LogOut } from "lucide-react";

const Dashboard = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasAssessment, setHasAssessment] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (!session) {
        navigate("/auth");
      } else {
        checkAssessment(session.user.id);
      }
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const checkAssessment = async (userId: string) => {
    const { data } = await supabase
      .from("assessments")
      .select("id")
      .eq("user_id", userId)
      .single();
    setHasAssessment(!!data);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Signed out",
      description: "You've been signed out successfully.",
    });
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold bg-gradient-hero bg-clip-text text-transparent">
            Career Guidance Hub
          </h1>
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 animate-fade-in">
          <h2 className="text-3xl font-bold mb-2">
            Welcome back{session?.user?.user_metadata?.full_name ? `, ${session.user.user_metadata.full_name}` : ""}!
          </h2>
          <p className="text-muted-foreground">
            {hasAssessment
              ? "View your career recommendations and learning roadmap"
              : "Let's discover your ideal career path"}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="shadow-soft hover:shadow-medium transition-shadow cursor-pointer" onClick={() => navigate("/assessment")}>
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-gradient-hero flex items-center justify-center mb-4">
                <Brain className="h-6 w-6 text-white" />
              </div>
              <CardTitle>Take Assessment</CardTitle>
              <CardDescription>
                {hasAssessment
                  ? "Retake the assessment to update your profile"
                  : "Complete personality, skills, and interests evaluation"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">
                {hasAssessment ? "Retake Assessment" : "Start Assessment"}
              </Button>
            </CardContent>
          </Card>

          <Card className={`shadow-soft ${hasAssessment ? 'hover:shadow-medium cursor-pointer' : 'opacity-50'} transition-shadow`} onClick={() => hasAssessment && navigate("/recommendations")}>
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-gradient-accent flex items-center justify-center mb-4">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <CardTitle>Career Recommendations</CardTitle>
              <CardDescription>
                View AI-powered career suggestions based on your assessment
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" disabled={!hasAssessment}>
                View Careers
              </Button>
            </CardContent>
          </Card>

          <Card className={`shadow-soft ${hasAssessment ? 'hover:shadow-medium cursor-pointer' : 'opacity-50'} transition-shadow`} onClick={() => hasAssessment && navigate("/roadmap")}>
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-gradient-warm flex items-center justify-center mb-4">
                <Map className="h-6 w-6 text-white" />
              </div>
              <CardTitle>Learning Roadmap</CardTitle>
              <CardDescription>
                Explore personalized skill development paths
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" disabled={!hasAssessment}>
                View Roadmap
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
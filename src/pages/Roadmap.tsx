import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Clock, Target } from "lucide-react";

interface RoadmapItem {
  id: string;
  skill_name: string;
  skill_level: string;
  resources: string[];
  estimated_duration: string;
  order_index: number;
}

const Roadmap = () => {
  const [searchParams] = useSearchParams();
  const careerTitle = searchParams.get("career");
  const [roadmap, setRoadmap] = useState<RoadmapItem[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (careerTitle) {
      loadRoadmap();
    }
  }, [careerTitle]);

  const loadRoadmap = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      // Get career recommendation
      const { data: career } = await supabase
        .from("career_recommendations")
        .select("*")
        .eq("user_id", session.user.id)
        .eq("career_title", careerTitle)
        .single();

      if (!career) {
        toast({
          variant: "destructive",
          title: "Career not found",
          description: "Please select a career from recommendations.",
        });
        navigate("/recommendations");
        return;
      }

      // Check for existing roadmap
      const { data: existing } = await supabase
        .from("learning_roadmaps")
        .select("*")
        .eq("recommendation_id", career.id)
        .order("order_index");

      if (existing && existing.length > 0) {
        setRoadmap(existing.map(item => ({
          id: item.id,
          skill_name: item.skill_name,
          skill_level: item.skill_level,
          resources: Array.isArray(item.resources) ? item.resources as string[] : [],
          estimated_duration: item.estimated_duration || "",
          order_index: item.order_index,
        })));
      } else {
        // Generate roadmap
        await generateRoadmap(career.id, career.required_skills, session.user.id);
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const generateRoadmap = async (recommendationId: string, requiredSkills: any, userId: string) => {
    const skillsArray = Array.isArray(requiredSkills) ? requiredSkills as string[] : [];
    const roadmapData = skillsArray.flatMap((skill, index) => [
      {
        recommendation_id: recommendationId,
        user_id: userId,
        skill_name: skill,
        skill_level: "Beginner",
        resources: [`Introduction to ${skill}`, `${skill} Basics Course`],
        estimated_duration: "4-6 weeks",
        order_index: index * 3,
      },
      {
        recommendation_id: recommendationId,
        user_id: userId,
        skill_name: skill,
        skill_level: "Intermediate",
        resources: [`Advanced ${skill}`, `${skill} Best Practices`],
        estimated_duration: "8-12 weeks",
        order_index: index * 3 + 1,
      },
      {
        recommendation_id: recommendationId,
        user_id: userId,
        skill_name: skill,
        skill_level: "Advanced",
        resources: [`${skill} Mastery`, `Real-world ${skill} Projects`],
        estimated_duration: "12-16 weeks",
        order_index: index * 3 + 2,
      },
    ]);

    const { error } = await supabase.from("learning_roadmaps").insert(roadmapData);

    if (error) throw error;

    setRoadmap(roadmapData.map((item, idx) => ({
      id: `temp-${idx}`,
      ...item,
    })));
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case "Beginner":
        return "bg-secondary text-secondary-foreground";
      case "Intermediate":
        return "bg-primary text-primary-foreground";
      case "Advanced":
        return "bg-accent text-accent-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const groupedRoadmap = roadmap.reduce((acc, item) => {
    if (!acc[item.skill_name]) {
      acc[item.skill_name] = [];
    }
    acc[item.skill_name].push(item);
    return acc;
  }, {} as Record<string, RoadmapItem[]>);

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <Button variant="ghost" onClick={() => navigate("/recommendations")} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Recommendations
        </Button>

        <div className="mb-8 animate-fade-in">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-hero bg-clip-text text-transparent">
            Learning Roadmap
          </h1>
          <p className="text-muted-foreground text-lg">
            Your personalized path to becoming a <span className="font-semibold text-foreground">{careerTitle}</span>
          </p>
        </div>

        <div className="space-y-8">
          {Object.entries(groupedRoadmap).map(([skillName, levels], index) => (
            <Card
              key={skillName}
              className="shadow-soft animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Target className="h-6 w-6 text-primary" />
                  {skillName}
                </CardTitle>
                <CardDescription>Progress through three levels of mastery</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {levels
                    .sort((a, b) => a.order_index - b.order_index)
                    .map((item) => (
                      <div
                        key={item.id}
                        className="flex gap-4 p-4 rounded-lg border border-border bg-card hover:shadow-soft transition-shadow"
                      >
                        <div className="flex-shrink-0">
                          <Badge className={getLevelColor(item.skill_level)}>
                            {item.skill_level}
                          </Badge>
                        </div>
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            <span>{item.estimated_duration}</span>
                          </div>
                          <div>
                            <h4 className="font-semibold mb-2">Recommended Resources:</h4>
                            <ul className="space-y-1">
                              {item.resources.map((resource, i) => (
                                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                                  <span className="text-primary mt-1">•</span>
                                  <span>{resource}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Roadmap;
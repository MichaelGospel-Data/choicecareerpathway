import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, TrendingUp, BookOpen, Award } from "lucide-react";

interface Career {
  id: string;
  career_title: string;
  match_score: number;
  description: string;
  demand_trend: string;
  required_skills: string[];
  recommended_courses: string[];
}

const Recommendations = () => {
  const [careers, setCareers] = useState<Career[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    loadRecommendations();
  }, []);

  const loadRecommendations = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      // Check for existing recommendations
      const { data: existing } = await supabase
        .from("career_recommendations")
        .select("*")
        .eq("user_id", session.user.id)
        .order("match_score", { ascending: false });

      if (existing && existing.length > 0) {
        setCareers(existing.map(rec => ({
          id: rec.id,
          career_title: rec.career_title,
          match_score: rec.match_score,
          description: rec.description || "",
          demand_trend: rec.demand_trend || "Stable",
          required_skills: Array.isArray(rec.required_skills) ? rec.required_skills as string[] : [],
          recommended_courses: Array.isArray(rec.recommended_courses) ? rec.recommended_courses as string[] : [],
        })));
      } else {
        // Generate new recommendations based on assessment
        await generateRecommendations(session.user.id);
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

  const generateRecommendations = async (userId: string) => {
    // Get latest assessment
    const { data: assessment } = await supabase
      .from("assessments")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (!assessment) {
      toast({
        variant: "destructive",
        title: "No Assessment Found",
        description: "Please complete an assessment first.",
      });
      navigate("/assessment");
      return;
    }

    // Rule-based career matching
    const careerDatabase = getCareerDatabase();
    const recommendations = careerDatabase
      .map((career) => ({
        ...career,
        match_score: calculateMatchScore(career, assessment),
      }))
      .sort((a, b) => b.match_score - a.match_score)
      .slice(0, 5);

    // Save recommendations
    const careerRecords = recommendations.map((rec) => ({
      assessment_id: assessment.id,
      user_id: userId,
      career_title: rec.title,
      match_score: rec.match_score,
      description: rec.description,
      demand_trend: rec.demand_trend,
      required_skills: rec.required_skills,
      recommended_courses: rec.recommended_courses,
    }));

    const { error } = await supabase.from("career_recommendations").insert(careerRecords);

    if (error) throw error;

    setCareers(recommendations.map((rec, idx) => ({
      id: `temp-${idx}`,
      career_title: rec.title,
      match_score: rec.match_score,
      description: rec.description,
      demand_trend: rec.demand_trend,
      required_skills: rec.required_skills,
      recommended_courses: rec.recommended_courses,
    })));
  };

  const calculateMatchScore = (career: any, assessment: any) => {
    let score = 0;
    const personalityScore = assessment.personality_score as Record<string, number>;
    const skillsScore = assessment.skills_score as Record<string, any>;
    const interestsScore = assessment.interests_score as Record<string, number>;

    // Personality match (40%)
    career.personality_traits.forEach((trait: string) => {
      if (personalityScore[trait]) {
        score += personalityScore[trait] * 8;
      }
    });

    // Skills match (30%)
    career.key_skills.forEach((skill: string) => {
      Object.entries(skillsScore).forEach(([skillName, data]: [string, any]) => {
        if (skillName.toLowerCase().includes(skill.toLowerCase())) {
          score += data.score * 6;
        }
      });
    });

    // Interest match (30%)
    career.interest_areas.forEach((area: string) => {
      Object.entries(interestsScore).forEach(([interest, value]) => {
        if (interest.toLowerCase().includes(area.toLowerCase())) {
          score += (value as number) * 6;
        }
      });
    });

    return Math.min(Math.round(score), 100);
  };

  const getCareerDatabase = () => [
    {
      title: "Software Engineer",
      description: "Design, develop, and maintain software applications and systems.",
      demand_trend: "High Growth",
      personality_traits: ["Analytical", "Investigative"],
      key_skills: ["Programming", "Problem Solving", "Technical"],
      interest_areas: ["Technology"],
      required_skills: ["Programming Languages", "Algorithms", "System Design", "Version Control"],
      recommended_courses: ["Full Stack Development", "Data Structures", "Cloud Computing"],
    },
    {
      title: "Data Scientist",
      description: "Analyze complex data to help organizations make better decisions.",
      demand_trend: "High Growth",
      personality_traits: ["Analytical", "Investigative"],
      key_skills: ["Data Analysis", "Problem Solving", "Technical"],
      interest_areas: ["Technology", "Science"],
      required_skills: ["Python/R", "Machine Learning", "Statistics", "Data Visualization"],
      recommended_courses: ["Machine Learning", "Statistical Analysis", "Big Data Technologies"],
    },
    {
      title: "UX/UI Designer",
      description: "Create user-friendly and visually appealing digital interfaces.",
      demand_trend: "Growing",
      personality_traits: ["Artistic", "Investigative"],
      key_skills: ["Creativity", "Problem Solving", "Communication"],
      interest_areas: ["Arts", "Technology"],
      required_skills: ["Design Tools", "User Research", "Prototyping", "Visual Design"],
      recommended_courses: ["UI Design Fundamentals", "User Research", "Design Systems"],
    },
    {
      title: "Project Manager",
      description: "Plan, execute, and oversee projects to achieve specific goals.",
      demand_trend: "Stable",
      personality_traits: ["Enterprising", "Social"],
      key_skills: ["Leadership", "Communication", "Project Management"],
      interest_areas: ["Business"],
      required_skills: ["Agile/Scrum", "Risk Management", "Stakeholder Management", "Budgeting"],
      recommended_courses: ["Project Management Professional", "Agile Certification", "Leadership Skills"],
    },
    {
      title: "Marketing Manager",
      description: "Develop and implement marketing strategies to promote products or services.",
      demand_trend: "Growing",
      personality_traits: ["Enterprising", "Artistic"],
      key_skills: ["Communication", "Creativity", "Leadership"],
      interest_areas: ["Business", "Arts"],
      required_skills: ["Digital Marketing", "Analytics", "Brand Strategy", "Content Creation"],
      recommended_courses: ["Digital Marketing", "SEO & SEM", "Social Media Strategy"],
    },
    {
      title: "Healthcare Administrator",
      description: "Manage healthcare facilities and coordinate medical services.",
      demand_trend: "Growing",
      personality_traits: ["Social", "Conventional"],
      key_skills: ["Leadership", "Communication", "Project Management"],
      interest_areas: ["Healthcare"],
      required_skills: ["Healthcare Systems", "Compliance", "Budget Management", "Team Leadership"],
      recommended_courses: ["Healthcare Management", "Medical Ethics", "Health Information Systems"],
    },
    {
      title: "Financial Analyst",
      description: "Analyze financial data to help businesses make investment decisions.",
      demand_trend: "Stable",
      personality_traits: ["Analytical", "Conventional"],
      key_skills: ["Data Analysis", "Problem Solving", "Communication"],
      interest_areas: ["Business", "Finance"],
      required_skills: ["Financial Modeling", "Excel", "Market Analysis", "Reporting"],
      recommended_courses: ["Financial Analysis", "Investment Strategies", "CFA Preparation"],
    },
    {
      title: "Teacher/Educator",
      description: "Educate and inspire students in various subjects.",
      demand_trend: "Stable",
      personality_traits: ["Social", "Artistic"],
      key_skills: ["Communication", "Leadership", "Creativity"],
      interest_areas: ["Education"],
      required_skills: ["Curriculum Design", "Classroom Management", "Assessment", "Communication"],
      recommended_courses: ["Educational Psychology", "Teaching Methods", "Curriculum Development"],
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <Button variant="ghost" onClick={() => navigate("/dashboard")} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>

        <div className="mb-8 animate-fade-in">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-hero bg-clip-text text-transparent">
            Your Career Recommendations
          </h1>
          <p className="text-muted-foreground">
            Based on your personality, skills, and interests assessment
          </p>
        </div>

        <div className="space-y-6">
          {careers.map((career, index) => (
            <Card
              key={career.id}
              className="shadow-soft hover:shadow-medium transition-all animate-fade-in cursor-pointer"
              style={{ animationDelay: `${index * 0.1}s` }}
              onClick={() => navigate(`/roadmap?career=${encodeURIComponent(career.career_title)}`)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-2xl mb-2">{career.career_title}</CardTitle>
                    <CardDescription className="text-base">{career.description}</CardDescription>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-primary">{career.match_score}%</div>
                    <div className="text-sm text-muted-foreground">Match</div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-secondary" />
                  <span className="text-sm font-medium">Demand:</span>
                  <Badge variant="secondary">{career.demand_trend}</Badge>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Award className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Required Skills:</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {career.required_skills.map((skill, i) => (
                      <Badge key={i} variant="outline">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <BookOpen className="h-4 w-4 text-accent" />
                    <span className="text-sm font-medium">Recommended Courses:</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {career.recommended_courses.map((course, i) => (
                      <Badge key={i} variant="outline" className="bg-accent/10">
                        {course}
                      </Badge>
                    ))}
                  </div>
                </div>

                <Button className="w-full mt-4" onClick={() => navigate(`/roadmap?career=${encodeURIComponent(career.career_title)}`)}>
                  View Learning Roadmap
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Recommendations;
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, ArrowRight } from "lucide-react";

const personalityQuestions = [
  { id: "p1", question: "I prefer working with data and analysis", trait: "Analytical" },
  { id: "p2", question: "I enjoy creative and artistic activities", trait: "Artistic" },
  { id: "p3", question: "I like helping and supporting others", trait: "Social" },
  { id: "p4", question: "I prefer structured and organized tasks", trait: "Conventional" },
  { id: "p5", question: "I enjoy leading and persuading others", trait: "Enterprising" },
  { id: "p6", question: "I like hands-on practical work", trait: "Realistic" },
  { id: "p7", question: "I enjoy solving complex problems", trait: "Investigative" },
  { id: "p8", question: "I prefer collaborative team projects", trait: "Social" },
  { id: "p9", question: "I like creating innovative solutions", trait: "Artistic" },
  { id: "p10", question: "I enjoy managing and organizing", trait: "Enterprising" },
];

const skillsQuestions = [
  { id: "s1", skill: "Communication", category: "Soft Skills" },
  { id: "s2", skill: "Problem Solving", category: "Cognitive" },
  { id: "s3", skill: "Technical/Programming", category: "Technical" },
  { id: "s4", skill: "Leadership", category: "Soft Skills" },
  { id: "s5", skill: "Creativity", category: "Cognitive" },
  { id: "s6", skill: "Data Analysis", category: "Technical" },
  { id: "s7", skill: "Teamwork", category: "Soft Skills" },
  { id: "s8", skill: "Project Management", category: "Technical" },
];

const interestCategories = [
  { id: "i1", category: "Technology & IT", icon: "💻" },
  { id: "i2", category: "Business & Finance", icon: "💼" },
  { id: "i3", category: "Arts & Design", icon: "🎨" },
  { id: "i4", category: "Science & Research", icon: "🔬" },
  { id: "i5", category: "Healthcare", icon: "🏥" },
  { id: "i6", category: "Education", icon: "📚" },
];

const Assessment = () => {
  const [step, setStep] = useState(1);
  const [personalityAnswers, setPersonalityAnswers] = useState<Record<string, number>>({});
  const [skillsAnswers, setSkillsAnswers] = useState<Record<string, number>>({});
  const [interestsAnswers, setInterestsAnswers] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const totalSteps = 3;
  const progress = (step / totalSteps) * 100;

  const handlePersonalityAnswer = (questionId: string, value: number) => {
    setPersonalityAnswers({ ...personalityAnswers, [questionId]: value });
  };

  const handleSkillsAnswer = (skillId: string, value: number) => {
    setSkillsAnswers({ ...skillsAnswers, [skillId]: value });
  };

  const handleInterestsAnswer = (categoryId: string, value: number) => {
    setInterestsAnswers({ ...interestsAnswers, [categoryId]: value });
  };

  const calculatePersonalityScore = () => {
    const traits: Record<string, number> = {};
    personalityQuestions.forEach((q) => {
      const answer = personalityAnswers[q.id] || 0;
      traits[q.trait] = (traits[q.trait] || 0) + answer;
    });
    return traits;
  };

  const calculateSkillsScore = () => {
    const skills: Record<string, { score: number; category: string }> = {};
    skillsQuestions.forEach((q) => {
      skills[q.skill] = {
        score: skillsAnswers[q.id] || 0,
        category: q.category,
      };
    });
    return skills;
  };

  const calculateInterestsScore = () => {
    const interests: Record<string, number> = {};
    interestCategories.forEach((cat) => {
      interests[cat.category] = interestsAnswers[cat.id] || 0;
    });
    return interests;
  };

  const determinePersonalityType = (traits: Record<string, number>) => {
    const sortedTraits = Object.entries(traits).sort((a, b) => b[1] - a[1]);
    return sortedTraits[0]?.[0] || "Analytical";
  };

  const submitAssessment = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const personalityScore = calculatePersonalityScore();
      const skillsScore = calculateSkillsScore();
      const interestsScore = calculateInterestsScore();
      const personalityType = determinePersonalityType(personalityScore);

      const { error } = await supabase.from("assessments").insert({
        user_id: session.user.id,
        personality_score: personalityScore,
        skills_score: skillsScore,
        interests_score: interestsScore,
        personality_type: personalityType,
      });

      if (error) throw error;

      toast({
        title: "Assessment Complete!",
        description: "Generating your career recommendations...",
      });

      navigate("/recommendations");
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

  const canProceed = () => {
    if (step === 1) return Object.keys(personalityAnswers).length === personalityQuestions.length;
    if (step === 2) return Object.keys(skillsAnswers).length === skillsQuestions.length;
    if (step === 3) return Object.keys(interestsAnswers).length === interestCategories.length;
    return false;
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-8">
          <Button variant="ghost" onClick={() => navigate("/dashboard")} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Step {step} of {totalSteps}</span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </div>

        <Card className="shadow-medium">
          <CardHeader>
            <CardTitle className="text-2xl">
              {step === 1 && "Personality Assessment"}
              {step === 2 && "Skills Evaluation"}
              {step === 3 && "Interest Survey"}
            </CardTitle>
            <CardDescription>
              {step === 1 && "Rate how much each statement describes you (1 = Strongly Disagree, 5 = Strongly Agree)"}
              {step === 2 && "Rate your proficiency in each skill (1 = Beginner, 5 = Expert)"}
              {step === 3 && "Rate your interest in each field (1 = Not Interested, 5 = Very Interested)"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {step === 1 &&
              personalityQuestions.map((q) => (
                <div key={q.id} className="space-y-3 p-4 rounded-lg bg-muted/50">
                  <Label className="text-base">{q.question}</Label>
                  <RadioGroup
                    value={personalityAnswers[q.id]?.toString()}
                    onValueChange={(value) => handlePersonalityAnswer(q.id, parseInt(value))}
                    className="flex gap-4"
                  >
                    {[1, 2, 3, 4, 5].map((value) => (
                      <div key={value} className="flex items-center space-x-2">
                        <RadioGroupItem value={value.toString()} id={`${q.id}-${value}`} />
                        <Label htmlFor={`${q.id}-${value}`} className="cursor-pointer">
                          {value}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              ))}

            {step === 2 &&
              skillsQuestions.map((q) => (
                <div key={q.id} className="space-y-3 p-4 rounded-lg bg-muted/50">
                  <div>
                    <Label className="text-base">{q.skill}</Label>
                    <p className="text-sm text-muted-foreground">{q.category}</p>
                  </div>
                  <RadioGroup
                    value={skillsAnswers[q.id]?.toString()}
                    onValueChange={(value) => handleSkillsAnswer(q.id, parseInt(value))}
                    className="flex gap-4"
                  >
                    {[1, 2, 3, 4, 5].map((value) => (
                      <div key={value} className="flex items-center space-x-2">
                        <RadioGroupItem value={value.toString()} id={`${q.id}-${value}`} />
                        <Label htmlFor={`${q.id}-${value}`} className="cursor-pointer">
                          {value}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              ))}

            {step === 3 &&
              interestCategories.map((cat) => (
                <div key={cat.id} className="space-y-3 p-4 rounded-lg bg-muted/50">
                  <Label className="text-base flex items-center gap-2">
                    <span className="text-2xl">{cat.icon}</span>
                    {cat.category}
                  </Label>
                  <RadioGroup
                    value={interestsAnswers[cat.id]?.toString()}
                    onValueChange={(value) => handleInterestsAnswer(cat.id, parseInt(value))}
                    className="flex gap-4"
                  >
                    {[1, 2, 3, 4, 5].map((value) => (
                      <div key={value} className="flex items-center space-x-2">
                        <RadioGroupItem value={value.toString()} id={`${cat.id}-${value}`} />
                        <Label htmlFor={`${cat.id}-${value}`} className="cursor-pointer">
                          {value}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              ))}

            <div className="flex justify-between pt-6">
              <Button
                variant="outline"
                onClick={() => setStep(step - 1)}
                disabled={step === 1}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>
              {step < totalSteps ? (
                <Button onClick={() => setStep(step + 1)} disabled={!canProceed()}>
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button onClick={submitAssessment} disabled={!canProceed() || loading}>
                  {loading ? "Submitting..." : "Complete Assessment"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Assessment;
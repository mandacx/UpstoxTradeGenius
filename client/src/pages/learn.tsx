import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  BookOpen, 
  Trophy, 
  Star, 
  Clock, 
  Target, 
  CheckCircle, 
  PlayCircle,
  Award,
  TrendingUp,
  Brain,
  Zap,
  Users
} from "lucide-react";

interface LearningPath {
  id: number;
  title: string;
  description: string;
  difficulty: string;
  estimatedTime: number;
  category: string;
  prerequisites: number[];
  isActive: boolean;
  sortOrder: number;
}

interface Lesson {
  id: number;
  pathId: number;
  title: string;
  description: string;
  content: string;
  lessonType: string;
  estimatedTime: number;
  points: number;
  sortOrder: number;
}

interface Quiz {
  id: number;
  lessonId: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  points: number;
}

interface UserProgress {
  id: number;
  userId: number;
  pathId?: number;
  lessonId?: number;
  status: string;
  progress: number;
  score: number;
  timeSpent: number;
  completedAt?: string;
}

interface Achievement {
  id: number;
  title: string;
  description: string;
  icon: string;
  category: string;
  points: number;
  isHidden: boolean;
}

interface UserAchievement {
  id: number;
  userId: number;
  achievementId: number;
  unlockedAt: string;
  notified: boolean;
}

interface UserStats {
  id: number;
  userId: number;
  totalPoints: number;
  level: number;
  experiencePoints: number;
  lessonsCompleted: number;
  pathsCompleted: number;
  quizAverage: number;
  currentStreak: number;
  longestStreak: number;
}

const difficultyColors = {
  beginner: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  intermediate: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  advanced: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
};

const categoryIcons = {
  fundamentals: BookOpen,
  technical_analysis: TrendingUp,
  risk_management: Target,
  derivatives: Brain,
  algorithms: Zap
};

export default function Learn() {
  const [selectedPath, setSelectedPath] = useState<LearningPath | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [currentQuiz, setCurrentQuiz] = useState<Quiz | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [showResults, setShowResults] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch learning paths
  const { data: learningPaths = [], isLoading: pathsLoading } = useQuery({
    queryKey: ["/api/learning/paths"],
  });

  // Fetch user stats
  const { data: userStats } = useQuery({
    queryKey: ["/api/learning/stats"],
  });

  // Fetch user achievements
  const { data: userAchievements = [] } = useQuery({
    queryKey: ["/api/learning/user-achievements"],
  });

  // Fetch all achievements
  const { data: achievements = [] } = useQuery({
    queryKey: ["/api/learning/achievements"],
  });

  // Fetch user progress
  const { data: userProgress = [] } = useQuery({
    queryKey: ["/api/learning/progress"],
  });

  // Fetch lessons for selected path
  const { data: lessons = [] } = useQuery({
    queryKey: ["/api/learning/paths", selectedPath?.id, "lessons"],
    enabled: !!selectedPath,
  });

  // Fetch quizzes for selected lesson
  const { data: quizzes = [] } = useQuery({
    queryKey: ["/api/learning/lessons", selectedLesson?.id, "quizzes"],
    enabled: !!selectedLesson,
  });

  // Progress tracking mutation
  const progressMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/learning/progress", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/learning/progress"] });
      queryClient.invalidateQueries({ queryKey: ["/api/learning/stats"] });
    },
  });

  const calculateLevelProgress = (xp: number) => {
    const level = Math.floor(xp / 100) + 1;
    const progressInLevel = (xp % 100);
    return { level, progressInLevel };
  };

  const getPathProgress = (pathId: number) => {
    const pathProgress = userProgress.filter(p => p.pathId === pathId);
    const completedLessons = pathProgress.filter(p => p.status === 'completed').length;
    const totalLessons = lessons.length;
    return totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;
  };

  const isPathUnlocked = (path: LearningPath) => {
    if (!path.prerequisites || path.prerequisites.length === 0) return true;
    
    return path.prerequisites.every(prereqId => {
      const prereqProgress = getPathProgress(prereqId);
      return prereqProgress === 100;
    });
  };

  const handleStartLesson = (lesson: Lesson) => {
    setSelectedLesson(lesson);
    setActiveTab("lesson");
    
    // Track lesson start
    progressMutation.mutate({
      lessonId: lesson.id,
      pathId: lesson.pathId,
      status: 'in_progress',
      progress: 0
    });
  };

  const handleCompleteLesson = () => {
    if (!selectedLesson) return;
    
    // Mark lesson as completed
    progressMutation.mutate({
      lessonId: selectedLesson.id,
      pathId: selectedLesson.pathId,
      status: 'completed',
      progress: 100,
      completedAt: new Date().toISOString()
    });

    toast({
      title: "Lesson Completed!",
      description: `You earned ${selectedLesson.points} points`,
    });

    setActiveTab("overview");
    setSelectedLesson(null);
  };

  const handleQuizSubmit = () => {
    if (!quizzes.length) return;
    
    let correctAnswers = 0;
    quizzes.forEach((quiz: Quiz) => {
      if (quizAnswers[quiz.id] === quiz.correctAnswer) {
        correctAnswers++;
      }
    });
    
    const score = Math.round((correctAnswers / quizzes.length) * 100);
    setShowResults(true);

    // Update progress with quiz score
    if (selectedLesson) {
      progressMutation.mutate({
        lessonId: selectedLesson.id,
        pathId: selectedLesson.pathId,
        status: 'completed',
        progress: 100,
        score: score,
        completedAt: new Date().toISOString()
      });
    }

    toast({
      title: score >= 80 ? "Great Job!" : "Quiz Completed",
      description: `You scored ${score}% on the quiz`,
    });
  };

  const { level, progressInLevel } = userStats ? calculateLevelProgress(userStats.experiencePoints) : { level: 1, progressInLevel: 0 };

  if (pathsLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Trading Academy</h1>
        <p className="text-muted-foreground">Master trading strategies through interactive lessons and hands-on practice</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="paths">Learning Paths</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
          <TabsTrigger value="lesson" disabled={!selectedLesson}>
            {selectedLesson ? "Current Lesson" : "Lesson"}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* User Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Level</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{level}</div>
                <Progress value={progressInLevel} className="mt-2" />
                <p className="text-xs text-muted-foreground mt-1">{progressInLevel}/100 XP</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Points</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold flex items-center">
                  <Trophy className="w-5 h-5 mr-2 text-yellow-500" />
                  {userStats?.totalPoints || 0}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Lessons Completed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold flex items-center">
                  <CheckCircle className="w-5 h-5 mr-2 text-green-500" />
                  {userStats?.lessonsCompleted || 0}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold flex items-center">
                  <Star className="w-5 h-5 mr-2 text-orange-500" />
                  {userStats?.currentStreak || 0} days
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Achievements */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Achievements</CardTitle>
              <CardDescription>Your latest accomplishments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {userAchievements.slice(0, 3).map((userAch: UserAchievement) => {
                  const achievement = achievements.find((a: Achievement) => a.id === userAch.achievementId);
                  if (!achievement) return null;
                  
                  return (
                    <div key={userAch.id} className="flex items-center p-3 bg-muted rounded-lg">
                      <div className="text-2xl mr-3">{achievement.icon}</div>
                      <div>
                        <h4 className="font-semibold">{achievement.title}</h4>
                        <p className="text-sm text-muted-foreground">{achievement.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="paths" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {learningPaths.map((path: LearningPath) => {
              const IconComponent = categoryIcons[path.category as keyof typeof categoryIcons] || BookOpen;
              const isUnlocked = isPathUnlocked(path);
              const progress = getPathProgress(path.id);
              
              return (
                <Card 
                  key={path.id} 
                  className={`cursor-pointer transition-all hover:shadow-lg ${!isUnlocked ? 'opacity-50' : ''}`}
                  onClick={() => isUnlocked && setSelectedPath(path)}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <IconComponent className="w-8 h-8 text-primary" />
                      <Badge className={difficultyColors[path.difficulty as keyof typeof difficultyColors]}>
                        {path.difficulty}
                      </Badge>
                    </div>
                    <CardTitle className="line-clamp-2">{path.title}</CardTitle>
                    <CardDescription className="line-clamp-3">{path.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Clock className="w-4 h-4 mr-1" />
                        {path.estimatedTime} minutes
                      </div>
                      <Progress value={progress} className="h-2" />
                      <p className="text-sm text-muted-foreground">{Math.round(progress)}% complete</p>
                    </div>
                    {!isUnlocked && (
                      <div className="mt-4 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded text-sm text-yellow-800 dark:text-yellow-200">
                        Complete prerequisite paths to unlock
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Path Details Dialog */}
          {selectedPath && (
            <Dialog open={!!selectedPath} onOpenChange={() => setSelectedPath(null)}>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{selectedPath.title}</DialogTitle>
                  <DialogDescription>{selectedPath.description}</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold mb-2">Lessons</h4>
                      <div className="space-y-2">
                        {lessons.map((lesson: Lesson) => {
                          const lessonProgress = userProgress.find(p => p.lessonId === lesson.id);
                          const isCompleted = lessonProgress?.status === 'completed';
                          
                          return (
                            <div key={lesson.id} className="flex items-center justify-between p-3 border rounded">
                              <div className="flex items-center">
                                {isCompleted ? (
                                  <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                                ) : (
                                  <PlayCircle className="w-5 h-5 text-muted-foreground mr-2" />
                                )}
                                <div>
                                  <h5 className="font-medium">{lesson.title}</h5>
                                  <p className="text-sm text-muted-foreground">{lesson.estimatedTime} min</p>
                                </div>
                              </div>
                              <Button 
                                size="sm" 
                                onClick={() => handleStartLesson(lesson)}
                                variant={isCompleted ? "outline" : "default"}
                              >
                                {isCompleted ? "Review" : "Start"}
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </TabsContent>

        <TabsContent value="achievements" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {achievements.map((achievement: Achievement) => {
              const isUnlocked = userAchievements.some((ua: UserAchievement) => ua.achievementId === achievement.id);
              
              return (
                <Card key={achievement.id} className={!isUnlocked ? 'opacity-50' : ''}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="text-3xl">{achievement.icon}</div>
                      <Badge variant={isUnlocked ? "default" : "secondary"}>
                        {achievement.points} pts
                      </Badge>
                    </div>
                    <CardTitle>{achievement.title}</CardTitle>
                    <CardDescription>{achievement.description}</CardDescription>
                  </CardHeader>
                  {isUnlocked && (
                    <CardContent>
                      <div className="flex items-center text-sm text-green-600 dark:text-green-400">
                        <Award className="w-4 h-4 mr-1" />
                        Unlocked
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="lesson" className="space-y-6">
          {selectedLesson && (
            <Card>
              <CardHeader>
                <CardTitle>{selectedLesson.title}</CardTitle>
                <CardDescription>{selectedLesson.description}</CardDescription>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    {selectedLesson.estimatedTime} min
                  </span>
                  <span className="flex items-center">
                    <Trophy className="w-4 h-4 mr-1" />
                    {selectedLesson.points} points
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Lesson Content */}
                <div className="prose dark:prose-invert max-w-none">
                  <div dangerouslySetInnerHTML={{ __html: selectedLesson.content.replace(/\n/g, '<br>') }} />
                </div>

                {/* Quiz Section */}
                {quizzes.length > 0 && (
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold mb-4">Knowledge Check</h3>
                    
                    {!showResults ? (
                      <div className="space-y-6">
                        {quizzes.map((quiz: Quiz, index: number) => (
                          <div key={quiz.id} className="space-y-3">
                            <h4 className="font-medium">
                              {index + 1}. {quiz.question}
                            </h4>
                            <RadioGroup
                              value={quizAnswers[quiz.id]?.toString()}
                              onValueChange={(value) => 
                                setQuizAnswers(prev => ({ ...prev, [quiz.id]: parseInt(value) }))
                              }
                            >
                              {quiz.options.map((option: string, optionIndex: number) => (
                                <div key={optionIndex} className="flex items-center space-x-2">
                                  <RadioGroupItem value={optionIndex.toString()} id={`${quiz.id}-${optionIndex}`} />
                                  <Label htmlFor={`${quiz.id}-${optionIndex}`}>{option}</Label>
                                </div>
                              ))}
                            </RadioGroup>
                          </div>
                        ))}
                        <Button onClick={handleQuizSubmit} className="w-full">
                          Submit Quiz
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {quizzes.map((quiz: Quiz, index: number) => {
                          const userAnswer = quizAnswers[quiz.id];
                          const isCorrect = userAnswer === quiz.correctAnswer;
                          
                          return (
                            <div key={quiz.id} className="space-y-2">
                              <h4 className="font-medium">
                                {index + 1}. {quiz.question}
                              </h4>
                              <div className={`p-3 rounded ${isCorrect ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
                                <p className="font-medium">
                                  {isCorrect ? "Correct!" : "Incorrect"}
                                </p>
                                <p className="text-sm">{quiz.explanation}</p>
                              </div>
                            </div>
                          );
                        })}
                        <Button onClick={handleCompleteLesson} className="w-full">
                          Complete Lesson
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {/* Complete lesson button if no quiz */}
                {quizzes.length === 0 && (
                  <Button onClick={handleCompleteLesson} className="w-full">
                    Complete Lesson
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
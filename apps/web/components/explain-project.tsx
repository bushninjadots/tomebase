'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  BookOpen, ChevronRight, ChevronDown, CheckCircle, Circle, 
  ArrowRight, ArrowLeft, HelpCircle, Lightbulb, Target
} from 'lucide-react';

interface Page {
  id: string;
  title: string;
  slug: string;
  content: string;
  order: number;
  parentId: string | null;
}

interface ReadingProgress {
  pageId: string;
  completed: boolean;
  lastVisitedAt: string;
}

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

interface ExplainProjectProps {
  projectId: string;
  pages: Page[];
  currentPageId?: string;
}

function buildReadingOrder(pages: Page[]): Page[] {
  const pageMap = new Map(pages.map(p => [p.id, p]));
  const visited = new Set<string>();
  const order: Page[] = [];

  function visit(pageId: string) {
    if (visited.has(pageId)) return;
    visited.add(pageId);
    
    const page = pageMap.get(pageId);
    if (!page) return;
    
    order.push(page);
    
    const children = pages
      .filter(p => p.parentId === pageId)
      .sort((a, b) => a.order - b.order);
    
    for (const child of children) {
      visit(child.id);
    }
  }

  const roots = pages
    .filter(p => !p.parentId)
    .sort((a, b) => a.order - b.order);
  
  for (const root of roots) {
    visit(root.id);
  }

  return order;
}

function generateQuizFromContent(pages: Page[]): QuizQuestion[] {
  const questions: QuizQuestion[] = [];
  
  for (const page of pages.slice(0, 5)) {
    const contentLower = page.content.toLowerCase();
    
    if (contentLower.includes('install') || contentLower.includes('setup')) {
      questions.push({
        id: `q-${page.id}-install`,
        question: `What is the first step to get started with ${page.title}?`,
        options: [
          'Install dependencies',
          'Read the README',
          'Run the tests',
          'Deploy to production'
        ],
        correctIndex: 0,
        explanation: `Based on the ${page.title} documentation, installation is the first step.`
      });
    }
    
    if (contentLower.includes('config') || contentLower.includes('setting')) {
      questions.push({
        id: `q-${page.id}-config`,
        question: `Where should you configure ${page.title}?`,
        options: [
          'In the config file',
          'In the environment variables',
          'In the database',
          'In the UI settings'
        ],
        correctIndex: 0,
        explanation: `Configuration for ${page.title} is typically done in the config file.`
      });
    }
  }
  
  if (questions.length === 0) {
    questions.push({
      id: 'q-general-1',
      question: 'What is the recommended way to navigate this documentation?',
      options: [
        'Start with the overview and follow the reading order',
        'Skip to the API reference',
        'Read pages in alphabetical order',
        'Only read pages with high view counts'
      ],
      correctIndex: 0,
      explanation: 'Following the recommended reading order helps build understanding progressively.'
    });
  }
  
  return questions;
}

export function ExplainProject({ projectId, pages, currentPageId }: ExplainProjectProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [readingOrder, setReadingOrder] = useState<Page[]>([]);
  const [progress, setProgress] = useState<Map<string, ReadingProgress>>(new Map());
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);

  useEffect(() => {
    const order = buildReadingOrder(pages);
    setReadingOrder(order);
    setQuizQuestions(generateQuizFromContent(pages));
    
    const savedProgress = localStorage.getItem(`reading-progress-${projectId}`);
    if (savedProgress) {
      try {
        const parsed = JSON.parse(savedProgress) as ReadingProgress[];
        const progressMap = new Map(parsed.map(p => [p.pageId, p]));
        setProgress(progressMap);
      } catch {
        // Ignore parse errors
      }
    }
  }, [projectId, pages]);

  useEffect(() => {
    if (currentPageId && readingOrder.length > 0) {
      const newProgress = new Map(progress);
      newProgress.set(currentPageId, {
        pageId: currentPageId,
        completed: false,
        lastVisitedAt: new Date().toISOString()
      });
      setProgress(newProgress);
      localStorage.setItem(
        `reading-progress-${projectId}`,
        JSON.stringify(Array.from(newProgress.values()))
      );
    }
  }, [currentPageId, readingOrder, projectId]);

  const markAsCompleted = useCallback((pageId: string) => {
    const newProgress = new Map(progress);
    newProgress.set(pageId, {
      pageId,
      completed: true,
      lastVisitedAt: new Date().toISOString()
    });
    setProgress(newProgress);
    localStorage.setItem(
      `reading-progress-${projectId}`,
      JSON.stringify(Array.from(newProgress.values()))
    );
  }, [progress, projectId]);

  const getNextPage = useCallback(() => {
    if (!currentPageId) return readingOrder[0];
    const currentIndex = readingOrder.findIndex(p => p.id === currentPageId);
    if (currentIndex === -1 || currentIndex === readingOrder.length - 1) return null;
    return readingOrder[currentIndex + 1];
  }, [currentPageId, readingOrder]);

  const getPreviousPage = useCallback(() => {
    if (!currentPageId) return null;
    const currentIndex = readingOrder.findIndex(p => p.id === currentPageId);
    if (currentIndex <= 0) return null;
    return readingOrder[currentIndex - 1];
  }, [currentPageId, readingOrder]);

  const handleAnswerSelect = (answerIndex: number) => {
    if (showExplanation) return;
    setSelectedAnswer(answerIndex);
  };

  const handleSubmitAnswer = () => {
    if (selectedAnswer === null) return;
    setShowExplanation(true);
    
    const currentQuestion = quizQuestions[currentQuestionIndex];
    if (currentQuestion && selectedAnswer === currentQuestion.correctIndex) {
      setQuizScore(prev => prev + 1);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < quizQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    } else {
      setQuizCompleted(true);
    }
  };

  const resetQuiz = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setQuizScore(0);
    setQuizCompleted(false);
    setShowQuiz(false);
  };

  const completedCount = Array.from(progress.values()).filter(p => p.completed).length;
  const progressPercentage = readingOrder.length > 0 
    ? Math.round((completedCount / readingOrder.length) * 100) 
    : 0;

  const currentIndex = currentPageId 
    ? readingOrder.findIndex(p => p.id === currentPageId) 
    : -1;

  return (
    <div className="rounded-lg border border-theme-border bg-theme-card">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full px-4 py-3 text-left hover:bg-theme-hover transition-colors"
      >
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-fluid-600" />
          <span className="font-medium text-theme-main">Explain This Project</span>
        </div>
        {isExpanded ? (
          <ChevronDown className="h-4 w-4 text-theme-muted" />
        ) : (
          <ChevronRight className="h-4 w-4 text-theme-muted" />
        )}
      </button>

      {isExpanded && (
        <div className="border-t border-theme-border max-h-96 overflow-y-auto">
          <div className="p-4">
            <div className="mb-4">
              <div className="flex items-center justify-between text-sm text-theme-subtle mb-2">
                <span>Reading Progress</span>
                <span>{completedCount}/{readingOrder.length} pages ({progressPercentage}%)</span>
              </div>
              <div className="w-full bg-theme-hover rounded-full h-2">
                <div 
                  className="bg-fluid-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>

            {readingOrder.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-theme-subtle mb-2">Recommended Reading Order</h4>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {readingOrder.map((page, index) => {
                    const pageProgress = progress.get(page.id);
                    const isCompleted = pageProgress?.completed;
                    const isCurrent = page.id === currentPageId;
                    
                    return (
                      <div
                        key={page.id}
                        className={`flex items-center gap-2 px-2 py-1.5 rounded text-sm ${
                          isCurrent 
                            ? 'bg-fluid-50 text-fluid-700' 
                            : isCompleted 
                              ? 'text-green-600' 
                              : 'text-theme-subtle'
                        }`}
                      >
                        {isCompleted ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <Circle className="h-4 w-4 text-theme-muted" />
                        )}
                        <span className="flex-1 truncate">{page.title}</span>
                        <span className="text-xs text-theme-muted">{index + 1}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                {getPreviousPage() && (
                  <a
                    href={`/docs/${projectId}/${getPreviousPage()!.slug}`}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm text-theme-subtle hover:bg-theme-hover rounded transition-colors"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Previous
                    </a>
                  )}
                  {getNextPage() && (
                    <a
                      href={`/docs/${projectId}/${getNextPage()!.slug}`}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm text-theme-subtle hover:bg-theme-hover rounded transition-colors"
                  >
                    Next
                    <ArrowRight className="h-4 w-4" />
                  </a>
                )}
              </div>
              
              {currentPageId && (
                <button
                  onClick={() => markAsCompleted(currentPageId)}
                  className={`flex items-center gap-1 px-3 py-1.5 text-sm rounded transition-colors ${
                    progress.get(currentPageId)?.completed
                      ? 'bg-green-100 text-green-700'
                      : 'bg-fluid-100 text-fluid-700 hover:bg-fluid-200'
                  }`}
                >
                  {progress.get(currentPageId)?.completed ? (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      Completed
                    </>
                  ) : (
                    <>
                      <Target className="h-4 w-4" />
                      Mark as Read
                    </>
                  )}
                </button>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-theme-border">
              <button
                onClick={() => setShowQuiz(!showQuiz)}
                className="flex items-center gap-2 text-sm font-medium text-fluid-600 hover:text-fluid-700"
              >
                <HelpCircle className="h-4 w-4" />
                {showQuiz ? 'Hide Quiz' : 'Take a Quiz'}
              </button>
              
              {showQuiz && (
                <div className="mt-3 p-4 bg-theme-hover rounded-lg">
                  {quizCompleted ? (
                    <div className="text-center">
                      <div className="text-2xl font-bold text-theme-main mb-2">
                        {quizScore}/{quizQuestions.length}
                      </div>
                      <p className="text-sm text-theme-subtle mb-4">
                        {quizScore === quizQuestions.length 
                          ? 'Perfect score! You understand this project well.'
                          : 'Keep learning! Review the docs and try again.'
                        }
                      </p>
                      <button
                        onClick={resetQuiz}
                        className="px-4 py-2 bg-fluid-600 text-white rounded-lg hover:bg-fluid-700 transition-colors"
                      >
                        Try Again
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-theme-subtle">
                          Question {currentQuestionIndex + 1} of {quizQuestions.length}
                        </span>
                        <span className="text-sm text-theme-subtle">
                          Score: {quizScore}
                        </span>
                      </div>
                      
                      <p className="text-sm text-theme-main mb-3">
                        {quizQuestions[currentQuestionIndex]?.question}
                      </p>
                      
                      <div className="space-y-2 mb-4">
                        {quizQuestions[currentQuestionIndex]?.options.map((option, index) => (
                          <button
                            key={index}
                            onClick={() => handleAnswerSelect(index)}
                            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                              selectedAnswer === index
                                ? showExplanation
                                  ? index === quizQuestions[currentQuestionIndex]?.correctIndex
                                    ? 'bg-green-100 text-green-800 border border-green-200'
                                    : 'bg-red-100 text-red-800 border border-red-200'
                                  : 'bg-fluid-100 text-fluid-800 border border-fluid-200'
                                : 'bg-theme-card text-theme-subtle border border-theme-border hover:bg-theme-hover'
                            }`}
                            disabled={showExplanation}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                      
                      {showExplanation && (
                        <div className="p-3 bg-theme-accent-light rounded-lg mb-4">
                          <div className="flex items-start gap-2">
                            <Lightbulb className="h-4 w-4 text-theme-accent mt-0.5" />
                            <p className="text-sm text-theme-main">
                              {quizQuestions[currentQuestionIndex]?.explanation}
                            </p>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex justify-end gap-2">
                        {!showExplanation ? (
                          <button
                            onClick={handleSubmitAnswer}
                            disabled={selectedAnswer === null}
                            className="px-4 py-2 bg-fluid-600 text-white rounded-lg hover:bg-fluid-700 transition-colors disabled:opacity-50"
                          >
                            Submit Answer
                          </button>
                        ) : (
                          <button
                            onClick={handleNextQuestion}
                            className="px-4 py-2 bg-fluid-600 text-white rounded-lg hover:bg-fluid-700 transition-colors"
                          >
                            {currentQuestionIndex < quizQuestions.length - 1 ? 'Next Question' : 'See Results'}
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema, ZodError } from 'zod';

export const validateBody = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const issue = result.error.issues[0];
      return res.status(400).json({
        message: issue ? issue.message : 'Invalid request data',
        errors: result.error.issues.map(e => ({ path: e.path.join('.'), message: e.message }))
      });
    }
    req.body = result.data;
    next();
  };
};

// Authentication Schemas
export const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  role: z.enum(['candidate', 'hr'], {
    message: 'Invalid role. Allowed roles are candidate or hr.'
  }),
  company: z.string().optional(),
  position: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// Interview Schemas
export const scheduleInterviewSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  candidateEmail: z.string().email('Valid candidate email is required'),
  scheduledFor: z.union([z.string(), z.date()]),
  duration: z.number().positive().optional().default(60),
  jobRole: z.string().optional().default('web-developer'),
  experienceLevel: z.string().optional().default('mid-level'),
});

// Admin Blog Creation Schema (Strictly whitelisted fields to prevent mass assignment)
export const createBlogSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  slug: z.string().min(1, 'Slug is required'),
  content: z.string().min(1, 'Content is required'),
  summary: z.string().optional(),
  category: z.string().min(1, 'Category ID is required'),
  tags: z.array(z.string()).optional().default([]),
  coverImage: z.string().optional(),
  status: z.enum(['draft', 'published']).optional().default('draft'),
  publishedAt: z.union([z.string(), z.date()]).optional(),
});

// Problem Management Schemas
export const createProblemSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  slug: z.string().min(1, 'Slug is required'),
  statement: z.string().min(1, 'Statement is required'),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  topics: z.array(z.string()).min(1, 'At least one topic is required'),
  patterns: z.array(z.string()).optional().default([]),
  constraints: z.array(z.string()).min(1, 'At least one constraint is required'),
  examples: z.array(
    z.object({
      input: z.string(),
      output: z.string(),
      explanation: z.string().optional(),
    })
  ).min(1, 'At least one example is required'),
  starterCode: z.object({
    cpp: z.string().optional(),
    java: z.string().optional(),
    python: z.string().optional(),
    javascript: z.string().optional(),
    typescript: z.string().optional(),
  }).optional(),
  hints: z.array(z.string()).optional().default([]),
  editorial: z.string().optional(),
  timeComplexity: z.string().optional(),
  spaceComplexity: z.string().optional(),
  status: z.enum(['published', 'draft']).optional().default('published'),
  companyTags: z.array(z.string()).optional().default([]),
  testCases: z.array(
    z.object({
      input: z.string(),
      expectedOutput: z.string(),
      isHidden: z.boolean().optional().default(false),
      order: z.number().optional().default(1),
    })
  ).optional().default([]),
});

export const updateProblemSchema = createProblemSchema.partial();

// Roadmap Management Schemas
export const createRoadmapSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  slug: z.string().min(1, 'Slug is required'),
  description: z.string().min(1, 'Description is required'),
  category: z.string().min(1, 'Category is required'),
  order: z.number().int().min(1),
  prerequisites: z.array(z.string()).optional().default([]),
  estimatedHours: z.number().min(1).default(4),
  associatedProblemIds: z.array(z.string()).optional().default([]),
});

export const updateRoadmapSchema = createRoadmapSchema.partial();

// Submission Schemas
export const createSubmissionSchema = z.object({
  problemId: z.string().min(1, 'Problem ID is required'),
  language: z.enum(['python', 'javascript', 'typescript', 'cpp', 'java'], {
    message: 'Language must be python, javascript, typescript, cpp, or java',
  }),
  sourceCode: z.string().min(1, 'Source code cannot be empty').max(65536, 'Source code cannot exceed 64KB'),
  isSampleRun: z.boolean().optional().default(false),
  assessmentId: z.string().optional(),
  attemptId: z.string().optional(),
});

// Assessment Schemas
export const createAssessmentSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  slug: z.string().min(1, 'Slug is required'),
  description: z.string().min(1, 'Description is required'),
  instructions: z.array(z.string()).optional().default([]),
  durationMinutes: z.number().int().min(5, 'Duration must be at least 5 minutes').max(300, 'Duration cannot exceed 5 hours'),
  problemIds: z.array(z.string()).min(1, 'At least one problem is required'),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional().default('medium'),
  passingScore: z.number().min(0).max(100).optional().default(70),
  tags: z.array(z.string()).optional().default([]),
  isPublished: z.boolean().optional().default(true),
});

export const updateAssessmentSchema = createAssessmentSchema.partial();

// Core CS Concept Attempt Schema
export const createConceptAttemptSchema = z.object({
  itemId: z.string().min(1, 'Item ID is required'),
  selectedOption: z.number().int().min(0, 'Selected option must be a non-negative integer'),
  timeSpentSeconds: z.number().min(0).optional().default(0),
});

// System Design Submission Schema
export const saveSystemDesignSubmissionSchema = z.object({
  mermaidDiagram: z.string().max(20000, 'Diagram cannot exceed 20,000 characters').optional().default(''),
  notes: z.string().max(50000, 'Notes cannot exceed 50,000 characters').optional().default(''),
  rubricSelfScore: z
    .object({
      requirements: z.number().int().min(1).max(5).default(3),
      dataModel: z.number().int().min(1).max(5).default(3),
      architecture: z.number().int().min(1).max(5).default(3),
      scalability: z.number().int().min(1).max(5).default(3),
      reliability: z.number().int().min(1).max(5).default(3),
      security: z.number().int().min(1).max(5).default(3),
      tradeoffs: z.number().int().min(1).max(5).default(3),
    })
    .optional(),
});

// Behavioral STAR Story Schemas
export const createStarStorySchema = z.object({
  title: z.string().min(1, 'Title is required').max(150, 'Title cannot exceed 150 characters'),
  category: z.enum([
    'leadership',
    'conflict',
    'failure',
    'teamwork',
    'problem-solving',
    'adaptability',
    'general',
  ]).optional().default('general'),
  questionId: z.string().optional(),
  situation: z.string().min(10, 'Situation requires at least 10 characters').max(3000),
  task: z.string().min(10, 'Task requires at least 10 characters').max(3000),
  action: z.string().min(15, 'Action requires at least 15 characters').max(5000),
  result: z.string().min(10, 'Result requires at least 10 characters').max(3000),
  metrics: z.string().max(1000).optional().default(''),
  learnings: z.string().max(2000).optional().default(''),
  companyTags: z.array(z.string()).optional().default([]),
});

export const updateStarStorySchema = createStarStorySchema.partial();

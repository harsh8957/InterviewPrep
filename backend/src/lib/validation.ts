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

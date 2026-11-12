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

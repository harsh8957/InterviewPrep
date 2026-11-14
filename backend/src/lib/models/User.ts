import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUserProfile {
  headline?: string;
  targetRole?: string;
  skills?: string[];
  githubUrl?: string;
  linkedinUrl?: string;
  experienceYears?: number;
  bio?: string;
  learningGoals?: string[];
  timezone?: string;
  isPublic?: boolean;
  username?: string;
}

export interface IUser extends mongoose.Document {
  email: string;
  password: string;
  role: 'candidate' | 'hr' | 'admin';
  firstName: string;
  lastName: string;
  company?: string;
  position?: string;
  profile?: IUserProfile;
  createdAt?: Date;
  updatedAt?: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userProfileSchema = new mongoose.Schema(
  {
    headline: { type: String, trim: true, maxlen: 120 },
    targetRole: { type: String, trim: true, default: 'Full-Stack Developer' },
    skills: [{ type: String, trim: true }],
    githubUrl: { type: String, trim: true },
    linkedinUrl: { type: String, trim: true },
    experienceYears: { type: Number, min: 0, max: 50, default: 0 },
    bio: { type: String, trim: true, maxlen: 1000 },
    learningGoals: [{ type: String, trim: true }],
    timezone: { type: String, default: 'UTC' },
    isPublic: { type: Boolean, default: false },
    username: { type: String, trim: true, lowercase: true, sparse: true, index: true },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['candidate', 'hr', 'admin'],
    required: true,
  },
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  company: {
    type: String,
    required: function(this: any) {
      return this.role === 'hr';
    },
  },
  position: {
    type: String,
    required: function(this: any) {
      return this.role === 'hr';
    },
  },
  profile: {
    type: userProfileSchema,
    default: () => ({
      headline: 'Software Engineer',
      targetRole: 'Full-Stack Developer',
      skills: ['JavaScript', 'TypeScript', 'React', 'Node.js'],
      timezone: 'UTC',
      isPublic: false,
    }),
  },
}, {
  timestamps: true,
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model<IUser>('User', userSchema);

export { User };
export default User; 
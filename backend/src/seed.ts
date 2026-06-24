import mongoose from 'mongoose';
import 'dotenv/config';
import { FAQCategory, FAQ } from './lib/models/FAQ';
import { BlogCategory, BlogPost } from './lib/models/Blog';
import { Job } from './lib/models/Job';
import { CompanyInfo, TeamMember } from './lib/models/CompanyInfo';
import { PolicyDocument } from './lib/models/PolicyDocument';
import { InterviewTip } from './lib/models/InterviewTip';
import { ResumeGuide } from './lib/models/ResumeGuide';
import User from './lib/models/User';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/echoprep';

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // 1. Clear existing generic content
    await FAQ.deleteMany({});
    await FAQCategory.deleteMany({});
    await BlogCategory.deleteMany({});
    await BlogPost.deleteMany({});
    await Job.deleteMany({});
    await CompanyInfo.deleteMany({});
    await TeamMember.deleteMany({});
    await PolicyDocument.deleteMany({});
    await InterviewTip.deleteMany({});
    await ResumeGuide.deleteMany({});

    // 2. Admin User
    let admin = await User.findOne({ email: 'admin@interviewprep.com' });
    if (!admin) {
      admin = new User({
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@interviewprep.com',
        password: 'Password123!',
        role: 'admin'
      });
      await admin.save();
      console.log('Admin user created');
    }

    // 3. FAQs
    const faqCatGen = await new FAQCategory({ name: 'General', order: 1 }).save();
    const faqCatTech = await new FAQCategory({ name: 'Technical Issues', order: 2 }).save();

    await new FAQ({ category: faqCatGen._id, question: 'What is InterviewPrep?', answer: 'InterviewPrep is an AI-powered mock interview platform...', order: 1 }).save();
    await new FAQ({ category: faqCatTech._id, question: 'My camera is not working, what should I do?', answer: 'Please ensure you have granted browser permissions...', order: 1 }).save();

    // 4. Blogs
    const blogCatCareer = await new BlogCategory({ name: 'Career Advice', slug: 'career-advice' }).save();
    await new BlogPost({
      title: 'How to Ace Your System Design Interview',
      slug: 'ace-system-design',
      content: '<p>System design interviews are crucial...</p>',
      summary: 'Learn the key strategies for passing system design interviews.',
      category: blogCatCareer._id,
      author: admin._id,
      tags: ['System Design', 'Engineering'],
      status: 'published',
      publishedAt: new Date()
    }).save();

    // 5. Jobs
    await new Job({
      title: 'Senior Frontend Engineer',
      department: 'Engineering',
      location: 'Remote',
      type: 'Full-time',
      description: 'We are looking for a senior frontend engineer...',
      requirements: ['5+ years React', 'TypeScript expertise'],
      responsibilities: ['Build UI components', 'Optimize performance']
    }).save();

    // 6. Company Info & Team
    await new CompanyInfo({
      mission: 'To democratize access to high-quality interview preparation through AI.',
      vision: 'A world where everyone can land their dream job regardless of their background.',
      stats: [
        { label: 'Interviews Conducted', value: '100,000+' },
        { label: 'Success Rate', value: '85%' }
      ]
    }).save();

    await new TeamMember({
      name: 'Jane Doe',
      role: 'CEO & Founder',
      bio: 'Former Big Tech engineering manager.',
      order: 1
    }).save();

    // 7. Policies
    await new PolicyDocument({
      type: 'privacy',
      content: '<h1>Privacy Policy</h1><p>We respect your privacy...</p>',
      version: '1.0.0',
      isActive: true
    }).save();

    await new PolicyDocument({
      type: 'terms',
      content: '<h1>Terms of Service</h1><p>By using InterviewPrep...</p>',
      version: '1.0.0',
      isActive: true
    }).save();

    // 8. Interview Tips
    await new InterviewTip({
      title: 'The STAR Method Explained',
      slug: 'star-method',
      content: '<p>Situation, Task, Action, Result...</p>',
      category: 'behavioral',
      difficulty: 'beginner'
    }).save();

    // 9. Resume Guides
    await new ResumeGuide({
      title: 'How to write impactful bullet points',
      slug: 'impactful-bullet-points',
      content: '<p>Always start with an action verb...</p>',
      category: 'content'
    }).save();

    console.log('Seeding completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

seed();

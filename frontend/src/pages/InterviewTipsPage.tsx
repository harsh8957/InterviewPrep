import { useState, useEffect } from 'react';
import { BookOpen, Target, BrainCircuit, ChevronRight } from 'lucide-react';
import PageHero from '../components/ui/PageHero';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';

interface Tip {
  _id: string;
  title: string;
  slug: string;
  category: string;
  difficulty?: string;
  content: string;
}

const InterviewTipsPage = () => {
  const [tips, setTips] = useState<Tip[]>([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState('');
  const [experience, setExperience] = useState('Junior');
  const [roadmap, setRoadmap] = useState<any>(null);
  const [coachLoading, setCoachLoading] = useState(false);
  const API_URL = import.meta.env.VITE_API_URL || '';

  useEffect(() => {
    fetch(`${API_URL}/api/interview-tips`)
      .then(res => res.json())
      .then(data => {
        setTips(data);
        setLoading(false);
      });
  }, [API_URL]);

  const generateRoadmap = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!role) return;
    setCoachLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/interview-tips/coach/roadmap`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, experienceLevel: experience, company: 'Top Tech' })
      });
      const data = await res.json();
      setRoadmap(data);
    } catch (err) {
      console.error(err);
    } finally {
      setCoachLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <PageHero 
        title="Interview Preparation Center" 
        description="Master your interviews with curated guides and our AI-powered Interview Coach."
        badge="Resources"
      />

      <div className="container-content py-12">
        {/* AI Coach Section */}
        <section className="mb-16">
          <div className="card card-gradient border-primary/20">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <BrainCircuit className="text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">AI Interview Coach</h2>
                <p className="text-muted-foreground">Generate a personalized preparation roadmap</p>
              </div>
            </div>

            <form onSubmit={generateRoadmap} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="label">Target Role</label>
                <input 
                  type="text" 
                  className="input" 
                  placeholder="e.g. Frontend Engineer" 
                  value={role}
                  onChange={e => setRole(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="label">Experience Level</label>
                <select className="select" value={experience} onChange={e => setExperience(e.target.value)}>
                  <option value="Junior">Junior (0-2 years)</option>
                  <option value="Mid">Mid-Level (3-5 years)</option>
                  <option value="Senior">Senior (5+ years)</option>
                </select>
              </div>
              <div className="flex items-end">
                <button type="submit" className="btn btn-primary w-full" disabled={coachLoading}>
                  {coachLoading ? 'Generating...' : 'Generate Roadmap'}
                </button>
              </div>
            </form>

            {roadmap && (
              <div className="mt-8 pt-8 border-t border-border animate-fade-in">
                <h3 className="text-xl font-semibold mb-4 text-gradient">Your Preparation Roadmap</h3>
                <div className="space-y-4 mb-6">
                  {roadmap.roadmap?.map((item: any, idx: number) => (
                    <div key={idx} className="p-4 rounded-lg bg-surface border border-border">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-xs font-bold text-primary uppercase tracking-wider">{item.week}</span>
                          <h4 className="font-semibold text-lg">{item.topic}</h4>
                          <p className="text-sm text-muted-foreground mt-1">{item.focus}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <h4 className="font-semibold mb-3">Expected Questions to Practice:</h4>
                <ul className="space-y-2">
                  {roadmap.expectedQuestions?.map((q: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Target size={16} className="text-primary mt-0.5 shrink-0" />
                      <span>{q}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>

        {/* Library */}
        <section>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <BookOpen className="text-primary" /> Strategy Library
            </h2>
          </div>

          {loading ? (
            <LoadingSkeleton />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tips.map(tip => (
                <div key={tip._id} className="card card-hover flex flex-col h-full">
                  <div className="mb-4">
                    <span className="badge badge-primary capitalize mb-2">{tip.category}</span>
                    <h3 className="text-lg font-bold">{tip.title}</h3>
                  </div>
                  <div className="mt-auto pt-4 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground capitalize">{tip.difficulty || 'All Levels'}</span>
                    <button className="flex items-center text-primary font-medium group-hover:text-primary/80 transition-colors">
                      Read Guide <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default InterviewTipsPage;

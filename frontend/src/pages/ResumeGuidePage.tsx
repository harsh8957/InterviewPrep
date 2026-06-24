import { useState, useEffect } from 'react';
import { FileText, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import PageHero from '../components/ui/PageHero';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';

const ResumeGuidePage = () => {
  const [guides, setGuides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [resumeText, setResumeText] = useState('');
  const [analysis, setAnalysis] = useState<any>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const API_URL = import.meta.env.VITE_API_URL || '';

  useEffect(() => {
    fetch(`${API_URL}/api/resume`)
      .then(res => res.json())
      .then(data => {
        setGuides(data);
        setLoading(false);
      });
  }, [API_URL]);

  const analyzeResume = async () => {
    if (!resumeText.trim()) return;
    setAnalyzing(true);
    try {
      const res = await fetch(`${API_URL}/api/resume/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText })
      });
      const data = await res.json();
      setAnalysis(data);
    } catch (err) {
      console.error(err);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <PageHero 
        title="Resume Guide & Analyzer" 
        description="Craft a resume that gets past the ATS and impresses hiring managers."
        badge="Resources"
      />

      <div className="container-content py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          {/* AI Analyzer */}
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2 mb-2">
                <Sparkles className="text-primary" /> AI Resume Review
              </h2>
              <p className="text-muted-foreground">Paste your resume content to get an instant ATS score and feedback.</p>
            </div>
            
            <textarea
              className="input h-64 resize-none font-mono text-sm"
              placeholder="Paste your resume text here..."
              value={resumeText}
              onChange={e => setResumeText(e.target.value)}
            />
            
            <button 
              className="btn btn-primary w-full"
              onClick={analyzeResume}
              disabled={analyzing || !resumeText.trim()}
            >
              {analyzing ? 'Analyzing Resume...' : 'Analyze Resume'}
            </button>
          </div>

          {/* Analysis Results */}
          <div>
            {analysis ? (
              <div className="card animate-fade-in h-full">
                <div className="flex items-center gap-4 mb-6 pb-6 border-b border-border">
                  <div className="relative w-20 h-20 rounded-full border-4 border-primary/20 flex items-center justify-center">
                    <span className="text-2xl font-bold text-primary">{analysis.atsScore}</span>
                    <svg className="absolute inset-0 w-full h-full -rotate-90">
                      <circle cx="36" cy="36" r="36" fill="transparent" stroke="currentColor" strokeWidth="4" className="text-primary" strokeDasharray={`${(analysis.atsScore / 100) * 226} 226`} />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Estimated ATS Score</h3>
                    <p className="text-muted-foreground text-sm">Based on standard screening patterns</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <h4 className="font-semibold text-success flex items-center gap-2 mb-2">
                      <CheckCircle2 size={16} /> Strengths
                    </h4>
                    <ul className="space-y-1">
                      {analysis.strengths?.map((s: string, i: number) => (
                        <li key={i} className="text-sm text-muted-foreground">• {s}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold text-warning flex items-center gap-2 mb-2">
                      <AlertCircle size={16} /> Missing Elements
                    </h4>
                    <ul className="space-y-1">
                      {analysis.missingElements?.map((m: string, i: number) => (
                        <li key={i} className="text-sm text-muted-foreground">• {m}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-primary flex items-center gap-2 mb-2">
                      <Sparkles size={16} /> Actionable Tips
                    </h4>
                    <ul className="space-y-1">
                      {analysis.tips?.map((t: string, i: number) => (
                        <li key={i} className="text-sm text-muted-foreground">• {t}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ) : (
              <div className="card h-full flex flex-col items-center justify-center text-center p-12 bg-surface/50 border-dashed">
                <FileText className="w-12 h-12 text-muted-foreground/30 mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground mb-2">Awaiting Resume</h3>
                <p className="text-sm text-muted-foreground/70">Paste your resume text and hit analyze to get AI-powered insights.</p>
              </div>
            )}
          </div>
        </div>

        {/* Guides */}
        <div>
          <h2 className="text-2xl font-bold mb-6">Resume Writing Guides</h2>
          {loading ? (
            <LoadingSkeleton />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {guides.map(guide => (
                <div key={guide._id} className="card card-hover">
                  <span className="badge badge-primary mb-3 capitalize">{guide.category}</span>
                  <h3 className="font-bold text-lg mb-2">{guide.title}</h3>
                  <button className="text-primary text-sm font-medium hover:underline mt-4">
                    Read Guide &rarr;
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResumeGuidePage;

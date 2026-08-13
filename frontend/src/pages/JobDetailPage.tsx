import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapPin, Clock, ArrowLeft, CheckCircle2, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const JobDetailPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [resumeText, setResumeText] = useState('');
  const [coverLetter, setCoverLetter] = useState('');
  const [applying, setApplying] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const API_URL = import.meta.env.VITE_API_URL || '';

  useEffect(() => {
    fetch(`${API_URL}/api/jobs/${id}`)
      .then(res => res.json())
      .then(data => {
        setJob(data);
        setLoading(false);
      });
  }, [id, API_URL]);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError('Please log in to apply.');
      return;
    }
    
    setApplying(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/jobs/${id}/apply`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ resumeText, coverLetter })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || 'Application failed');
      }
      
      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setApplying(false);
    }
  };

  if (loading) return <div className="container-content py-20 text-center">Loading...</div>;
  if (!job) return <div className="container-content py-20 text-center">Job not found.</div>;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-surface border-b border-border py-12">
        <div className="max-w-4xl mx-auto px-4">
          <Link to="/careers" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-8 transition-colors">
            <ArrowLeft size={16} className="mr-2" /> Back to Careers
          </Link>
          <div className="flex items-center gap-3 mb-4">
            <span className="badge badge-primary">{job.department}</span>
          </div>
          <h1 className="text-4xl font-bold mb-6">{job.title}</h1>
          <div className="flex flex-wrap items-center gap-6 text-muted-foreground">
            <span className="flex items-center gap-2"><MapPin size={18} /> {job.location}</span>
            <span className="flex items-center gap-2"><Clock size={18} /> {job.type}</span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          {/* Job Details */}
          <div className="lg:col-span-2 space-y-8">
            <section>
              <h2 className="text-2xl font-bold mb-4">About the Role</h2>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{job.description}</p>
            </section>
            
            <section>
              <h2 className="text-2xl font-bold mb-4">Requirements</h2>
              <ul className="space-y-3">
                {job.requirements.map((req: string, i: number) => (
                  <li key={i} className="flex items-start gap-3 text-muted-foreground">
                    <CheckCircle2 size={20} className="text-primary shrink-0 mt-0.5" />
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">Responsibilities</h2>
              <ul className="space-y-3">
                {job.responsibilities.map((resp: string, i: number) => (
                  <li key={i} className="flex items-start gap-3 text-muted-foreground">
                    <CheckCircle2 size={20} className="text-primary shrink-0 mt-0.5" />
                    <span>{resp}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          {/* Application Form */}
          <div className="lg:col-span-1">
            <div className="card sticky top-24">
              <h3 className="text-xl font-bold mb-6">Apply Now</h3>
              
              {result ? (
                <div className="text-center py-6">
                  <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8 text-success" />
                  </div>
                  <h4 className="font-bold text-lg mb-2">Application Sent!</h4>
                  <p className="text-sm text-muted-foreground mb-6">We've received your application and will be in touch soon.</p>
                  
                  {result.matchScore && (
                    <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 mb-6 text-left">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles size={16} className="text-primary" />
                        <span className="font-semibold text-sm">AI Match Score</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2 mb-1">
                        <div className="bg-primary h-2 rounded-full" style={{ width: `${result.matchScore}%` }} />
                      </div>
                      <p className="text-xs text-muted-foreground text-right">{result.matchScore}% match</p>
                    </div>
                  )}
                  
                  <Link to="/candidate/dashboard" className="btn btn-outline w-full">Go to Dashboard</Link>
                </div>
              ) : (
                <form onSubmit={handleApply} className="space-y-4">
                  {error && <div className="alert-error text-sm p-3">{error}</div>}
                  
                  {!user && (
                    <div className="alert-error text-sm p-3 mb-4">
                      You must be logged in to apply. <Link to="/login" className="underline font-semibold">Log in here</Link>.
                    </div>
                  )}

                  <div>
                    <label className="label">Resume (Text Format)</label>
                    <textarea 
                      className="input h-32 resize-none text-sm font-mono"
                      placeholder="Paste your resume here..."
                      value={resumeText}
                      onChange={e => setResumeText(e.target.value)}
                      required
                      disabled={!user || applying}
                    />
                    <p className="text-xs text-muted-foreground mt-1">Our AI will parse and match this against the job requirements.</p>
                  </div>

                  <div>
                    <label className="label">Cover Letter (Optional)</label>
                    <textarea 
                      className="input h-24 resize-none text-sm"
                      placeholder="Why are you a good fit?"
                      value={coverLetter}
                      onChange={e => setCoverLetter(e.target.value)}
                      disabled={!user || applying}
                    />
                  </div>

                  <button 
                    type="submit" 
                    className="btn btn-primary w-full"
                    disabled={!user || applying || !resumeText.trim()}
                  >
                    {applying ? 'Submitting...' : 'Submit Application'}
                  </button>
                </form>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default JobDetailPage;

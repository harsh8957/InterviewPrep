import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, MapPin, Clock } from 'lucide-react';
import PageHero from '../components/ui/PageHero';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';

const CareersPage = () => {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const API_URL = import.meta.env.VITE_API_URL || '';

  useEffect(() => {
    fetch(`${API_URL}/api/jobs`)
      .then(res => res.json())
      .then(data => {
        setJobs(data);
        setLoading(false);
      });
  }, [API_URL]);

  return (
    <div className="min-h-screen bg-background">
      <PageHero 
        title="Join Our Team" 
        description="Help us build the future of interview preparation and career growth."
        badge="Careers"
      />

      <div className="container-content py-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-8 flex items-center gap-2">
            <Briefcase className="text-primary" /> Open Positions
          </h2>

          {loading ? (
            <LoadingSkeleton />
          ) : jobs.length === 0 ? (
            <div className="card text-center py-16">
              <h3 className="text-xl font-medium mb-2">No open positions</h3>
              <p className="text-muted-foreground">Check back later or follow us on social media for updates.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {jobs.map(job => (
                <Link key={job._id} to={`/careers/${job._id}`} className="block">
                  <div className="card card-hover flex flex-col md:flex-row md:items-center justify-between gap-6 p-6">
                    <div>
                      <h3 className="text-xl font-bold mb-2">{job.title}</h3>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1"><MapPin size={16} /> {job.location}</span>
                        <span className="flex items-center gap-1"><Clock size={16} /> {job.type}</span>
                        <span className="badge badge-primary bg-primary/5 text-primary">{job.department}</span>
                      </div>
                    </div>
                    <div>
                      <span className="btn btn-primary">Apply Now</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CareersPage;

import { useState, useEffect } from 'react';
import { Users, Target, Building } from 'lucide-react';
import PageHero from '../components/ui/PageHero';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';

const AboutPage = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const API_URL = import.meta.env.VITE_API_URL || '';

  useEffect(() => {
    fetch(`${API_URL}/api/company`)
      .then(res => res.json())
      .then(resData => {
        setData(resData);
        setLoading(false);
      });
  }, [API_URL]);

  if (loading) return <LoadingSkeleton />;
  if (!data?.info) return <div className="text-center py-20">Company info not found.</div>;

  return (
    <div className="min-h-screen bg-background">
      <PageHero 
        title="About InterviewPrep" 
        description="We are on a mission to democratize interview preparation."
        badge="Company"
      />

      <div className="container-content py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-20">
          <div className="card">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
              <Target className="text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-4">Our Mission</h2>
            <p className="text-muted-foreground text-lg leading-relaxed">
              {data.info.mission}
            </p>
          </div>
          <div className="card">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
              <Building className="text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-4">Our Vision</h2>
            <p className="text-muted-foreground text-lg leading-relaxed">
              {data.info.vision}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-20">
          {data.info.stats?.map((stat: any, i: number) => (
            <div key={i} className="card text-center py-8">
              <div className="text-3xl md:text-4xl font-bold text-gradient mb-2">{stat.value}</div>
              <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Team */}
        <div>
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 flex items-center justify-center gap-2">
              <Users className="text-primary" /> Meet the Team
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              The passionate individuals behind InterviewPrep.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {data.team?.map((member: any) => (
              <div key={member._id} className="card text-center">
                <div className="w-24 h-24 mx-auto rounded-full bg-gradient-brand mb-4 flex items-center justify-center text-3xl font-bold text-white shadow-lg">
                  {member.name.charAt(0)}
                </div>
                <h3 className="text-xl font-bold mb-1">{member.name}</h3>
                <p className="text-primary font-medium text-sm mb-4">{member.role}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {member.bio}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;

import { useState, useEffect } from 'react';
import PageHero from '../components/ui/PageHero';
import RichTextRenderer from '../components/ui/RichTextRenderer';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';

const PrivacyPolicyPage = () => {
  const [policy, setPolicy] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const API_URL = import.meta.env.VITE_API_URL || '';

  useEffect(() => {
    fetch(`${API_URL}/api/policy/privacy`)
      .then(res => res.json())
      .then(data => {
        setPolicy(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [API_URL]);

  return (
    <div className="min-h-screen bg-background">
      <PageHero 
        title="Privacy Policy" 
        description="How we collect, use, and protect your data."
        badge="Legal"
      />

      <div className="container-content py-16 max-w-3xl">
        {loading ? (
          <LoadingSkeleton />
        ) : policy ? (
          <div className="card">
            <p className="text-sm text-muted-foreground mb-8 pb-4 border-b border-border">
              Last updated: {new Date(policy.createdAt).toLocaleDateString()} | Version {policy.version}
            </p>
            <RichTextRenderer content={policy.content} />
          </div>
        ) : (
          <div className="text-center py-20">Privacy policy not available.</div>
        )}
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;

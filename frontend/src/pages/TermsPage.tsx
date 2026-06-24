import { useState, useEffect } from 'react';
import PageHero from '../components/ui/PageHero';
import RichTextRenderer from '../components/ui/RichTextRenderer';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';

const TermsPage = () => {
  const [terms, setTerms] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const API_URL = import.meta.env.VITE_API_URL || '';

  useEffect(() => {
    fetch(`${API_URL}/api/policy/terms`)
      .then(res => res.json())
      .then(data => {
        setTerms(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [API_URL]);

  return (
    <div className="min-h-screen bg-background">
      <PageHero 
        title="Terms of Service" 
        description="The rules and guidelines for using our platform."
        badge="Legal"
      />

      <div className="container-content py-16 max-w-3xl">
        {loading ? (
          <LoadingSkeleton />
        ) : terms ? (
          <div className="card">
            <p className="text-sm text-muted-foreground mb-8 pb-4 border-b border-border">
              Last updated: {new Date(terms.createdAt).toLocaleDateString()} | Version {terms.version}
            </p>
            <RichTextRenderer content={terms.content} />
          </div>
        ) : (
          <div className="text-center py-20">Terms of service not available.</div>
        )}
      </div>
    </div>
  );
};

export default TermsPage;

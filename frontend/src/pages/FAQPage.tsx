import { useState, useEffect } from 'react';
import { Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import PageHero from '../components/ui/PageHero';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';

const FAQPage = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);

  const [question, setQuestion] = useState('');
  const [aiAnswer, setAiAnswer] = useState('');
  const [asking, setAsking] = useState(false);
  const API_URL = import.meta.env.VITE_API_URL || '';

  useEffect(() => {
    fetch(`${API_URL}/api/faq`)
      .then(res => res.json())
      .then(data => {
        setCategories(data);
        setLoading(false);
      });
  }, [API_URL]);

  const askAi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;
    setAsking(true);
    setAiAnswer('');
    try {
      const res = await fetch(`${API_URL}/api/faq/ask-ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question })
      });
      const data = await res.json();
      setAiAnswer(data.answer);
    } catch (err) {
      console.error(err);
    } finally {
      setAsking(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <PageHero 
        title="Frequently Asked Questions" 
        description="Find answers to common questions or ask our AI assistant for help."
        badge="Support"
      />

      <div className="container-content py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          <div className="lg:col-span-2 space-y-12">
            {loading ? (
              <LoadingSkeleton />
            ) : (
              categories.map(category => (
                <div key={category._id}>
                  <h2 className="text-2xl font-bold mb-6">{category.name}</h2>
                  <div className="space-y-4">
                    {category.faqs?.map((faq: any) => {
                      const isOpen = openId === faq._id;
                      return (
                        <div key={faq._id} className="card p-0 overflow-hidden">
                          <button 
                            className="w-full flex items-center justify-between p-5 text-left font-semibold hover:bg-surface-elevated transition-colors"
                            onClick={() => setOpenId(isOpen ? null : faq._id)}
                          >
                            <span>{faq.question}</span>
                            {isOpen ? <ChevronUp size={20} className="text-muted-foreground" /> : <ChevronDown size={20} className="text-muted-foreground" />}
                          </button>
                          {isOpen && (
                            <div className="p-5 pt-0 text-muted-foreground border-t border-border bg-surface/50">
                              <p className="mt-4">{faq.answer}</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="lg:col-span-1">
            <div className="card card-gradient sticky top-24">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="text-primary" size={24} />
                <h3 className="text-xl font-bold">AI Support Assistant</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-6">
                Can't find what you're looking for? Ask our AI assistant.
              </p>
              
              <form onSubmit={askAi} className="space-y-4">
                <textarea 
                  className="input h-24 resize-none" 
                  placeholder="Type your question here..."
                  value={question}
                  onChange={e => setQuestion(e.target.value)}
                  required
                />
                <button type="submit" className="btn btn-primary w-full" disabled={asking}>
                  {asking ? 'Searching...' : 'Ask AI'}
                </button>
              </form>

              {aiAnswer && (
                <div className="mt-6 p-4 rounded-xl bg-surface border border-border animate-fade-in text-sm text-foreground whitespace-pre-wrap">
                  {aiAnswer}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default FAQPage;

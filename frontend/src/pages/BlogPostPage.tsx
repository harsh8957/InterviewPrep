import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Sparkles, ArrowLeft } from 'lucide-react';
import RichTextRenderer from '../components/ui/RichTextRenderer';
import { formatDate } from '../lib/utils';

const BlogPostPage = () => {
  const { slug } = useParams();
  const [blog, setBlog] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [aiSummary, setAiSummary] = useState('');
  const [summarizing, setSummarizing] = useState(false);
  const API_URL = import.meta.env.VITE_API_URL || '';

  useEffect(() => {
    fetch(`${API_URL}/api/blog/${slug}`)
      .then(res => {
        if (!res.ok) throw new Error('Not found');
        return res.json();
      })
      .then(data => {
        setBlog(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [slug, API_URL]);

  const generateSummary = async () => {
    if (!blog) return;
    setSummarizing(true);
    try {
      const res = await fetch(`${API_URL}/api/blog/${blog._id}/summarize`, { method: 'POST' });
      const data = await res.json();
      setAiSummary(data.summary);
    } catch (err) {
      console.error(err);
    } finally {
      setSummarizing(false);
    }
  };

  if (loading) return <div className="container-content py-20 text-center">Loading...</div>;
  if (!blog) return <div className="container-content py-20 text-center">Blog post not found.</div>;

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-surface border-b border-border py-12">
        <div className="max-w-3xl mx-auto px-4">
          <Link to="/blog" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-8 transition-colors">
            <ArrowLeft size={16} className="mr-2" /> Back to Blog
          </Link>
          <div className="flex items-center gap-3 mb-6">
            <span className="badge badge-primary">{blog.category?.name}</span>
            <span className="text-sm text-muted-foreground">{formatDate(new Date(blog.publishedAt))}</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">{blog.title}</h1>
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary">
                {blog.author?.firstName?.charAt(0)}{blog.author?.lastName?.charAt(0)}
             </div>
             <div>
               <p className="font-medium">{blog.author?.firstName} {blog.author?.lastName}</p>
             </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-12">
        {/* AI Summary Tool */}
        <div className="mb-12 p-6 rounded-2xl bg-primary/5 border border-primary/20">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-semibold flex items-center gap-2 mb-2">
                <Sparkles size={18} className="text-primary" /> AI TL;DR
              </h3>
              {aiSummary ? (
                <div className="text-sm text-muted-foreground whitespace-pre-wrap">{aiSummary}</div>
              ) : (
                <p className="text-sm text-muted-foreground">Too long to read? Let AI summarize the key points for you.</p>
              )}
            </div>
            {!aiSummary && (
              <button onClick={generateSummary} disabled={summarizing} className="btn btn-outline btn-sm shrink-0">
                {summarizing ? 'Summarizing...' : 'Summarize'}
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <RichTextRenderer content={blog.content} />
      </div>
    </div>
  );
};

export default BlogPostPage;

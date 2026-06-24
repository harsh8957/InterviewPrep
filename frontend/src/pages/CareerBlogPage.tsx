import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import PageHero from '../components/ui/PageHero';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';
import { formatDate } from '../lib/utils';

const CareerBlogPage = () => {
  const [blogs, setBlogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const API_URL = import.meta.env.VITE_API_URL || '';

  useEffect(() => {
    fetch(`${API_URL}/api/blog`)
      .then(res => res.json())
      .then(data => {
        setBlogs(data.blogs || []);
        setLoading(false);
      });
  }, [API_URL]);

  return (
    <div className="min-h-screen bg-background">
      <PageHero 
        title="Career Insights Blog" 
        description="Expert advice, interview strategies, and career growth tips."
        badge="Blog"
      />

      <div className="container-content py-12">
        {loading ? (
          <LoadingSkeleton />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogs.map(blog => (
              <Link key={blog._id} to={`/blog/${blog.slug}`} className="group flex flex-col">
                <div className="card p-0 overflow-hidden flex-grow flex flex-col transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-glow-primary">
                  <div className="aspect-video bg-muted relative">
                    {blog.coverImage ? (
                      <img src={blog.coverImage} alt={blog.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-brand opacity-10" />
                    )}
                  </div>
                  <div className="p-6 flex flex-col flex-grow">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs font-semibold text-primary">{blog.category?.name}</span>
                      <span className="text-xs text-muted-foreground">• {formatDate(new Date(blog.publishedAt))}</span>
                    </div>
                    <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors line-clamp-2">
                      {blog.title}
                    </h3>
                    <p className="text-muted-foreground text-sm line-clamp-3 mb-4 flex-grow">
                      {blog.summary}
                    </p>
                    <div className="flex items-center gap-2 mt-auto">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                        {blog.author?.firstName?.charAt(0)}{blog.author?.lastName?.charAt(0)}
                      </div>
                      <span className="text-sm font-medium">{blog.author?.firstName} {blog.author?.lastName}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CareerBlogPage;

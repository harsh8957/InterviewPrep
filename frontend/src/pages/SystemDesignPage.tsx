import React from 'react';
import { Boxes, Sparkles, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';

const ARCHITECTURES = [
  {
    title: 'Distributed Rate Limiter',
    scale: '100K QPS',
    patterns: ['Token Bucket Algorithm', 'Redis Sliding Window Logs', 'Race Condition Handling'],
    difficulty: 'Medium'
  },
  {
    title: 'URL Shortener (TinyURL)',
    scale: '500M URLs',
    patterns: ['Base62 Encoding', 'Distributed Unique ID Generator (Snowflake)', 'Multi-Region Caching'],
    difficulty: 'Easy-Medium'
  },
  {
    title: 'Real-time Chat & Notification Engine',
    scale: '10M Concurrent WebSockets',
    patterns: ['WebSocket Connection Clusters', 'Pub/Sub Message Bus (Kafka)', 'Message Ordering & Presence'],
    difficulty: 'Hard'
  },
  {
    title: 'E-Commerce Distributed Cart & Checkout',
    scale: 'Peak Flash Sale Traffic',
    patterns: ['Idempotency Keys', 'Distributed Saga Pattern', 'Optimistic Locking'],
    difficulty: 'Hard'
  }
];

export const SystemDesignPage: React.FC = () => {
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/15 text-primary border border-primary/20">
              <Boxes size={12} />
              Phase 5 System Architecture
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            System Design & Distributed Scalability
          </h1>
          <p className="text-muted-foreground mt-1">
            Master high-level and low-level system design patterns asked in senior full-stack and backend interviews.
          </p>
        </div>

        <Link to="/setup" className="btn btn-primary btn-sm flex items-center gap-1.5 self-start sm:self-auto shrink-0">
          <Sparkles size={15} />
          <span>Practice Design Interview</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {ARCHITECTURES.map(arch => (
          <div key={arch.title} className="card p-6 flex flex-col justify-between hover:border-primary/40 transition-colors">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-primary">{arch.scale}</span>
                <span className={cn(
                  "px-2 py-0.5 rounded text-xs font-semibold",
                  arch.difficulty === 'Easy-Medium' ? "text-success bg-success/10" :
                  arch.difficulty === 'Medium' ? "text-warning bg-warning/10" :
                  "text-destructive bg-destructive/10"
                )}>
                  {arch.difficulty}
                </span>
              </div>
              <h3 className="text-lg font-bold text-foreground mb-3">{arch.title}</h3>

              <div className="space-y-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Architecture Pillars</span>
                {arch.patterns.map(p => (
                  <div key={p} className="flex items-center gap-2 text-xs text-foreground/90 p-2 rounded-lg bg-muted/30">
                    <CheckCircle2 size={13} className="text-primary shrink-0" />
                    <span>{p}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
              <span>Interactive whiteboard walkthroughs arrive in Phase 5.</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SystemDesignPage;

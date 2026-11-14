import React from 'react';
import { FileCode2, Clock, Sparkles, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const ASSESSMENTS = [
  {
    title: 'Frontend Engineer Online Assessment',
    duration: '60 mins',
    questions: 3,
    difficulty: 'Medium',
    skills: ['JavaScript / TypeScript', 'DOM & Events', 'Async Programming'],
    status: 'Ready'
  },
  {
    title: 'Full Stack Backend & API Assessment',
    duration: '75 mins',
    questions: 4,
    difficulty: 'Medium-Hard',
    skills: ['RESTful API Design', 'Database Queries', 'Concurrency'],
    status: 'Ready'
  },
  {
    title: 'Data Structures & Algorithms Diagnostic',
    duration: '90 mins',
    questions: 3,
    difficulty: 'Hard',
    skills: ['Trees & Graphs', 'Dynamic Programming', 'Complexity Analysis'],
    status: 'Ready'
  }
];

export const AssessmentsPage: React.FC = () => {
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-accent/15 text-accent border border-accent/20">
              <FileCode2 size={12} />
              Phase 4 Assessments
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Timed Coding Assessments
          </h1>
          <p className="text-muted-foreground mt-1">
            Simulated screening tests that mirror HackerRank, CodeSignal, and Karat environments.
          </p>
        </div>

        <Link to="/setup" className="btn btn-primary btn-sm flex items-center gap-1.5 self-start sm:self-auto shrink-0">
          <Sparkles size={15} />
          <span>Launch AI Mock Round</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {ASSESSMENTS.map(item => (
          <div key={item.title} className="card p-6 flex flex-col justify-between hover:border-primary/40 transition-colors">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-primary">{item.difficulty}</span>
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock size={12} /> {item.duration}
                </span>
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">{item.title}</h3>
              <p className="text-xs text-muted-foreground mb-4">{item.questions} algorithmic challenges + unit test execution</p>

              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Assessed Skills</span>
                <div className="flex flex-wrap gap-1">
                  {item.skills.map(s => (
                    <span key={s} className="px-2 py-0.5 rounded bg-muted text-[11px] text-foreground font-medium">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-border">
              <div className="p-3 rounded-xl bg-accent/10 border border-accent/20 text-xs text-foreground/80 flex items-center gap-2">
                <AlertCircle size={14} className="text-accent shrink-0" />
                <span>Isolated code sandbox execution engine connects in Phase 4.</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AssessmentsPage;

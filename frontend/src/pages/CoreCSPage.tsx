import React, { useState } from 'react';
import { Cpu, Database, Network, Boxes, CheckCircle2, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';

const CS_DOMAINS = [
  {
    id: 'os',
    title: 'Operating Systems & Concurrency',
    icon: Cpu,
    color: 'text-primary',
    bg: 'bg-primary/10',
    topics: ['Process vs Thread Lifecycle', 'Virtual Memory & Paging', 'CPU Scheduling Algorithms', 'Deadlock Detection & Prevention', 'POSIX Signals & Inter-Process Communication']
  },
  {
    id: 'dbms',
    title: 'Database Management Systems',
    icon: Database,
    color: 'text-secondary',
    bg: 'bg-secondary/10',
    topics: ['ACID Properties & Isolation Levels', 'B-Trees & Indexing Mechanics', 'SQL vs NoSQL Architectural Trade-offs', 'Database Normalization (1NF through BCNF)', 'Sharding & Replication Topologies']
  },
  {
    id: 'cn',
    title: 'Computer Networks & Protocols',
    icon: Network,
    color: 'text-accent',
    bg: 'bg-accent/10',
    topics: ['OSI Model vs TCP/IP Protocol Stack', 'TCP 3-Way Handshake & Congestion Control', 'HTTPS / TLS 1.3 Cryptographic Handshake', 'DNS Resolution & Anycast Routing', 'WebSockets vs HTTP/2 vs HTTP/3']
  },
  {
    id: 'oop',
    title: 'Object-Oriented Design & Principles',
    icon: Boxes,
    color: 'text-success',
    bg: 'bg-success/10',
    topics: ['SOLID Design Principles', 'Design Patterns (Factory, Singleton, Strategy, Observer)', 'Encapsulation, Inheritance & Polymorphism', 'Composition Over Inheritance', 'UML Class Modeling & Interface Design']
  }
];

export const CoreCSPage: React.FC = () => {
  const [selectedDomain, setSelectedDomain] = useState(CS_DOMAINS[0]);

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/15 text-primary border border-primary/20">
              <Cpu size={12} />
              Phase 5 Core CS Modules
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Core Computer Science Fundamentals
          </h1>
          <p className="text-muted-foreground mt-1">
            Essential theoretical and architectural concepts asked in campus placements and senior technical rounds.
          </p>
        </div>

        <Link to="/setup" className="btn btn-primary btn-sm flex items-center gap-1.5 self-start sm:self-auto shrink-0">
          <Sparkles size={15} />
          <span>Practice Technical Questions</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {CS_DOMAINS.map(domain => {
          const Icon = domain.icon;
          const isSelected = selectedDomain.id === domain.id;
          return (
            <div
              key={domain.id}
              onClick={() => setSelectedDomain(domain)}
              className={cn(
                "card p-5 cursor-pointer transition-all border",
                isSelected
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-border hover:border-muted-foreground/30 hover:bg-muted/30"
              )}
            >
              <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl mb-3", domain.bg, domain.color)}>
                <Icon size={20} />
              </div>
              <h3 className={cn("text-base font-semibold leading-tight", isSelected ? "text-primary" : "text-foreground")}>
                {domain.title}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">{domain.topics.length} Essential Subject Patterns</p>
            </div>
          );
        })}
      </div>

      <div className="card p-6 md:p-8 space-y-4">
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <div>
            <span className="text-xs font-semibold text-primary uppercase tracking-wider">Curriculum Outline</span>
            <h2 className="text-xl font-bold text-foreground mt-0.5">{selectedDomain.title}</h2>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          {selectedDomain.topics.map((t, i) => (
            <div key={i} className="flex items-start gap-3 p-3.5 rounded-xl bg-muted/40 border border-border/80">
              <CheckCircle2 size={16} className="text-primary shrink-0 mt-0.5" />
              <span className="text-sm font-medium text-foreground">{t}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CoreCSPage;

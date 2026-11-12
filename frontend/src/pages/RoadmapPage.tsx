import React, { useState } from 'react';
import { Map, Code2, Circle, ArrowRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';

interface RoadmapNode {
  id: string;
  title: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  topics: string[];
  estimatedDays: number;
}

const ROADMAP_MODULES: RoadmapNode[] = [
  {
    id: 'arrays',
    title: '1. Arrays & Hashing',
    difficulty: 'Beginner',
    topics: ['Two Sum', 'Valid Anagram', 'Contains Duplicate', 'Group Anagrams', 'Top K Frequent Elements'],
    estimatedDays: 4
  },
  {
    id: 'pointers',
    title: '2. Two Pointers & Sliding Window',
    difficulty: 'Beginner',
    topics: ['Valid Palindrome', 'Two Sum II', '3Sum', 'Container With Most Water', 'Best Time to Buy/Sell Stock'],
    estimatedDays: 5
  },
  {
    id: 'stack',
    title: '3. Stack & Queue Mechanics',
    difficulty: 'Intermediate',
    topics: ['Valid Parentheses', 'Min Stack', 'Daily Temperatures', 'Evaluate Reverse Polish Notation'],
    estimatedDays: 4
  },
  {
    id: 'binary-search',
    title: '4. Binary Search & Divide and Conquer',
    difficulty: 'Intermediate',
    topics: ['Binary Search', 'Search a 2D Matrix', 'Koko Eating Bananas', 'Find Minimum in Rotated Sorted Array'],
    estimatedDays: 6
  },
  {
    id: 'linked-lists',
    title: '5. Linked Lists & Fast/Slow Pointers',
    difficulty: 'Intermediate',
    topics: ['Reverse Linked List', 'Merge Two Sorted Lists', 'Reorder List', 'Linked List Cycle Detection'],
    estimatedDays: 5
  },
  {
    id: 'trees',
    title: '6. Binary Trees & BST',
    difficulty: 'Intermediate',
    topics: ['Invert Binary Tree', 'Maximum Depth', 'Lowest Common Ancestor', 'Binary Tree Level Order Traversal'],
    estimatedDays: 7
  },
  {
    id: 'graphs',
    title: '7. Graphs, BFS & DFS',
    difficulty: 'Advanced',
    topics: ['Number of Islands', 'Clone Graph', 'Course Schedule (Topological Sort)', 'Word Ladder'],
    estimatedDays: 8
  },
  {
    id: 'dp',
    title: '8. Dynamic Programming (1D & 2D)',
    difficulty: 'Advanced',
    topics: ['Climbing Stairs', 'House Robber', 'Coin Change', 'Longest Increasing Subsequence', 'Edit Distance'],
    estimatedDays: 10
  }
];

export const RoadmapPage: React.FC = () => {
  const [selectedModule, setSelectedModule] = useState<RoadmapNode>(ROADMAP_MODULES[0]);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-secondary/15 text-secondary border border-secondary/20">
              <Map size={12} />
              Phase 3 Roadmap Foundation
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Structured DSA Learning Roadmap
          </h1>
          <p className="text-muted-foreground mt-1 max-w-2xl">
            A comprehensive, dependency-ordered algorithmic path inspired by NeetCode 150 & Blind 75.
          </p>
        </div>

        <Link to="/setup" className="btn btn-primary btn-sm flex items-center gap-1.5 self-start sm:self-auto shrink-0">
          <Sparkles size={15} />
          <span>Practice With AI</span>
        </Link>
      </div>

      {/* Roadmap Navigation Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Module Steps Column */}
        <div className="lg:col-span-2 space-y-3">
          {ROADMAP_MODULES.map((mod, index) => {
            const isSelected = selectedModule.id === mod.id;
            return (
              <div
                key={mod.id}
                onClick={() => setSelectedModule(mod)}
                className={cn(
                  "p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-4",
                  isSelected
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border bg-card/60 hover:bg-muted/40 hover:border-muted-foreground/30"
                )}
              >
                <div className="flex items-center gap-3.5">
                  <div className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-bold text-sm",
                    isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  )}>
                    {index + 1}
                  </div>
                  <div>
                    <h3 className={cn("text-base font-semibold leading-tight", isSelected ? "text-primary" : "text-foreground")}>
                      {mod.title.replace(/^\d+\.\s*/, '')}
                    </h3>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <span className={cn(
                        "px-1.5 py-0.2 rounded font-medium",
                        mod.difficulty === 'Beginner' ? "text-success bg-success/10" :
                        mod.difficulty === 'Intermediate' ? "text-warning bg-warning/10" :
                        "text-destructive bg-destructive/10"
                      )}>
                        {mod.difficulty}
                      </span>
                      <span>·</span>
                      <span>{mod.topics.length} Key Patterns</span>
                      <span>·</span>
                      <span>~{mod.estimatedDays} days</span>
                    </div>
                  </div>
                </div>

                <div className="shrink-0 flex items-center text-muted-foreground">
                  <ArrowRight size={16} className={cn(isSelected && "text-primary translate-x-1 transition-transform")} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Module Detail Pane */}
        <div className="card p-6 space-y-5 sticky top-20 border-primary/20">
          <div className="flex items-start justify-between gap-2 pb-4 border-b border-border">
            <div>
              <span className="text-xs font-semibold text-primary uppercase tracking-wider">Module Details</span>
              <h2 className="text-xl font-bold text-foreground mt-0.5">{selectedModule.title}</h2>
            </div>
            <span className={cn(
              "px-2 py-0.5 rounded text-xs font-semibold shrink-0",
              selectedModule.difficulty === 'Beginner' ? "text-success bg-success/10" :
              selectedModule.difficulty === 'Intermediate' ? "text-warning bg-warning/10" :
              "text-destructive bg-destructive/10"
            )}>
              {selectedModule.difficulty}
            </span>
          </div>

          <div className="space-y-3">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Pattern Checklist & Core Problems
            </span>
            <ul className="space-y-2.5">
              {selectedModule.topics.map((t, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-foreground/90 p-2 rounded-xl bg-muted/30">
                  <Circle size={15} className="text-muted-foreground shrink-0 mt-0.5" />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="pt-2">
            <div className="p-3.5 rounded-xl bg-secondary/10 border border-secondary/20 text-xs text-secondary-foreground space-y-1">
              <p className="font-semibold flex items-center gap-1.5">
                <Code2 size={14} /> Interactive Code Runner Coming in Phase 3
              </p>
              <p className="text-muted-foreground">
                Phase 3 will integrate live Monaco Editor execution, test cases, and difficulty filtering for each pattern.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoadmapPage;

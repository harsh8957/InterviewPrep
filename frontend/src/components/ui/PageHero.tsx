import React from 'react';

interface PageHeroProps {
  title: string;
  description: string;
  align?: 'left' | 'center';
  badge?: string;
}

const PageHero: React.FC<PageHeroProps> = ({ title, description, align = 'center', badge }) => {
  return (
    <div className={`relative overflow-hidden border-b border-border bg-background py-16 md:py-20 ${align === 'center' ? 'text-center' : 'text-left'}`}>
      <div className="absolute inset-0 bg-gradient-hero opacity-10 pointer-events-none" />
      <div className="container-content relative z-10">
        {badge && (
          <span className={`inline-block mb-4 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary ${align === 'center' ? 'mx-auto' : ''}`}>
            {badge}
          </span>
        )}
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 text-gradient">
          {title}
        </h1>
        <p className={`text-lg md:text-xl text-muted-foreground max-w-2xl ${align === 'center' ? 'mx-auto' : ''}`}>
          {description}
        </p>
      </div>
    </div>
  );
};

export default PageHero;

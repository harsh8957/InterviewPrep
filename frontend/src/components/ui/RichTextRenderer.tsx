import React from 'react';

interface RichTextRendererProps {
  content: string;
  className?: string;
}

const RichTextRenderer: React.FC<RichTextRendererProps> = ({ content, className = '' }) => {
  return (
    <div 
      className={`prose prose-slate dark:prose-invert max-w-none ${className}`}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
};

export default RichTextRenderer;

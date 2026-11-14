import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { AlertCircle } from 'lucide-react';

interface MermaidViewerProps {
  chart: string;
  className?: string;
  isDark?: boolean;
}

export const MermaidViewer: React.FC<MermaidViewerProps> = ({ chart, className, isDark = true }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgHtml, setSvgHtml] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: isDark ? 'dark' : 'default',
      securityLevel: 'loose',
      fontFamily: 'ui-sans-serif, system-ui, sans-serif',
    });
  }, [isDark]);

  useEffect(() => {
    let isMounted = true;
    const renderChart = async () => {
      if (!chart.trim()) {
        setSvgHtml('');
        setError(null);
        return;
      }

      try {
        const id = `mermaid-render-${Math.random().toString(36).substring(2, 9)}`;
        const { svg } = await mermaid.render(id, chart);
        if (isMounted) {
          setSvgHtml(svg);
          setError(null);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err?.message || 'Invalid Mermaid syntax');
          setSvgHtml('');
        }
      }
    };

    renderChart();

    return () => {
      isMounted = false;
    };
  }, [chart, isDark]);

  if (error) {
    return (
      <div className="p-4 rounded-xl border border-destructive/30 bg-destructive/5 text-destructive text-xs space-y-1">
        <div className="flex items-center gap-1.5 font-bold">
          <AlertCircle size={14} />
          <span>Mermaid Syntax Error</span>
        </div>
        <p className="font-mono text-[11px] leading-relaxed break-words">{error}</p>
      </div>
    );
  }

  if (!svgHtml) {
    return (
      <div className="h-48 flex items-center justify-center text-xs text-muted-foreground border border-dashed border-border rounded-xl">
        Enter valid Mermaid diagram syntax to render architecture topology...
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`overflow-x-auto p-4 flex justify-center items-center bg-card/60 rounded-xl border border-border ${className || ''}`}
      dangerouslySetInnerHTML={{ __html: svgHtml }}
    />
  );
};

export default MermaidViewer;

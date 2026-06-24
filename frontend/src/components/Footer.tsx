import { Link } from 'react-router-dom';
import { Github, Linkedin, Twitter, BrainCircuit } from 'lucide-react';

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-surface">
      <div className="container-content py-12">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="lg:col-span-1 space-y-4">
            <Link to="/" className="flex items-center gap-2.5 group w-fit">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-brand shadow-sm">
                <BrainCircuit size={18} className="text-white" />
              </div>
              <span className="text-lg font-bold text-gradient">InterviewPrep</span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              AI-powered mock interview platform. Practice with real industry questions
              and get personalized feedback to land your dream role.
            </p>
            <div className="flex gap-3 pt-1">
              <a
                href="#"
                aria-label="Twitter"
                className="btn btn-ghost btn-icon text-muted-foreground hover:text-foreground"
              >
                <Twitter size={18} />
              </a>
              <a
                href="#"
                aria-label="GitHub"
                className="btn btn-ghost btn-icon text-muted-foreground hover:text-foreground"
              >
                <Github size={18} />
              </a>
              <a
                href="#"
                aria-label="LinkedIn"
                className="btn btn-ghost btn-icon text-muted-foreground hover:text-foreground"
              >
                <Linkedin size={18} />
              </a>
            </div>
          </div>

          {/* Product */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-foreground">Product</h4>
            <ul className="space-y-3">
              {[
                { label: 'Practice Interview', to: '/setup' },
                { label: 'My Dashboard', to: '/candidate/dashboard' },
                { label: 'Results', to: '/results' },
              ].map(item => (
                <li key={item.label}>
                  <Link
                    to={item.to}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-foreground">Resources</h4>
            <ul className="space-y-3">
              {[
                { label: 'Interview Tips', to: '/interview-tips' },
                { label: 'Resume Guide', to: '/resume-guide' },
                { label: 'Career Blog', to: '/blog' },
                { label: 'FAQ', to: '/faq' },
              ].map(item => (
                <li key={item.label}>
                  <Link
                    to={item.to}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-foreground">Company</h4>
            <ul className="space-y-3">
              {[
                { label: 'About Us', to: '/about' },
                { label: 'Careers', to: '/careers' },
                { label: 'Contact', to: '/contact' },
                { label: 'Privacy Policy', to: '/privacy-policy' },
                { label: 'Terms of Service', to: '/terms-of-service' },
              ].map(item => (
                <li key={item.label}>
                  <Link
                    to={item.to}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            &copy; {year} InterviewPrep. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground">
            Built with ❤️ to help you ace your next interview.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

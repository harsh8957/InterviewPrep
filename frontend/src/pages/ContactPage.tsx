import React, { useState } from 'react';
import { Mail, MapPin, Phone, CheckCircle2 } from 'lucide-react';
import PageHero from '../components/ui/PageHero';

const ContactPage = () => {
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const API_URL = import.meta.env.VITE_API_URL || '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    
    try {
      const res = await fetch(`${API_URL}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (!res.ok) throw new Error('Failed to send message');
      
      setSuccess(true);
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <PageHero 
        title="Get in Touch" 
        description="Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible."
        badge="Contact"
      />

      <div className="container-content py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          
          {/* Contact Info */}
          <div>
            <h2 className="text-3xl font-bold mb-6">Let's Talk</h2>
            <p className="text-muted-foreground mb-12 text-lg">
              Whether you're a candidate looking for support, or a company interested in enterprise plans, our team is ready to help.
            </p>

            <div className="space-y-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Mail className="text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-1">Email Us</h3>
                  <p className="text-muted-foreground mb-1">For general inquiries and support.</p>
                  <a href="mailto:hello@interviewprep.com" className="text-primary font-medium hover:underline">hello@interviewprep.com</a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <MapPin className="text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-1">Office</h3>
                  <p className="text-muted-foreground mb-1">Come say hello at our HQ.</p>
                  <p className="text-foreground font-medium">123 Tech Boulevard, San Francisco, CA 94105</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Phone className="text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-1">Phone</h3>
                  <p className="text-muted-foreground mb-1">Mon-Fri from 8am to 5pm PST.</p>
                  <p className="text-foreground font-medium">+1 (555) 000-0000</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="card">
            <h3 className="text-2xl font-bold mb-6">Send a Message</h3>
            
            {success ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-success" />
                </div>
                <h4 className="font-bold text-xl mb-2">Message Sent!</h4>
                <p className="text-muted-foreground mb-6">We've received your message and our AI has routed it to the correct department. We'll be in touch shortly.</p>
                <button onClick={() => setSuccess(false)} className="btn btn-outline">Send Another</button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && <div className="alert-error text-sm p-3">{error}</div>}
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Name</label>
                    <input 
                      type="text" 
                      className="input" 
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <label className="label">Email</label>
                    <input 
                      type="email" 
                      className="input" 
                      value={formData.email}
                      onChange={e => setFormData({...formData, email: e.target.value})}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="label">Subject</label>
                  <input 
                    type="text" 
                    className="input" 
                    value={formData.subject}
                    onChange={e => setFormData({...formData, subject: e.target.value})}
                    required
                  />
                </div>

                <div>
                  <label className="label">Message</label>
                  <textarea 
                    className="input h-32 resize-none" 
                    value={formData.message}
                    onChange={e => setFormData({...formData, message: e.target.value})}
                    required
                  />
                </div>

                <button 
                  type="submit" 
                  className="btn btn-primary w-full"
                  disabled={submitting}
                >
                  {submitting ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default ContactPage;

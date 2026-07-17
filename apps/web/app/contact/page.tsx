'use client';

import { useState } from 'react';
import { Mail, Send, CheckCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { MarketingNav } from '@/components/marketing-nav';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    // Build mailto link
    const body = `Name: ${name}\nEmail: ${email}\n\n${message}`;
    const mailtoUrl = `mailto:bushninjadots@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    // Open email client
    window.location.href = mailtoUrl;

    // Show success after brief delay
    setTimeout(() => {
      setSent(true);
      setLoading(false);
    }, 500);
  }

  return (
    <div className="min-h-screen bg-theme-page">
      <MarketingNav />
      <section className="pt-24 pb-24">
        <div className="mx-auto max-w-xl px-6">
          {/* Back link */}
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-theme-muted hover:text-theme-main transition-colors mb-8"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to home
          </Link>

          <div className="text-center mb-10">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-theme-accent/10">
              <Mail className="h-6 w-6 text-theme-accent" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-theme-main sm:text-4xl">
              Contact Us
            </h1>
            <p className="mt-3 text-sm text-theme-subtle">
              Have a question, feedback, or need help? Send us an email and we&apos;ll get back to you.
            </p>
          </div>

          {sent ? (
            <div className="rounded-2xl border border-green-500/20 bg-green-500/5 p-8 text-center">
              <CheckCircle className="mx-auto h-10 w-10 text-green-400" />
              <h2 className="mt-4 text-lg font-semibold text-theme-main">Email opened</h2>
              <p className="mt-2 text-sm text-theme-subtle">
                Your email client should have opened with the message pre-filled.
                If it didn&apos;t, email us directly at{' '}
                <a href="mailto:bushninjadots@gmail.com" className="text-theme-accent hover:underline">
                  bushninjadots@gmail.com
                </a>
              </p>
              <button
                onClick={() => { setSent(false); setName(''); setEmail(''); setSubject(''); setMessage(''); }}
                className="mt-6 btn-secondary text-sm"
              >
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="name" className="text-sm font-medium text-theme-subtle">
                    Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl border border-theme-border bg-theme-card px-4 py-2.5 text-sm text-theme-main placeholder-theme-muted outline-none focus:border-theme-accent/50 focus:ring-1 focus:ring-theme-accent/50"
                    placeholder="Your name"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="email" className="text-sm font-medium text-theme-subtle">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-theme-border bg-theme-card px-4 py-2.5 text-sm text-theme-main placeholder-theme-muted outline-none focus:border-theme-accent/50 focus:ring-1 focus:ring-theme-accent/50"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="subject" className="text-sm font-medium text-theme-subtle">
                  Subject
                </label>
                <input
                  id="subject"
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full rounded-xl border border-theme-border bg-theme-card px-4 py-2.5 text-sm text-theme-main placeholder-theme-muted outline-none focus:border-theme-accent/50 focus:ring-1 focus:ring-theme-accent/50"
                  placeholder="What's this about?"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="message" className="text-sm font-medium text-theme-subtle">
                  Message
                </label>
                <textarea
                  id="message"
                  required
                  rows={6}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full rounded-xl border border-theme-border bg-theme-card px-4 py-3 text-sm text-theme-main placeholder-theme-muted outline-none focus:border-theme-accent/50 focus:ring-1 focus:ring-theme-accent/50 resize-none"
                  placeholder="Tell us what you need help with, or share your feedback..."
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary !py-3 text-sm flex items-center justify-center gap-2"
              >
                {loading ? (
                  'Opening email client...'
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Send Message
                  </>
                )}
              </button>

              <p className="text-center text-xs text-theme-muted">
                Or email us directly at{' '}
                <a href="mailto:bushninjadots@gmail.com" className="text-theme-accent hover:underline">
                  bushninjadots@gmail.com
                </a>
              </p>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}

import { Link } from 'react-router-dom';
import { ArrowRight, Search, Shield, Clock, CheckCircle2, Star, ChevronDown, X, FileText, Award, Zap, Globe as Globe2, Scale, Lock } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';

// ─── Data ────────────────────────────────────────────────────────────────────

const STEPS = [
  {
    num: '01',
    icon: Search,
    title: 'Search Your Trademark',
    desc: 'Run a free clearance search to check availability in the IMPI database before you file.',
  },
  {
    num: '02',
    icon: FileText,
    title: 'Complete Guided Application',
    desc: 'Our AI-assisted form walks you through every field. Takes under 10 minutes.',
  },
  {
    num: '03',
    icon: Award,
    title: 'Lawyers Review & File with IMPI',
    desc: 'Mexican IP attorneys review your application and file directly with the government.',
  },
];

const TESTIMONIALS = [
  {
    quote: "Filed our trademark for our Shopify brand in 15 minutes. The guided form made it painless and we had our filing confirmation the same day.",
    name: 'Carlos M.',
    role: 'Founder, DTC Brand',
    country: '🇲🇽',
    initials: 'CM',
  },
  {
    quote: "Much cheaper than hiring a local law firm and the team was responsive. The lawyer review gave us real peace of mind.",
    name: 'Priya S.',
    role: 'Head of Legal, SaaS startup',
    country: '🇮🇳',
    initials: 'PS',
  },
  {
    quote: "We needed to protect our brand across Latin America. Mexico was the first step and this made it incredibly easy.",
    name: 'Tom W.',
    role: 'CEO, E-commerce agency',
    country: '🇺🇸',
    initials: 'TW',
  },
];

const COMPARISON = [
  { label: 'Total cost', them: '$800–$2,000+', us: '$270 / class' },
  { label: 'Timeline to file', them: '2–4 weeks', us: 'Same day' },
  { label: 'Process', them: 'Email chains & PDFs', us: '100% online guided form' },
  { label: 'AI assistance', them: false, us: true },
  { label: 'Lawyer review', them: 'Billable by the hour', us: 'Included in price' },
  { label: 'Transparent pricing', them: false, us: true },
  { label: 'IMPI filing receipt', them: 'Varies', us: 'Provided automatically' },
];

const FAQS = [
  {
    q: 'Who can apply for a trademark in Mexico?',
    a: 'Any individual or company worldwide can register a trademark in Mexico, regardless of where you are located. You do not need to have a business presence in Mexico.',
  },
  {
    q: 'What is a Nice class and how many do I need?',
    a: 'Nice classes categorize products and services into 45 groups. You file per class — for example, Class 25 for clothing, Class 35 for retail services. Most brands need 1–3 classes.',
  },
  {
    q: 'How long does the trademark registration process take?',
    a: 'After filing, IMPI typically issues a registration certificate within 12–18 months. You receive a filing receipt within days of submission, which gives you provisional protection.',
  },
  {
    q: 'Is the $270 price the total cost, all included?',
    a: 'Yes. Our $270 all-inclusive price covers the government fee ($170) and our service fee ($100). There are no hidden charges. Additional classes are $270 each.',
  },
  {
    q: 'Do I need to be present or send physical documents?',
    a: 'No. The entire process is online. You upload any required files digitally and our lawyers handle everything with IMPI electronically.',
  },
  {
    q: 'What happens after I pay?',
    a: 'Our team reviews your application within 1 business day. Mexican IP attorneys check for conflicts and legal issues before submitting to IMPI. You receive email updates at every stage.',
  },
];

// ─── Sticky mobile CTA ───────────────────────────────────────────────────────

function StickyMobileCTA() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 500);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-40 md:hidden transition-transform duration-300 ${
        visible ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
      <div className="bg-white border-t border-gray-200 px-4 py-3 flex items-center gap-3 shadow-2xl">
        <Link
          to="/apply"
          className="flex-1 flex items-center justify-center gap-2 bg-gold-500 hover:bg-gold-600 text-white font-bold py-3.5 rounded-xl transition-colors text-sm"
        >
          Start Filing — $270 / class
          <ArrowRight size={15} />
        </Link>
      </div>
    </div>
  );
}

// ─── Product mockup card ─────────────────────────────────────────────────────

function MockupCard() {
  const ref = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${
        mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
      }`}
    >
      <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-5 shadow-2xl max-w-xs w-full">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-400/70" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/70" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-400/70" />
          </div>
          <span className="text-white/50 text-xs ml-1 font-mono">trademark-application.mtc</span>
        </div>

        {/* Step tracker */}
        <div className="flex items-center gap-1 mb-5">
          {['Info', 'Mark', 'Classes', 'Checkout'].map((label, i) => (
            <div key={i} className="flex items-center gap-1 flex-1">
              <div className={`flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold flex-shrink-0 ${
                i < 2 ? 'bg-gold-500 text-white' : i === 2 ? 'bg-white text-navy-900 ring-2 ring-gold-500' : 'bg-white/20 text-white/50'
              }`}>
                {i < 2 ? <CheckCircle2 size={10} /> : i + 1}
              </div>
              {i < 3 && <div className={`h-px flex-1 ${i < 2 ? 'bg-gold-500' : 'bg-white/20'}`} />}
            </div>
          ))}
        </div>

        {/* Form preview */}
        <div className="space-y-2.5 mb-4">
          <div className="bg-white/10 rounded-lg px-3 py-2">
            <div className="text-white/40 text-xs mb-0.5">Trademark Name</div>
            <div className="text-white text-sm font-medium">ACME Brand™</div>
          </div>
          <div className="bg-white/10 rounded-lg px-3 py-2">
            <div className="text-white/40 text-xs mb-0.5">Nice Class</div>
            <div className="text-white text-sm font-medium">Class 25 — Clothing</div>
          </div>
          <div className="flex gap-2">
            <div className="flex-1 bg-white/10 rounded-lg px-3 py-2">
              <div className="text-white/40 text-xs mb-0.5">Total</div>
              <div className="text-gold-300 text-sm font-bold">$270 USD</div>
            </div>
            <div className="flex-1 bg-emerald-500/20 border border-emerald-400/30 rounded-lg px-3 py-2 flex items-center justify-center gap-1">
              <CheckCircle2 size={12} className="text-emerald-400" />
              <span className="text-emerald-300 text-xs font-medium">Available</span>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gold-500 rounded-xl px-4 py-2.5 flex items-center justify-between">
          <span className="text-white text-xs font-bold">Pay & File Now</span>
          <Lock size={12} className="text-white/80" />
        </div>

        {/* Trust line */}
        <div className="flex items-center justify-center gap-1.5 mt-3">
          <Shield size={10} className="text-white/40" />
          <span className="text-white/40 text-xs">Reviewed by Mexican IP attorneys</span>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────

export default function HomePageV2() {
  const { t } = useLanguage();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [heroLoaded, setHeroLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setHeroLoaded(true), 50);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="bg-white">
      <StickyMobileCTA />

      {/* ─── HERO ──────────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col overflow-hidden">
        {/* Background photo */}
        <div className="absolute inset-0">
          <img
            src="/pexels-kampus-8190827.jpg"
            alt="Mexican landscape"
            className="w-full h-full object-cover object-center"
          />
          {/* Gradient overlay — dark at bottom, partially transparent at top */}
          <div className="absolute inset-0 bg-gradient-to-b from-navy-950/70 via-navy-950/55 to-navy-950/90" />
          {/* Subtle warm color cast to match the gold brand */}
          <div className="absolute inset-0 bg-gradient-to-tr from-gold-900/20 via-transparent to-transparent" />
        </div>

        {/* Content */}
        <div className="relative flex-1 flex items-center">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32 w-full">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              {/* Left: copy */}
              <div
                className={`transition-all duration-700 delay-100 ${
                  heroLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                }`}
              >
                {/* Eyebrow */}
                <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 mb-8">
                  <span className="text-base leading-none">🇲🇽</span>
                  <span className="text-white/90 text-xs font-semibold tracking-wide">Mexico's Online Trademark Service</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                </div>

                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-[1.08] tracking-tight mb-6">
                  Register Your<br />
                  <span className="text-gold-400">Trademark</span><br />
                  in Mexico
                </h1>

                <p className="text-lg text-white/70 leading-relaxed mb-10 max-w-lg">
                  AI-assisted filing and legal review by Mexican IP experts. Protect your brand in minutes — not months.
                </p>

                {/* CTAs */}
                <div className="flex flex-col sm:flex-row gap-3 mb-10">
                  <Link
                    to="/trademark-check"
                    className="group inline-flex items-center justify-center gap-2.5 bg-gold-500 hover:bg-gold-400 text-white font-bold px-7 py-4 rounded-xl transition-all duration-200 shadow-lg hover:shadow-gold-500/30 hover:-translate-y-0.5 text-base"
                  >
                    <Search size={18} />
                    Start Your Trademark Search
                    <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                  <Link
                    to="/pricing"
                    className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 border border-white/25 text-white font-semibold px-7 py-4 rounded-xl transition-all duration-200 text-base backdrop-blur-sm"
                  >
                    See Pricing
                  </Link>
                </div>

                {/* Trust badges */}
                <div className="flex flex-wrap gap-x-6 gap-y-2">
                  {[
                    { icon: CheckCircle2, label: '500+ trademarks filed' },
                    { icon: Star, label: '4.9 / 5 rating' },
                    { icon: Shield, label: 'Lawyer-reviewed' },
                  ].map(({ icon: Icon, label }) => (
                    <div key={label} className="flex items-center gap-1.5 text-white/70">
                      <Icon size={14} className="text-gold-400 flex-shrink-0" />
                      <span className="text-sm">{label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right: product mockup */}
              <div
                className={`flex justify-center lg:justify-end transition-all duration-700 delay-300 ${
                  heroLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
                }`}
              >
                <MockupCard />
              </div>
            </div>
          </div>
        </div>

        {/* Scroll nudge */}
        <div className="relative flex justify-center pb-8">
          <ChevronDown size={24} className="text-white/30 animate-bounce" />
        </div>
      </section>

      {/* ─── LOGO BAR ──────────────────────────────────────────────────────── */}
      <section className="py-8 bg-gray-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-xs font-semibold text-gray-400 uppercase tracking-widest mb-6">
            Trusted by brands selling across 30+ countries
          </p>
          <div className="flex flex-wrap justify-center items-center gap-8 lg:gap-14">
            {[
              'Amazon Sellers', 'Mercado Libre', 'Shopify Brands',
              'Agencies', 'OEM Manufacturers', 'Exporters'
            ].map(label => (
              <span key={label} className="text-sm font-semibold text-gray-300 tracking-wide">{label}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ──────────────────────────────────────────────────── */}
      <section className="py-20 lg:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-block text-xs font-bold uppercase tracking-widest text-gold-600 bg-gold-50 border border-gold-200 rounded-full px-4 py-1.5 mb-5">
              How It Works
            </div>
            <h2 className="text-3xl lg:text-5xl font-extrabold text-navy-900 tracking-tight">
              Three steps to a protected brand
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6 lg:gap-10 relative">
            {/* Connector line */}
            <div className="hidden md:block absolute top-14 left-[calc(33.33%+2rem)] right-[calc(33.33%+2rem)] h-px bg-gradient-to-r from-gold-200 via-gold-400 to-gold-200" />

            {STEPS.map((step, i) => (
              <div
                key={i}
                className="relative group bg-white border border-gray-100 hover:border-gold-200 rounded-2xl p-8 transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
              >
                {/* Number badge */}
                <div className="absolute -top-3 left-8">
                  <span className="bg-navy-900 text-gold-400 text-xs font-extrabold rounded-full w-7 h-7 flex items-center justify-center shadow-sm">
                    {i + 1}
                  </span>
                </div>

                <div className="w-12 h-12 bg-gold-50 group-hover:bg-gold-100 rounded-xl flex items-center justify-center mb-5 transition-colors">
                  <step.icon size={22} className="text-gold-600" />
                </div>
                <h3 className="text-lg font-bold text-navy-900 mb-2">{step.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link
              to="/apply"
              className="inline-flex items-center gap-2 bg-navy-900 hover:bg-navy-800 text-white font-semibold px-8 py-4 rounded-xl transition-colors"
            >
              Start Your Application
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── PRICING ───────────────────────────────────────────────────────── */}
      <section className="py-20 lg:py-28 bg-[#F8F7F5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Copy */}
            <div>
              <div className="inline-block text-xs font-bold uppercase tracking-widest text-gold-600 bg-gold-50 border border-gold-200 rounded-full px-4 py-1.5 mb-5">
                Transparent Pricing
              </div>
              <h2 className="text-3xl lg:text-5xl font-extrabold text-navy-900 tracking-tight mb-6">
                One price.<br />No surprises.
              </h2>
              <p className="text-gray-500 text-lg leading-relaxed mb-8">
                Traditional law firms charge $800–$2,000 per class. We charge $270 — that's the government fee plus our service, all in.
              </p>
              <div className="flex flex-col gap-3">
                {[
                  'Government (IMPI) fee included',
                  'AI classification assistance included',
                  'Attorney review included',
                  'Filing receipt provided automatically',
                  'Post-filing support included',
                ].map(item => (
                  <div key={item} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 size={12} className="text-emerald-600" />
                    </div>
                    <span className="text-gray-700 text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Pricing card */}
            <div className="flex justify-center lg:justify-end">
              <div className="w-full max-w-sm">
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xl">
                  {/* Gold top accent */}
                  <div className="h-1 bg-gradient-to-r from-gold-400 to-gold-600" />

                  <div className="p-8">
                    <div className="flex items-center justify-between mb-6">
                      <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Per Trademark Class</span>
                      <span className="text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full px-3 py-1">
                        All-inclusive
                      </span>
                    </div>

                    <div className="mb-6">
                      <div className="flex items-end gap-2 mb-1">
                        <span className="text-6xl font-extrabold text-navy-900 tracking-tight">$270</span>
                        <span className="text-gray-400 text-lg mb-2">USD</span>
                      </div>
                      <div className="text-gray-400 text-sm line-through">vs. $800–$2,000 at a law firm</div>
                    </div>

                    {/* Fee breakdown */}
                    <div className="bg-gray-50 rounded-xl p-4 mb-6 space-y-2.5">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Our service fee</span>
                        <span className="font-semibold text-gray-800">$100</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">IMPI government fee</span>
                        <span className="font-semibold text-gray-800">$170</span>
                      </div>
                      <div className="border-t border-gray-200 pt-2 flex justify-between text-sm font-bold">
                        <span className="text-navy-900">Total</span>
                        <span className="text-navy-900">$270 USD</span>
                      </div>
                    </div>

                    <Link
                      to="/apply"
                      className="w-full flex items-center justify-center gap-2 bg-gold-500 hover:bg-gold-600 text-white font-bold py-4 rounded-xl transition-colors shadow-md"
                    >
                      Start Filing Now
                      <ArrowRight size={16} />
                    </Link>

                    <p className="text-center text-xs text-gray-400 mt-4 flex items-center justify-center gap-1">
                      <Lock size={11} />
                      Price-locked guarantee — no hidden fees
                    </p>
                  </div>
                </div>
                <p className="text-center text-xs text-gray-400 mt-3">
                  Need multiple classes? Each additional class is $270.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── WHY US — COMPARISON ───────────────────────────────────────────── */}
      <section className="py-20 lg:py-28 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <div className="inline-block text-xs font-bold uppercase tracking-widest text-gold-600 bg-gold-50 border border-gold-200 rounded-full px-4 py-1.5 mb-5">
              Why Us
            </div>
            <h2 className="text-3xl lg:text-5xl font-extrabold text-navy-900 tracking-tight">
              The smarter way to file
            </h2>
          </div>

          <div className="rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
            {/* Table header */}
            <div className="grid grid-cols-3 bg-gray-50 border-b border-gray-100">
              <div className="px-6 py-4" />
              <div className="px-6 py-4 text-center">
                <span className="text-sm font-semibold text-gray-400">Traditional Law Firm</span>
              </div>
              <div className="px-6 py-4 text-center bg-navy-50 border-l border-navy-100">
                <span className="text-sm font-bold text-navy-900">Mexico Trademark Center</span>
                <span className="ml-2 text-xs bg-gold-500 text-white rounded-full px-2 py-0.5">Recommended</span>
              </div>
            </div>

            {/* Rows */}
            {COMPARISON.map((row, i) => (
              <div
                key={i}
                className={`grid grid-cols-3 border-b border-gray-50 last:border-0 ${
                  i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                }`}
              >
                <div className="px-6 py-4 text-sm font-medium text-gray-700">{row.label}</div>
                <div className="px-6 py-4 text-center">
                  {typeof row.them === 'boolean' ? (
                    row.them ? (
                      <CheckCircle2 size={16} className="text-gray-300 mx-auto" />
                    ) : (
                      <X size={16} className="text-red-300 mx-auto" />
                    )
                  ) : (
                    <span className="text-sm text-gray-400">{row.them}</span>
                  )}
                </div>
                <div className="px-6 py-4 text-center bg-navy-50/50 border-l border-navy-100">
                  {typeof row.us === 'boolean' ? (
                    row.us ? (
                      <CheckCircle2 size={16} className="text-emerald-500 mx-auto" />
                    ) : (
                      <X size={16} className="text-red-300 mx-auto" />
                    )
                  ) : (
                    <span className="text-sm font-semibold text-navy-900">{row.us}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIALS ──────────────────────────────────────────────────── */}
      <section className="py-20 lg:py-28 bg-[#F8F7F5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Rating header */}
          <div className="text-center mb-14">
            <div className="flex items-center justify-center gap-1 mb-3">
              {[0,1,2,3,4].map(i => (
                <Star key={i} size={22} className="text-gold-400 fill-gold-400" />
              ))}
            </div>
            <div className="text-5xl font-extrabold text-navy-900 mb-1">4.9 / 5.0</div>
            <p className="text-gray-400 text-sm">Based on 120+ completed filings</p>
            <p className="text-gray-500 mt-2 text-sm font-medium">Trusted by startups, agencies, and ecommerce brands</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-gray-100 p-7 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex gap-0.5 mb-5">
                  {[0,1,2,3,4].map(j => (
                    <Star key={j} size={13} className="text-gold-400 fill-gold-400" />
                  ))}
                </div>
                <p className="text-gray-700 text-sm leading-relaxed mb-6">"{t.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-navy-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-navy-700 text-xs font-bold">{t.initials}</span>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-navy-900 flex items-center gap-1.5">
                      {t.name}
                      <span>{t.country}</span>
                    </div>
                    <div className="text-xs text-gray-400">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FAQ ───────────────────────────────────────────────────────────── */}
      <section className="py-20 lg:py-28 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <div className="inline-block text-xs font-bold uppercase tracking-widest text-gold-600 bg-gold-50 border border-gold-200 rounded-full px-4 py-1.5 mb-5">
              FAQ
            </div>
            <h2 className="text-3xl lg:text-5xl font-extrabold text-navy-900 tracking-tight">
              Plain English answers
            </h2>
          </div>

          <div className="divide-y divide-gray-100">
            {FAQS.map((faq, i) => (
              <div key={i}>
                <button
                  className="w-full flex items-center justify-between py-5 text-left gap-4 group"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span className="font-semibold text-navy-900 text-sm leading-snug group-hover:text-navy-700 transition-colors">
                    {faq.q}
                  </span>
                  <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
                    openFaq === i
                      ? 'border-gold-400 bg-gold-400 text-white rotate-45'
                      : 'border-gray-200 text-gray-400 group-hover:border-gold-300'
                  }`}>
                    <span className="text-base font-bold leading-none">+</span>
                  </div>
                </button>
                <div
                  className={`overflow-hidden transition-all duration-300 ${
                    openFaq === i ? 'max-h-48 pb-5' : 'max-h-0'
                  }`}
                >
                  <p className="text-gray-500 text-sm leading-relaxed">{faq.a}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <p className="text-gray-500 text-sm mb-4">Still have questions?</p>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 border border-gray-200 hover:border-navy-300 text-navy-700 font-semibold px-6 py-3 rounded-xl transition-colors text-sm"
            >
              Contact us
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ─────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-navy-950 py-24 lg:py-32">
        {/* Subtle mountain silhouette in background */}
        <div className="absolute inset-0 opacity-[0.06]">
          <svg viewBox="0 0 1440 300" preserveAspectRatio="none" className="w-full h-full">
            <path
              d="M0,300 L0,200 L120,140 L240,180 L360,100 L480,150 L600,60 L720,120 L840,80 L960,130 L1080,70 L1200,110 L1320,50 L1440,90 L1440,300 Z"
              fill="white"
            />
          </svg>
        </div>

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/15 rounded-full px-4 py-1.5 mb-8">
            <Zap size={13} className="text-gold-400" />
            <span className="text-white/70 text-xs font-medium">Same-day filing available</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-6xl font-extrabold text-white tracking-tight mb-6 leading-tight">
            Protect your brand<br />
            <span className="text-gold-400">before someone else does.</span>
          </h2>

          <p className="text-white/60 text-lg mb-10 max-w-xl mx-auto">
            It only takes one competitor to register your brand name in Mexico before you do.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link
              to="/apply"
              className="group inline-flex items-center justify-center gap-2.5 bg-gold-500 hover:bg-gold-400 text-white font-bold px-8 py-5 rounded-xl transition-all duration-200 shadow-xl hover:shadow-gold-500/30 hover:-translate-y-0.5 text-base"
            >
              Start Filing — $270 per class
              <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link
              to="/trademark-check"
              className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold px-8 py-5 rounded-xl transition-colors text-base"
            >
              <Search size={16} />
              Free Trademark Search
            </Link>
          </div>

          {/* Trust badges repeated */}
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-2">
            {[
              { icon: CheckCircle2, label: '500+ trademarks filed' },
              { icon: Star, label: '4.9 / 5 rating' },
              { icon: Shield, label: 'Lawyer-reviewed' },
              { icon: Globe2, label: '30+ countries served' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-1.5 text-white/40">
                <Icon size={13} className="text-white/30 flex-shrink-0" />
                <span className="text-sm">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

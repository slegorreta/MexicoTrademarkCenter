import { Link } from 'react-router-dom';
import { ArrowRight, Search, Shield, CheckCircle2, Star, X, FileText, Award, Zap, Globe as Globe2, Lock } from 'lucide-react';
import { useState, useEffect } from 'react';

// ─── Data ────────────────────────────────────────────────────────────────────

const STATS = [
  { value: '500+', label: 'Trademarks filed' },
  { value: '30+', label: 'Countries served' },
  { value: '4.9', label: 'Average rating' },
  { value: '$299', label: 'All-in price per class' },
];

const STEPS = [
  {
    num: '01',
    icon: Search,
    title: 'Search for conflicts',
    desc: 'Run a free clearance search against the IMPI database in seconds.',
  },
  {
    num: '02',
    icon: FileText,
    title: 'Complete guided application',
    desc: 'AI-assisted form walks you through every required field. Under 10 minutes.',
  },
  {
    num: '03',
    icon: Award,
    title: 'Lawyers review & file',
    desc: 'Mexican IP attorneys review your application and file directly with IMPI.',
  },
];

const COMPARISON_LEFT = [
  '$800 – $2,000+ per class',
  '2 – 4 weeks to file',
  'Email chains and PDFs',
  'Billable hours for attorney work',
  'No AI assistance',
  'Opaque, unpredictable pricing',
];

const COMPARISON_RIGHT = [
  '$299 flat per class',
  'Same-day filing available',
  '100% online guided form',
  'Attorney review included',
  'AI classification built in',
  'Transparent, locked pricing',
];

const TESTIMONIALS = [
  {
    quote: "Filed our trademark for our Shopify brand in 15 minutes. The guided form made it painless and we had our filing confirmation the same day.",
    name: 'Carlos M.',
    role: 'Founder, DTC Brand',
    initials: 'CM',
  },
  {
    quote: "Much cheaper than hiring a local law firm and the team was responsive. The lawyer review gave us real peace of mind.",
    name: 'Priya S.',
    role: 'Head of Legal, SaaS startup',
    initials: 'PS',
  },
  {
    quote: "We needed to protect our brand across Latin America. Mexico was the first step and this made it incredibly easy.",
    name: 'Tom W.',
    role: 'CEO, E-commerce agency',
    initials: 'TW',
  },
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
    q: 'Is the $299 price the total cost, all included?',
    a: 'Yes. Our $299 all-inclusive price covers the government fee ($170) and our service fee ($129). There are no hidden charges. Additional classes are $299 each.',
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

// ─── UI mock ─────────────────────────────────────────────────────────────────

function SearchMockup() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setShow(true), 150);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className={`transition-all duration-700 ${show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
    >
      <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl shadow-gray-200/80 overflow-hidden w-full max-w-sm">
        {/* Top bar */}
        <div className="bg-gray-50 border-b border-gray-100 px-5 py-3.5 flex items-center gap-3">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-gray-200" />
            <div className="w-2.5 h-2.5 rounded-full bg-gray-200" />
            <div className="w-2.5 h-2.5 rounded-full bg-gray-200" />
          </div>
          <div className="flex-1 bg-white border border-gray-200 rounded-md px-3 py-1 text-xs text-gray-400 font-mono">
            mexicotrademarkcenter.com/search
          </div>
        </div>

        <div className="p-5">
          {/* Search input */}
          <div className="mb-4">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">Trademark Search</div>
            <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2.5 bg-gray-50">
              <Search size={14} className="text-gray-400 flex-shrink-0" />
              <span className="text-sm text-gray-700 font-medium flex-1">ACME Brand</span>
              <span className="text-xs bg-gold-500 text-white rounded px-2 py-0.5 font-semibold">Search</span>
            </div>
          </div>

          {/* Results */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
              <div>
                <div className="text-xs text-emerald-700 font-semibold">No conflicts found</div>
                <div className="text-xs text-emerald-600 mt-0.5">Class 25 — Clothing & footwear</div>
              </div>
              <CheckCircle2 size={18} className="text-emerald-500 flex-shrink-0" />
            </div>

            <div className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-semibold text-gray-700">Application Summary</div>
                <span className="text-xs text-gray-400">Draft</span>
              </div>
              <div className="space-y-1.5 text-xs text-gray-500">
                <div className="flex justify-between">
                  <span>Mark</span>
                  <span className="font-medium text-gray-700">ACME Brand</span>
                </div>
                <div className="flex justify-between">
                  <span>Class</span>
                  <span className="font-medium text-gray-700">25 — Clothing</span>
                </div>
                <div className="flex justify-between">
                  <span>Filing fee</span>
                  <span className="font-bold text-navy-900">$299 USD</span>
                </div>
              </div>
            </div>

            <button className="w-full bg-navy-900 hover:bg-navy-800 text-white text-xs font-bold rounded-xl py-3 flex items-center justify-center gap-1.5 transition-colors">
              Continue to application
              <ArrowRight size={12} />
            </button>
          </div>

          <div className="flex items-center justify-center gap-1.5 mt-3">
            <Lock size={9} className="text-gray-300" />
            <span className="text-xs text-gray-300">Reviewed by licensed Mexican IP attorneys</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function PreviewPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="bg-white">

      {/* ─── HERO ──────────────────────────────────────────────────────────── */}
      <section className="bg-[#FAFAF8] border-b border-gray-100 py-24 lg:py-36 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">

            {/* Left */}
            <div>
              <div className="inline-flex items-center gap-2 bg-white border border-gray-200 rounded-full px-3.5 py-1.5 mb-8 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                <span className="text-xs font-semibold text-gray-500 tracking-wide">Mexico's Online Trademark Filing Service</span>
              </div>

              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-navy-950 leading-[1.04] tracking-tight mb-7">
                Register your<br />
                trademark in<br />
                <span className="text-gold-500">Mexico.</span>
              </h1>

              <p className="text-lg text-gray-500 leading-relaxed mb-10 max-w-md">
                AI-assisted filing reviewed by licensed Mexican IP attorneys. From search to filed receipt — online, transparent, same day.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 mb-10">
                <Link
                  to="/trademark-check"
                  className="group inline-flex items-center justify-center gap-2.5 bg-navy-900 hover:bg-navy-800 text-white font-bold px-7 py-4 rounded-xl transition-all duration-200 text-sm shadow-lg shadow-navy-900/20 hover:-translate-y-0.5"
                >
                  <Search size={16} />
                  Start Free Search
                  <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                </Link>
                <Link
                  to="/pricing"
                  className="inline-flex items-center justify-center gap-2 bg-white border border-gray-200 hover:border-gray-300 text-gray-700 font-semibold px-7 py-4 rounded-xl transition-all duration-200 text-sm hover:shadow-sm"
                >
                  See Pricing — $299 / class
                </Link>
              </div>

              <div className="flex flex-wrap gap-x-5 gap-y-2">
                {[
                  { icon: CheckCircle2, label: 'No hidden fees' },
                  { icon: Shield, label: 'Attorney reviewed' },
                  { icon: Zap, label: 'Same-day filing' },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="flex items-center gap-1.5 text-gray-400">
                    <Icon size={13} className="text-gold-500 flex-shrink-0" />
                    <span className="text-sm">{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: mockup */}
            <div className="flex justify-center lg:justify-end">
              <SearchMockup />
            </div>
          </div>
        </div>
      </section>

      {/* ─── STATS BAR ─────────────────────────────────────────────────────── */}
      <section className="py-10 bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-gray-100">
            {STATS.map(({ value, label }) => (
              <div key={label} className="text-center px-8 py-2 first:pl-0 last:pr-0">
                <div className="text-3xl font-extrabold text-navy-950 tracking-tight mb-0.5">{value}</div>
                <div className="text-xs text-gray-400 font-medium">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ──────────────────────────────────────────────────── */}
      <section className="py-24 lg:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-xl mb-16">
            <div className="text-xs font-bold uppercase tracking-widest text-gold-600 mb-5">How it works</div>
            <h2 className="text-4xl lg:text-5xl font-extrabold text-navy-950 leading-tight tracking-tight">
              Three steps to a protected brand.
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-10 lg:gap-16">
            {STEPS.map((step, i) => (
              <div key={i} className="relative">
                <div className="flex items-center gap-4 mb-6">
                  <div className="text-5xl font-extrabold text-gray-100 leading-none select-none">{step.num}</div>
                  <div className="w-10 h-10 bg-gold-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <step.icon size={20} className="text-gold-600" />
                  </div>
                </div>
                <h3 className="text-lg font-bold text-navy-900 mb-3">{step.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{step.desc}</p>
                {i < 2 && (
                  <div className="hidden md:block absolute top-6 left-full w-10 lg:w-16 h-px bg-gray-100 -translate-y-px" />
                )}
              </div>
            ))}
          </div>

          <div className="mt-14">
            <Link
              to="/apply"
              className="inline-flex items-center gap-2 bg-navy-900 hover:bg-navy-800 text-white font-semibold px-7 py-4 rounded-xl transition-all duration-200 text-sm shadow-md hover:-translate-y-0.5"
            >
              Start Your Application
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── PRICING ───────────────────────────────────────────────────────── */}
      <section className="py-24 lg:py-32 bg-[#FAFAF8] border-y border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <div className="text-xs font-bold uppercase tracking-widest text-gold-600 mb-5">Transparent pricing</div>
            <h2 className="text-4xl lg:text-5xl font-extrabold text-navy-950 tracking-tight mb-5">
              One price. No surprises.
            </h2>
            <p className="text-gray-500 max-w-lg mx-auto text-base leading-relaxed">
              Traditional law firms charge $800–$2,000 per class. We charge $299 — government fee and attorney review included.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-xl shadow-gray-100 overflow-hidden max-w-md mx-auto">
            <div className="h-1 bg-gradient-to-r from-gold-400 to-gold-500" />
            <div className="p-8">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="text-7xl font-extrabold text-navy-950 tracking-tight leading-none">$299</div>
                  <div className="text-sm text-gray-400 mt-1">per trademark class (USD)</div>
                </div>
                <span className="text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full px-3 py-1 mt-1">
                  All-inclusive
                </span>
              </div>

              <div className="text-sm text-gray-300 line-through mt-2 mb-7">vs. $800–$2,000 at a law firm</div>

              <div className="bg-gray-50 rounded-xl p-4 mb-7 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Our service fee</span>
                  <span className="font-semibold text-gray-800">$129</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">IMPI government fee</span>
                  <span className="font-semibold text-gray-800">$170</span>
                </div>
                <div className="border-t border-gray-200 pt-3 flex justify-between font-bold text-sm">
                  <span className="text-navy-900">Total</span>
                  <span className="text-navy-900">$299 USD</span>
                </div>
              </div>

              <div className="space-y-2.5 mb-7">
                {[
                  'IMPI government fee included',
                  'AI classification assistance',
                  'Attorney review included',
                  'Filing receipt provided',
                  'Post-filing support',
                ].map(item => (
                  <div key={item} className="flex items-center gap-2.5 text-sm text-gray-600">
                    <CheckCircle2 size={14} className="text-emerald-500 flex-shrink-0" />
                    {item}
                  </div>
                ))}
              </div>

              <Link
                to="/apply"
                className="w-full flex items-center justify-center gap-2 bg-gold-500 hover:bg-gold-600 text-white font-bold py-4 rounded-xl transition-colors text-sm"
              >
                Start Filing Now
                <ArrowRight size={15} />
              </Link>

              <p className="text-center text-xs text-gray-400 mt-4 flex items-center justify-center gap-1">
                <Lock size={10} />
                Price-locked — no hidden fees, ever
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── COMPARISON ────────────────────────────────────────────────────── */}
      <section className="py-24 lg:py-32 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <div className="text-xs font-bold uppercase tracking-widest text-gold-600 mb-5">Why us</div>
            <h2 className="text-4xl lg:text-5xl font-extrabold text-navy-950 tracking-tight">
              The smarter way to file.
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            {/* Traditional */}
            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-8">
              <div className="text-sm font-semibold text-gray-400 mb-6 pb-4 border-b border-gray-100">
                Traditional Law Firm
              </div>
              <div className="space-y-4">
                {COMPARISON_LEFT.map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <X size={10} className="text-gray-400" />
                    </div>
                    <span className="text-sm text-gray-400">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* MTC */}
            <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-lg shadow-gray-100 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-gold-400 to-gold-500" />
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                <span className="text-sm font-bold text-navy-900">Mexico Trademark Center</span>
                <span className="text-xs font-bold bg-gold-500 text-white rounded-full px-2.5 py-0.5">Recommended</span>
              </div>
              <div className="space-y-4">
                {COMPARISON_RIGHT.map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle2 size={10} className="text-emerald-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIALS ──────────────────────────────────────────────────── */}
      <section className="py-24 lg:py-32 bg-[#FAFAF8] border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <div className="flex items-center justify-center gap-0.5 mb-4">
              {[0,1,2,3,4].map(i => (
                <Star key={i} size={20} className="text-gold-400 fill-gold-400" />
              ))}
            </div>
            <div className="text-5xl font-extrabold text-navy-950 tracking-tight mb-2">4.9 / 5.0</div>
            <p className="text-sm text-gray-400">Based on 120+ completed filings</p>
          </div>

          {/* Featured testimonial */}
          <div className="bg-white border border-gray-100 rounded-2xl p-10 shadow-sm mb-5 max-w-2xl mx-auto text-center">
            <div className="flex gap-0.5 justify-center mb-6">
              {[0,1,2,3,4].map(j => (
                <Star key={j} size={14} className="text-gold-400 fill-gold-400" />
              ))}
            </div>
            <p className="text-xl text-gray-700 leading-relaxed font-medium mb-8">
              "{TESTIMONIALS[0].quote}"
            </p>
            <div className="flex items-center justify-center gap-3">
              <div className="w-10 h-10 rounded-full bg-navy-100 flex items-center justify-center">
                <span className="text-navy-700 text-xs font-bold">{TESTIMONIALS[0].initials}</span>
              </div>
              <div className="text-left">
                <div className="text-sm font-semibold text-navy-900">{TESTIMONIALS[0].name}</div>
                <div className="text-xs text-gray-400">{TESTIMONIALS[0].role}</div>
              </div>
            </div>
          </div>

          {/* Secondary testimonials */}
          <div className="grid md:grid-cols-2 gap-5 max-w-2xl mx-auto">
            {TESTIMONIALS.slice(1).map((t, i) => (
              <div key={i} className="bg-white border border-gray-100 rounded-2xl p-7 shadow-sm">
                <div className="flex gap-0.5 mb-4">
                  {[0,1,2,3,4].map(j => (
                    <Star key={j} size={12} className="text-gold-400 fill-gold-400" />
                  ))}
                </div>
                <p className="text-gray-600 text-sm leading-relaxed mb-6">"{t.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-navy-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-navy-700 text-xs font-bold">{t.initials}</span>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-navy-900">{t.name}</div>
                    <div className="text-xs text-gray-400">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FAQ ───────────────────────────────────────────────────────────── */}
      <section className="py-24 lg:py-32 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-14">
            <div className="text-xs font-bold uppercase tracking-widest text-gold-600 mb-5">FAQ</div>
            <h2 className="text-4xl lg:text-5xl font-extrabold text-navy-950 tracking-tight">
              Plain English answers.
            </h2>
          </div>

          <div className="divide-y divide-gray-100">
            {FAQS.map((faq, i) => (
              <div key={i}>
                <button
                  className="w-full flex items-center justify-between py-5 text-left gap-4 group"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span className="font-semibold text-navy-900 text-sm leading-snug">{faq.q}</span>
                  <div className={`w-7 h-7 rounded-full border flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
                    openFaq === i ? 'border-gold-400 bg-gold-400' : 'border-gray-200 group-hover:border-gray-300'
                  }`}>
                    <span className={`text-sm font-bold leading-none transition-transform duration-200 ${
                      openFaq === i ? 'text-white rotate-45' : 'text-gray-400'
                    }`}>+</span>
                  </div>
                </button>
                <div className={`overflow-hidden transition-all duration-300 ${openFaq === i ? 'max-h-48 pb-5' : 'max-h-0'}`}>
                  <p className="text-gray-500 text-sm leading-relaxed">{faq.a}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10">
            <p className="text-sm text-gray-400 mb-4">Still have questions?</p>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 border border-gray-200 hover:border-gray-300 text-navy-700 font-semibold px-6 py-3 rounded-xl transition-colors text-sm"
            >
              Contact us
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ─────────────────────────────────────────────────────── */}
      <section className="bg-navy-950 py-28 lg:py-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-white/[0.07] border border-white/10 rounded-full px-4 py-1.5 mb-10">
            <Zap size={12} className="text-gold-400" />
            <span className="text-white/60 text-xs font-medium">Same-day filing available</span>
          </div>

          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-tight mb-6">
            Your brand deserves<br />
            <span className="text-gold-400">protection.</span>
          </h2>

          <p className="text-white/50 text-lg mb-12 max-w-md mx-auto leading-relaxed">
            It only takes one competitor to register your name in Mexico before you do.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/apply"
              className="group inline-flex items-center justify-center gap-2.5 bg-gold-500 hover:bg-gold-400 text-white font-bold px-9 py-5 rounded-xl transition-all duration-200 text-sm shadow-xl hover:-translate-y-0.5"
            >
              Start Filing — $299 per class
              <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link
              to="/trademark-check"
              className="inline-flex items-center justify-center gap-2 bg-white/[0.07] hover:bg-white/[0.12] border border-white/10 text-white font-semibold px-9 py-5 rounded-xl transition-colors text-sm"
            >
              <Search size={15} />
              Free Trademark Search
            </Link>
          </div>

          <div className="flex flex-wrap justify-center gap-x-8 gap-y-2 mt-12">
            {[
              { icon: CheckCircle2, label: '500+ trademarks filed' },
              { icon: Star, label: '4.9 / 5 rating' },
              { icon: Shield, label: 'Lawyer-reviewed' },
              { icon: Globe2, label: '30+ countries served' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-1.5 text-white/30">
                <Icon size={12} className="flex-shrink-0" />
                <span className="text-xs">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

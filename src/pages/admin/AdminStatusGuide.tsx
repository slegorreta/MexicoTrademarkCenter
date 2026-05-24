import { Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, XCircle, HelpCircle } from 'lucide-react';
import { TM5Icon } from '../../components/TrademarkStatusBadge';
import { TM5_STATUS_MAP, ALL_FILING_STATUSES, STATUS_COLORS, STATUS_LABELS } from '../../constants/tm5Statuses';
import type { FilingStatus } from '../../constants/tm5Statuses';

// Deduplicate entries by tm5Name+ringColor so we don't repeat the same TM5 status multiple times
interface GuideEntry {
  tm5Name: string;
  description: string;
  ringColor: 'green' | 'red' | 'gray';
  iconType: import('../../constants/tm5Statuses').TM5IconType;
  internalStatuses: FilingStatus[];
}

function buildGuideEntries(): GuideEntry[] {
  const map = new Map<string, GuideEntry>();
  for (const status of ALL_FILING_STATUSES) {
    const cfg = TM5_STATUS_MAP[status];
    const key = `${cfg.ringColor}::${cfg.tm5Name}`;
    if (!map.has(key)) {
      map.set(key, {
        tm5Name: cfg.tm5Name,
        description: cfg.description,
        ringColor: cfg.ringColor,
        iconType: cfg.iconType,
        internalStatuses: [],
      });
    }
    map.get(key)!.internalStatuses.push(status);
  }
  return Array.from(map.values());
}

const ALL_ENTRIES = buildGuideEntries();
const LIVE_ENTRIES   = ALL_ENTRIES.filter(e => e.ringColor === 'green');
const DEAD_ENTRIES   = ALL_ENTRIES.filter(e => e.ringColor === 'red');
const OTHER_ENTRIES  = ALL_ENTRIES.filter(e => e.ringColor === 'gray');

// ─── Section ──────────────────────────────────────────────────────────────────

function SectionHeader({ icon, label, color }: { icon: React.ReactNode; label: string; color: string }) {
  return (
    <div className={`flex items-center gap-2 mb-4 pb-2 border-b-2 ${color}`}>
      {icon}
      <h2 className="text-base font-bold text-gray-800">{label}</h2>
    </div>
  );
}

function EntryCard({ entry }: { entry: GuideEntry }) {
  const ringLabel: Record<string, string> = { green: '[#22a048]', red: '[#d93025]', gray: 'gray-500' };
  const tm5Color = `text-${ringLabel[entry.ringColor]}`;

  return (
    <div className="flex gap-4 p-4 rounded-xl border border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm transition-all">
      {/* Use first internal status to drive the icon */}
      <TM5Icon status={entry.internalStatuses[0]} size="lg" />
      <div className="flex-1 min-w-0">
        <div className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-0.5">
          LIVE/APPLICATION/
          <span className={`font-bold ${tm5Color}`}>{entry.tm5Name}</span>
        </div>
        <p className="text-xs text-gray-600 leading-relaxed mt-1">{entry.description}</p>
        {/* Internal status chips */}
        <div className="flex flex-wrap gap-1.5 mt-2">
          {entry.internalStatuses.map(s => (
            <span
              key={s}
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${STATUS_COLORS[s]}`}
            >
              {STATUS_LABELS[s]}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminStatusGuide() {
  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          to="/admin"
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft size={15} />
          Back
        </Link>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-navy-900">TM5 Common Status Descriptors</h1>
        <p className="text-sm text-gray-500 mt-1 leading-relaxed max-w-2xl">
          These status icons follow the <strong>TM5 Common Status Descriptors</strong> standard, shared
          between major trademark offices (USPTO, EUIPO, and others) to give applicants a consistent
          visual language for understanding where their application stands. The colored ring indicates
          whether the mark is <span className="font-semibold text-[#22a048]">live</span> (green)
          or <span className="font-semibold text-[#d93025]">dead / terminated</span> (red).
        </p>
      </div>

      {/* Live statuses */}
      <section className="mb-8">
        <SectionHeader
          icon={<CheckCircle2 size={18} className="text-[#22a048]" />}
          label="Live / Active Applications"
          color="border-[#22a048]"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {LIVE_ENTRIES.map(e => <EntryCard key={e.tm5Name} entry={e} />)}
        </div>
      </section>

      {/* Dead statuses */}
      <section className="mb-8">
        <SectionHeader
          icon={<XCircle size={18} className="text-[#d93025]" />}
          label="Dead / Terminated Applications"
          color="border-[#d93025]"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {DEAD_ENTRIES.map(e => <EntryCard key={e.tm5Name} entry={e} />)}
        </div>
      </section>

      {/* Other */}
      {OTHER_ENTRIES.length > 0 && (
        <section className="mb-8">
          <SectionHeader
            icon={<HelpCircle size={18} className="text-gray-500" />}
            label="Other / Unknown"
            color="border-gray-300"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {OTHER_ENTRIES.map(e => <EntryCard key={e.tm5Name} entry={e} />)}
          </div>
        </section>
      )}

      {/* Footer note */}
      <div className="rounded-xl bg-navy-50 border border-navy-100 p-4 text-xs text-navy-700 leading-relaxed">
        <strong>Note:</strong> The internal system statuses shown as colored chips are MexicoTrademarkCenter's
        operational workflow stages. Each maps to the nearest TM5 standard descriptor shown above.
        The TM5 icons are what IMPI and other offices display when applicants look up their marks
        in official trademark databases.
      </div>
    </div>
  );
}

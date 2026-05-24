import { useState, useEffect, useRef } from 'react';
import {
  Folder, FolderSearch, Scale, Users, Ban, Trash2,
  Award, Info, X
} from 'lucide-react';
import { TM5_STATUS_MAP, STATUS_COLORS, STATUS_LABELS } from '../constants/tm5Statuses';
import type { FilingStatus, TM5IconType, TM5RingColor } from '../constants/tm5Statuses';

// ─── TM5 Circular Icon ────────────────────────────────────────────────────────

function tm5IconComponent(iconType: TM5IconType, size: number) {
  const cls = `text-gray-700`;
  switch (iconType) {
    case 'folder':        return <Folder size={size} className={cls} />;
    case 'folder-search': return <FolderSearch size={size} className={cls} />;
    case 'folder-scales': return <Scale size={size} className={cls} />;
    case 'folder-people': return <Users size={size} className={cls} />;
    case 'folder-ban':    return <Ban size={size} className={cls} />;
    case 'folder-trash':  return <Trash2 size={size} className={cls} />;
    case 'medal':         return <Award size={size} className={cls} />;
    case 'medal-ban':     return <Ban size={size} className={cls} />;
    case 'medal-trash':   return <Trash2 size={size} className={cls} />;
    case 'medal-clock':   return <Award size={size} className={cls} />;
    default:              return <Folder size={size} className={cls} />;
  }
}

const ringColorClasses: Record<TM5RingColor, string> = {
  green: 'border-[#22a048] bg-white',
  red:   'border-[#d93025] bg-white',
  gray:  'border-gray-400 bg-white',
};

const sizeMap = {
  sm: { outer: 28, icon: 13, border: 2 },
  md: { outer: 36, icon: 17, border: 2 },
  lg: { outer: 48, icon: 22, border: 3 },
};

interface TM5IconBadgeProps {
  status: FilingStatus;
  size?: 'sm' | 'md' | 'lg';
}

export function TM5Icon({ status, size = 'md' }: TM5IconBadgeProps) {
  const config = TM5_STATUS_MAP[status];
  if (!config) return null;
  const { outer, icon, border } = sizeMap[size];
  return (
    <div
      className={`rounded-full flex items-center justify-center flex-shrink-0 ${ringColorClasses[config.ringColor]}`}
      style={{ width: outer, height: outer, borderWidth: border }}
    >
      {tm5IconComponent(config.iconType, icon)}
    </div>
  );
}

// ─── Info Popover ─────────────────────────────────────────────────────────────

function InfoPopover({ status, onClose }: { status: FilingStatus; onClose: () => void }) {
  const config = TM5_STATUS_MAP[status];
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  if (!config) return null;

  return (
    <div
      ref={ref}
      className="absolute z-50 left-0 top-full mt-2 w-72 bg-white rounded-xl shadow-xl border border-gray-200 p-4 text-left"
    >
      <button
        onClick={onClose}
        className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
      >
        <X size={14} />
      </button>
      <div className="flex items-center gap-3 mb-3">
        <TM5Icon status={status} size="md" />
        <div>
          <div className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold leading-tight">TM5 Standard Status</div>
          <div
            className={`text-sm font-bold leading-tight mt-0.5 ${
              config.ringColor === 'green' ? 'text-[#22a048]' : config.ringColor === 'red' ? 'text-[#d93025]' : 'text-gray-500'
            }`}
          >
            {config.tm5Name}
          </div>
        </div>
      </div>
      <p className="text-xs text-gray-600 leading-relaxed">{config.description}</p>
      <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2">
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[status]}`}>
          {STATUS_LABELS[status]}
        </span>
        <span className="text-[10px] text-gray-400">Internal status</span>
      </div>
    </div>
  );
}

// ─── Main Badge Component ─────────────────────────────────────────────────────

interface TrademarkStatusBadgeProps {
  status: FilingStatus | string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  showInfoButton?: boolean;
  /** Render just the TM5 icon circle with no text badge */
  iconOnly?: boolean;
}

export default function TrademarkStatusBadge({
  status,
  size = 'sm',
  showLabel = true,
  showInfoButton = false,
  iconOnly = false,
}: TrademarkStatusBadgeProps) {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const safeStatus = (status as FilingStatus) in TM5_STATUS_MAP
    ? (status as FilingStatus)
    : 'new';

  if (iconOnly) {
    return (
      <div className="relative inline-flex items-center">
        <TM5Icon status={safeStatus} size={size} />
        {showInfoButton && (
          <>
            <button
              onClick={() => setPopoverOpen(v => !v)}
              className="ml-1 text-gray-400 hover:text-gray-600 transition-colors"
              type="button"
            >
              <Info size={12} />
            </button>
            {popoverOpen && (
              <InfoPopover status={safeStatus} onClose={() => setPopoverOpen(false)} />
            )}
          </>
        )}
      </div>
    );
  }

  return (
    <div className="relative inline-flex items-center gap-1.5">
      {size !== 'sm' && <TM5Icon status={safeStatus} size={size === 'lg' ? 'md' : 'sm'} />}
      {showLabel && (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[safeStatus] ?? 'bg-gray-100 text-gray-600'}`}>
          {STATUS_LABELS[safeStatus] ?? status}
        </span>
      )}
      {showInfoButton && (
        <>
          <button
            onClick={() => setPopoverOpen(v => !v)}
            className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
            type="button"
          >
            <Info size={13} />
          </button>
          {popoverOpen && (
            <InfoPopover status={safeStatus} onClose={() => setPopoverOpen(false)} />
          )}
        </>
      )}
    </div>
  );
}

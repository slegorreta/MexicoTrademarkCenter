export type FilingStatus =
  | 'new'
  | 'pending_review'
  | 'pending_payment'
  | 'info_requested'
  | 'classification_pending'
  | 'ready_to_file'
  | 'filed'
  | 'office_action_pending'
  | 'office_action_responded'
  | 'published'
  | 'opposed'
  | 'registered'
  | 'abandoned'
  | 'closed';

export type TM5RingColor = 'green' | 'red' | 'gray';

export type TM5IconType =
  | 'folder'
  | 'folder-search'
  | 'folder-scales'
  | 'folder-people'
  | 'folder-ban'
  | 'folder-trash'
  | 'medal'
  | 'medal-ban'
  | 'medal-trash'
  | 'medal-clock'
  | 'other';

export interface TM5StatusConfig {
  label: string;
  tm5Name: string;
  description: string;
  ringColor: TM5RingColor;
  iconType: TM5IconType;
  isLive: boolean;
}

export const TM5_STATUS_MAP: Record<FilingStatus, TM5StatusConfig> = {
  new: {
    label: 'New',
    tm5Name: 'Awaiting Examination',
    description:
      'The trade mark application has been accepted by the Office (has met the minimum filing requirements) and has not yet been assigned to an examiner.',
    ringColor: 'green',
    iconType: 'folder',
    isLive: true,
  },
  pending_review: {
    label: 'Pending Review',
    tm5Name: 'Awaiting Examination',
    description:
      'The trade mark application has been accepted by the Office (has met the minimum filing requirements) and has not yet been assigned to an examiner.',
    ringColor: 'green',
    iconType: 'folder',
    isLive: true,
  },
  pending_payment: {
    label: 'Awaiting Payment',
    tm5Name: 'Awaiting Examination',
    description:
      'The trade mark application has been accepted by the Office (has met the minimum filing requirements) and has not yet been assigned to an examiner.',
    ringColor: 'green',
    iconType: 'folder',
    isLive: true,
  },
  classification_pending: {
    label: 'Classification Pending',
    tm5Name: 'Under Examination',
    description:
      'The trade mark application has been accepted by the Office (has met the minimum filing requirements) and this application has been assigned to an examiner.',
    ringColor: 'green',
    iconType: 'folder-search',
    isLive: true,
  },
  info_requested: {
    label: 'Info Requested',
    tm5Name: 'Under Examination',
    description:
      'The trade mark application has been accepted by the Office (has met the minimum filing requirements) and this application has been assigned to an examiner.',
    ringColor: 'green',
    iconType: 'folder-search',
    isLive: true,
  },
  ready_to_file: {
    label: 'Ready to File',
    tm5Name: 'Under Examination',
    description:
      'The trade mark application has been accepted by the Office (has met the minimum filing requirements) and this application has been assigned to an examiner.',
    ringColor: 'green',
    iconType: 'folder-search',
    isLive: true,
  },
  filed: {
    label: 'Filed',
    tm5Name: 'Under Examination',
    description:
      'The trade mark application has been accepted by the Office (has met the minimum filing requirements) and this application has been assigned to an examiner.',
    ringColor: 'green',
    iconType: 'folder-search',
    isLive: true,
  },
  office_action_pending: {
    label: 'Office Action',
    tm5Name: 'Appeal of Refusal Pending',
    description:
      'An appeal of the Office\'s final refusal to register a pending trade mark application is currently pending.',
    ringColor: 'green',
    iconType: 'folder-scales',
    isLive: true,
  },
  office_action_responded: {
    label: 'Office Action Responded',
    tm5Name: 'Appeal of Refusal Pending',
    description:
      'An appeal of the Office\'s final refusal to register a pending trade mark application is currently pending.',
    ringColor: 'green',
    iconType: 'folder-scales',
    isLive: true,
  },
  published: {
    label: 'Published',
    tm5Name: 'Published for Opposition',
    description:
      'A pending trade mark application has been examined by the Office and has been published in a way that provides an opportunity for the public to oppose its registration.',
    ringColor: 'green',
    iconType: 'folder-people',
    isLive: true,
  },
  opposed: {
    label: 'Opposed',
    tm5Name: 'Opposition Pending',
    description:
      'The pending trade mark application has been examined by the Office and was published for opposition, at which time one or more oppositions were filed but they have not yet been decided.',
    ringColor: 'green',
    iconType: 'folder-people',
    isLive: true,
  },
  registered: {
    label: 'Registered',
    tm5Name: 'Issued and Active',
    description:
      'The trade mark application has been registered with the Office.',
    ringColor: 'green',
    iconType: 'medal',
    isLive: true,
  },
  abandoned: {
    label: 'Abandoned',
    tm5Name: 'Withdrawn / Abandoned',
    description:
      'The owner of the trade mark application withdrew (e.g. abandoned) the application and the application is no longer active.',
    ringColor: 'red',
    iconType: 'folder-trash',
    isLive: false,
  },
  closed: {
    label: 'Closed',
    tm5Name: 'Refused / Dismissed or Invalidated',
    description:
      'This trade mark application was refused, dismissed, or invalidated by the Office and this application is no longer active.',
    ringColor: 'red',
    iconType: 'folder-ban',
    isLive: false,
  },
};

// ─── Consolidated label / color records (replaces duplicates across all files) ─

export const STATUS_LABELS: Record<FilingStatus, string> = Object.fromEntries(
  Object.entries(TM5_STATUS_MAP).map(([k, v]) => [k, v.label])
) as Record<FilingStatus, string>;

export const STATUS_COLORS: Record<FilingStatus, string> = {
  new: 'bg-blue-100 text-blue-700',
  pending_review: 'bg-amber-100 text-amber-700',
  pending_payment: 'bg-orange-100 text-orange-700',
  info_requested: 'bg-rose-100 text-rose-700',
  classification_pending: 'bg-sky-100 text-sky-700',
  ready_to_file: 'bg-teal-100 text-teal-700',
  filed: 'bg-green-100 text-green-700',
  office_action_pending: 'bg-red-100 text-red-700',
  office_action_responded: 'bg-orange-100 text-orange-700',
  published: 'bg-cyan-100 text-cyan-700',
  opposed: 'bg-purple-100 text-purple-700',
  registered: 'bg-emerald-100 text-emerald-700',
  abandoned: 'bg-gray-100 text-gray-500',
  closed: 'bg-gray-100 text-gray-400',
};

// Full ordered list for dropdowns / filters
export const ALL_FILING_STATUSES: FilingStatus[] = [
  'new', 'pending_review', 'pending_payment', 'info_requested',
  'classification_pending', 'ready_to_file', 'filed',
  'office_action_pending', 'office_action_responded',
  'published', 'opposed', 'registered', 'abandoned', 'closed',
];

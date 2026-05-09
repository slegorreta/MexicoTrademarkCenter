import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { ArrowLeft, Save, Link as LinkIcon, Mail, Plus } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { COUNTRIES } from '../../lib/countries';
import { calculatePrice } from '../../lib/classifier';

const MARK_TYPES = ['word', 'design', 'combined', 'three_dimensional', 'trade_name', 'slogan'];

interface ClassEntry { class_number: number; class_title_en: string; goods_services_en: string; }

export default function AdminNewApplication() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const prefilledClientId = searchParams.get('client_id');
  const { user, session } = useAuth();

  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Client selection
  const [clients, setClients] = useState<Record<string, unknown>[]>([]);
  const [selectedClientId, setSelectedClientId] = useState(prefilledClientId ?? '');
  const [createNewClient, setCreateNewClient] = useState(!prefilledClientId);

  // New client form
  const [applicantType, setApplicantType] = useState<'individual' | 'company'>('company');
  const [legalName, setLegalName] = useState('');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  // Trademark
  const [markName, setMarkName] = useState('');
  const [markType, setMarkType] = useState('word');
  const [claimsColor, setClaimsColor] = useState(false);
  const [colorDescription, setColorDescription] = useState('');

  // Classes
  const [classes, setClasses] = useState<ClassEntry[]>([]);
  const [classNumber, setClassNumber] = useState('');
  const [classTitle, setClassTitle] = useState('');
  const [classGoods, setClassGoods] = useState('');

  // Pricing
  const [serviceFeeUsd, setServiceFeeUsd] = useState(0);
  const [govFeeUsd] = useState(170);

  // Result
  const [createdAppId, setCreatedAppId] = useState('');
  const [paymentLinkUrl, setPaymentLinkUrl] = useState('');
  const [generatingLink, setGeneratingLink] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  useEffect(() => {
    supabase.from('clients').select('id, legal_name, email, country').order('legal_name').then(({ data }) => {
      setClients((data as Record<string, unknown>[]) ?? []);
      if (prefilledClientId) setCreateNewClient(false);
    });
  }, [prefilledClientId]);

  useEffect(() => {
    const { total } = calculatePrice(classes.length);
    setServiceFeeUsd(total);
  }, [classes]);

  const totalAmount = serviceFeeUsd + govFeeUsd * classes.length;

  const addClass = () => {
    if (!classNumber || !classGoods) return;
    setClasses(prev => [...prev, {
      class_number: parseInt(classNumber),
      class_title_en: classTitle,
      goods_services_en: classGoods,
    }]);
    setClassNumber(''); setClassTitle(''); setClassGoods('');
  };

  const saveApplication = async () => {
    setSaving(true);
    setError('');
    try {
      let clientId = selectedClientId;

      // Create client if needed
      if (createNewClient || !clientId) {
        const { data: newClient, error: clientErr } = await supabase
          .from('clients')
          .insert({
            applicant_type: applicantType, legal_name: legalName, country, city, address,
            postal_code: postalCode, email, phone, is_active: true,
          })
          .select('id')
          .single();
        if (clientErr || !newClient) throw new Error(clientErr?.message ?? 'Failed to create client');
        clientId = newClient.id;
      }

      // Generate case number
      const caseNum = `MTC-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 90000) + 10000)}`;

      // Create application
      const { data: newApp, error: appErr } = await supabase
        .from('applications')
        .insert({
          case_number: caseNum,
          client_id: clientId,
          payment_status: 'pending',
          filing_status: 'pending_payment',
          total_classes: classes.length,
          service_fee_usd: serviceFeeUsd,
          government_fee_usd: govFeeUsd * classes.length,
          total_amount_usd: totalAmount,
        })
        .select('id')
        .single();
      if (appErr || !newApp) throw new Error(appErr?.message ?? 'Failed to create application');

      const appId = newApp.id;

      // Create trademark
      await supabase.from('trademarks').insert({
        application_id: appId, mark_name: markName, mark_type: markType,
        claims_color: claimsColor, color_description: colorDescription || null,
      });

      // Create classes
      if (classes.length > 0) {
        await supabase.from('trademark_classes').insert(
          classes.map(c => ({ application_id: appId, ...c, status: 'pending' }))
        );
      }

      // Create pending payment record
      await supabase.from('payments').insert({
        application_id: appId,
        client_id: clientId,
        amount_usd: totalAmount,
        currency: 'usd',
        status: 'pending',
      });

      setCreatedAppId(appId);
      setStep(3);
    } catch (err) {
      setError(String(err));
    }
    setSaving(false);
  };

  const generatePaymentLink = async () => {
    setGeneratingLink(true);
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const res = await fetch(`${supabaseUrl}/functions/v1/create-staff-payment-link`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
      body: JSON.stringify({ application_id: createdAppId }),
    });
    const data = await res.json();
    if (res.ok) {
      setPaymentLinkUrl(data.payment_link_url);
    } else {
      setError(data.error ?? 'Failed to generate payment link');
    }
    setGeneratingLink(false);
  };

  const sendPaymentEmail = async () => {
    setSendingEmail(true);
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const res = await fetch(`${supabaseUrl}/functions/v1/send-payment-link-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
      body: JSON.stringify({ application_id: createdAppId, payment_link_url: paymentLinkUrl }),
    });
    if (res.ok) setEmailSent(true);
    else setError('Failed to send payment email.');
    setSendingEmail(false);
  };

  const inputCls = 'w-full border border-gray-200 rounded-lg text-sm px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-gold-400';
  const labelCls = 'text-xs text-gray-500 uppercase tracking-wide block mb-1';

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/admin/applications" className="flex items-center gap-1 text-sm text-gray-500 hover:text-navy-900">
          <ArrowLeft size={16} /> Back
        </Link>
        <span className="text-gray-300">/</span>
        <span className="text-sm font-semibold text-navy-900">New Application</span>
      </div>

      {/* Step indicators */}
      <div className="flex items-center gap-3 mb-6">
        {['Client', 'Trademark & Classes', 'Payment Link'].map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step > i + 1 ? 'bg-green-500 text-white' : step === i + 1 ? 'bg-navy-900 text-white' : 'bg-gray-200 text-gray-400'}`}>
              {step > i + 1 ? '✓' : i + 1}
            </div>
            <span className={`text-sm ${step === i + 1 ? 'font-semibold text-navy-900' : 'text-gray-400'}`}>{label}</span>
            {i < 2 && <span className="text-gray-300">→</span>}
          </div>
        ))}
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>
      )}

      {/* Step 1: Client */}
      {step === 1 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="text-base font-semibold text-gray-900">Applicant Information</h2>
          <div className="flex gap-3">
            <button onClick={() => { setCreateNewClient(false); }} className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${!createNewClient ? 'bg-navy-900 text-white border-navy-900' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
              Existing Client
            </button>
            <button onClick={() => { setCreateNewClient(true); setSelectedClientId(''); }} className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${createNewClient ? 'bg-navy-900 text-white border-navy-900' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
              New Client
            </button>
          </div>

          {!createNewClient ? (
            <div>
              <label className={labelCls}>Select Client</label>
              <select value={selectedClientId} onChange={e => setSelectedClientId(e.target.value)} className={inputCls}>
                <option value="">— Select client —</option>
                {clients.map(c => (
                  <option key={String(c.id)} value={String(c.id)}>
                    {String(c.legal_name ?? '')} — {String(c.email ?? '')} ({String(c.country ?? '')})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex gap-3">
                <button onClick={() => setApplicantType('company')} className={`flex-1 py-2 rounded-lg text-sm border transition-colors ${applicantType === 'company' ? 'bg-navy-50 border-navy-300 text-navy-800 font-medium' : 'border-gray-200 text-gray-600'}`}>Company</button>
                <button onClick={() => setApplicantType('individual')} className={`flex-1 py-2 rounded-lg text-sm border transition-colors ${applicantType === 'individual' ? 'bg-navy-50 border-navy-300 text-navy-800 font-medium' : 'border-gray-200 text-gray-600'}`}>Individual</button>
              </div>
              <div><label className={labelCls}>Legal Name *</label><input className={inputCls} value={legalName} onChange={e => setLegalName(e.target.value)} placeholder="Full legal name" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={labelCls}>Email *</label><input type="email" className={inputCls} value={email} onChange={e => setEmail(e.target.value)} /></div>
                <div><label className={labelCls}>Phone</label><input className={inputCls} value={phone} onChange={e => setPhone(e.target.value)} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Country *</label>
                  <select className={inputCls} value={country} onChange={e => setCountry(e.target.value)}>
                    <option value="">Select country</option>
                    {COUNTRIES.map(c => <option key={c.code} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
                <div><label className={labelCls}>City</label><input className={inputCls} value={city} onChange={e => setCity(e.target.value)} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={labelCls}>Address</label><input className={inputCls} value={address} onChange={e => setAddress(e.target.value)} /></div>
                <div><label className={labelCls}>Postal Code</label><input className={inputCls} value={postalCode} onChange={e => setPostalCode(e.target.value)} /></div>
              </div>
            </div>
          )}

          <button
            onClick={() => setStep(2)}
            disabled={!createNewClient ? !selectedClientId : !legalName || !email || !country}
            className="w-full bg-navy-900 hover:bg-navy-800 text-white text-sm font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50"
          >
            Next: Trademark Details →
          </button>
        </div>
      )}

      {/* Step 2: Trademark & Classes */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <h2 className="text-base font-semibold text-gray-900">Trademark Details</h2>
            <div><label className={labelCls}>Mark Name / Identifier</label><input className={inputCls} value={markName} onChange={e => setMarkName(e.target.value)} placeholder="e.g. ACME or description for logo" /></div>
            <div>
              <label className={labelCls}>Mark Type</label>
              <select className={inputCls} value={markType} onChange={e => setMarkType(e.target.value)}>
                {MARK_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input type="checkbox" checked={claimsColor} onChange={e => setClaimsColor(e.target.checked)} />
              Claims color as a feature of the mark
            </label>
            {claimsColor && (
              <div><label className={labelCls}>Color Description</label><input className={inputCls} value={colorDescription} onChange={e => setColorDescription(e.target.value)} placeholder="e.g. Red, white and blue" /></div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <h2 className="text-base font-semibold text-gray-900">Nice Classes</h2>
            <div className="grid grid-cols-3 gap-3">
              <div><label className={labelCls}>Class No.</label><input type="number" min="1" max="45" className={inputCls} value={classNumber} onChange={e => setClassNumber(e.target.value)} placeholder="e.g. 25" /></div>
              <div className="col-span-2"><label className={labelCls}>Class Title</label><input className={inputCls} value={classTitle} onChange={e => setClassTitle(e.target.value)} placeholder="e.g. Clothing, footwear" /></div>
            </div>
            <div><label className={labelCls}>Goods / Services Description</label><input className={inputCls} value={classGoods} onChange={e => setClassGoods(e.target.value)} placeholder="Specific goods or services covered" /></div>
            <button onClick={addClass} disabled={!classNumber || !classGoods} className="flex items-center gap-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors disabled:opacity-40">
              <Plus size={14} /> Add Class
            </button>
            {classes.length > 0 && (
              <div className="space-y-1.5 mt-2">
                {classes.map((c, i) => (
                  <div key={i} className="flex items-start gap-3 bg-gray-50 rounded-lg px-3 py-2 text-sm">
                    <span className="font-bold text-navy-700 flex-shrink-0">Class {c.class_number}</span>
                    <span className="text-gray-600 flex-1">{c.class_title_en || c.goods_services_en}</span>
                    <button onClick={() => setClasses(prev => prev.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-600 text-xs">Remove</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pricing summary */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Fee Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Service Fee</span><span>USD {serviceFeeUsd.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Gov. Fee ({classes.length} class × USD {govFeeUsd})</span><span>USD {(govFeeUsd * classes.length).toFixed(2)}</span></div>
              <div className="flex justify-between font-bold text-base pt-2 border-t border-gray-100"><span>Total</span><span>USD {totalAmount.toFixed(2)}</span></div>
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="flex-1 border border-gray-200 text-gray-600 text-sm font-medium py-2.5 rounded-lg hover:bg-gray-50 transition-colors">
              ← Back
            </button>
            <button
              onClick={saveApplication}
              disabled={saving || !markName || classes.length === 0}
              className="flex-1 bg-navy-900 hover:bg-navy-800 text-white text-sm font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Save size={14} />{saving ? 'Creating…' : 'Create Application'}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Payment link */}
      {step === 3 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Save size={20} className="text-green-600" />
            </div>
            <h2 className="text-base font-semibold text-gray-900">Application Created</h2>
            <p className="text-sm text-gray-500 mt-1">Now generate a payment link to send to the client.</p>
          </div>

          <div className="flex gap-3">
            <Link to={`/admin/applications/${createdAppId}`} className="flex-1 border border-gray-200 text-gray-600 text-sm font-medium py-2.5 rounded-lg hover:bg-gray-50 transition-colors text-center">
              View Application
            </Link>
            <button
              onClick={generatePaymentLink}
              disabled={generatingLink}
              className="flex-1 bg-navy-900 hover:bg-navy-800 text-white text-sm font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <LinkIcon size={14} />{generatingLink ? 'Generating…' : 'Generate Payment Link'}
            </button>
          </div>

          {paymentLinkUrl && (
            <div className="space-y-3">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">Payment Link (USD {totalAmount.toFixed(2)})</p>
                <a href={paymentLinkUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline break-all">{paymentLinkUrl}</a>
              </div>
              <button
                onClick={() => navigator.clipboard.writeText(paymentLinkUrl)}
                className="w-full border border-gray-200 text-gray-600 text-sm py-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Copy Link
              </button>
              {emailSent ? (
                <div className="text-center text-sm text-green-700 bg-green-50 rounded-lg py-2 border border-green-200">
                  Payment email sent to client successfully.
                </div>
              ) : (
                <button
                  onClick={sendPaymentEmail}
                  disabled={sendingEmail}
                  className="w-full bg-gold-500 hover:bg-gold-600 text-white text-sm font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Mail size={14} />{sendingEmail ? 'Sending…' : 'Send Payment Email to Client'}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

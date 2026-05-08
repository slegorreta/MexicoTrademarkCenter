import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { CheckCircle2, ChevronRight, Upload, X, Plus, Trash2, Lock, CreditCard, AlertCircle, Sparkles, Tag, Loader2 } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { calculatePrice, getAllClasses, type ClassSuggestion } from '../lib/classifier';
import { getSortedCountries, getSortedDialCodes, type SupportedLang } from '../lib/countries';
import AIDescriptionAssistant, { type RelatedClass } from '../components/AIDescriptionAssistant';
import TrademarkClearancePanel, { type ClearanceResult } from '../components/TrademarkClearancePanel';

type Step = 1 | 2 | 3 | 4 | 5 | 6 | 7;

interface ClassEntry {
  id: string;
  description: string;
  businessIndustry: string;
  classNumber: number | null;
  classTitleEn: string;
  descriptionEn: string;
  descriptionEs: string;
  confidence: number;
  isConfirmed: boolean;
  fallbackClasses: number[];
  fallbackSuggestions: ClassSuggestion[];
}

interface FormData {
  applicantType: 'individual' | 'company';
  legalName: string;
  country: string;
  address: string;
  city: string;
  stateProvince: string;
  postalCode: string;
  email: string;
  emailConfirm: string;
  phoneDialCode: string;
  phoneNumber: string;
  wechat: string;
  whatsapp: string;
  taxId: string;
  contactPerson: string;
  preferredLanguage: 'en' | 'zh' | 'es' | 'de' | 'fr' | 'hi' | 'pt';
  markName: string;
  markType: string;
  containsNonSpanish: boolean;
  markLanguage: string;
  meaningSpanish: string;
  transliteration: string;
  markDescription: string;
  claimsColor: boolean;
  colorDescription: string;
  logoFile: File | null;
  classEntries: ClassEntry[];
  usedInMexico: boolean;
  firstUseDate: string;
  priorityClaimed: boolean;
  priorityCountry: string;
  priorityAppNumber: string;
  priorityFilingDate: string;
  isOwner: boolean;
  knownSimilarMarks: string;
}

const ALL_CLASSES = getAllClasses();

function newEntry(): ClassEntry {
  return {
    id: `entry-${Date.now()}-${Math.random()}`,
    description: '',
    businessIndustry: '',
    classNumber: null,
    classTitleEn: '',
    descriptionEn: '',
    descriptionEs: '',
    confidence: 0,
    isConfirmed: false,
    fallbackClasses: [],
    fallbackSuggestions: [],
  };
}

function generateCaseNumber(): string {
  const year = new Date().getFullYear();
  const rand = Math.floor(10000 + Math.random() * 90000);
  return `MTC-${year}-${rand}`;
}

function StepIndicator({ current, total, t }: { current: Step; total: number; t: (k: string) => string }) {
  const stepLabels = [
    t('form.step1'), t('form.step2'), t('form.step3'),
    t('form.step4'), t('form.step5'), t('form.step6'), t('form.step7')
  ];
  return (
    <div className="flex items-center justify-center mb-8 overflow-x-auto pb-2">
      {stepLabels.map((label, i) => {
        const num = (i + 1) as Step;
        const done = current > num;
        const active = current === num;
        return (
          <div key={i} className="flex items-center flex-shrink-0">
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                done ? 'bg-green-500 text-white' : active ? 'bg-gold-500 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                {done ? <CheckCircle2 size={14} /> : num}
              </div>
              <span className={`text-xs mt-1 hidden sm:block ${active ? 'text-gold-600 font-medium' : 'text-gray-400'}`}>
                {label}
              </span>
            </div>
            {i < total - 1 && (
              <div className={`w-8 sm:w-12 h-0.5 mx-1 mb-4 flex-shrink-0 ${done ? 'bg-green-400' : 'bg-gray-200'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Stripe checkout inner form ──────────────────────────────────────────────
interface CheckoutFormProps {
  language: string;
  finalTotal: number;
  onSuccess: () => void;
}

function CheckoutForm({ language, finalTotal, onSuccess }: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setPaying(true);
    setError(null);

    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
    });

    if (confirmError) {
      setError(confirmError.message ?? 'Payment failed. Please try again.');
      setPaying(false);
    } else {
      onSuccess();
    }
  };

  return (
    <form onSubmit={handlePay} className="space-y-4">
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <PaymentElement options={{ layout: 'tabs' }} />
      </div>

      {error && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3">
          <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || !elements || paying}
        className="w-full flex items-center justify-center gap-2 bg-gold-500 hover:bg-gold-600 disabled:opacity-60 text-white font-bold py-4 rounded-xl text-base transition-colors shadow-md"
      >
        <Lock size={16} />
        {paying
          ? (tri('Processing payment...', '处理付款中...', 'Procesando pago...', 'Zahlung wird verarbeitet...', 'Traitement du paiement...', 'भुगतान हो रहा है...', 'Processando pagamento...'))
          : (tri(`Pay USD $${finalTotal.toFixed(2)}`, `支付 USD $${finalTotal.toFixed(2)}`, `Pagar USD $${finalTotal.toFixed(2)}`, `USD $${finalTotal.toFixed(2)} bezahlen`, `Payer USD $${finalTotal.toFixed(2)}`, `USD $${finalTotal.toFixed(2)} का भुगतान करें`, `Pagar USD $${finalTotal.toFixed(2)}`))}
      </button>

      <p className="text-center text-xs text-gray-400 flex items-center justify-center gap-1">
        <Lock size={11} />
        {tri('Secured by Stripe', '由Stripe保护', 'Pago seguro vía Stripe', 'Gesichert durch Stripe', 'Sécurisé par Stripe', 'Stripe द्वारा सुरक्षित', 'Protegido pelo Stripe')}
      </p>
    </form>
  );
}
// ─────────────────────────────────────────────────────────────────────────────

export default function ApplyPage() {
  const { language, t } = useLanguage();
  // tri: helper for inline strings not yet moved to translation keys
  const tri = (en: string, zh: string, es: string, de?: string, fr?: string, hi?: string, pt?: string): string =>
    language === 'zh' ? zh : language === 'es' ? es : language === 'de' ? (de ?? en) : language === 'fr' ? (fr ?? en) : language === 'hi' ? (hi ?? en) : language === 'pt' ? (pt ?? en) : en;
  const sortedCountries = getSortedCountries(language as SupportedLang);
  const sortedDialCodes = getSortedDialCodes(language as SupportedLang);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>(1);
  const [submitting, setSubmitting] = useState(false);
  const [caseNumber, setCaseNumber] = useState('');
  const [applicationId, setApplicationId] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const activeEntryRef = useRef<HTMLDivElement>(null);

  // Stripe state
  const [stripePromise] = useState(() => {
    const key = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
    return key ? loadStripe(key) : null;
  });
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Coupon state
  const [couponInput, setCouponInput] = useState('');
  const [couponApplied, setCouponApplied] = useState<{ code: string; discountPercent: number } | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponChecking, setCouponChecking] = useState(false);
  const [finalTotal, setFinalTotal] = useState<number | null>(null);

  const [clearanceResults, setClearanceResults] = useState<Record<string, ClearanceResult>>({});
  const [showConflictModal, setShowConflictModal] = useState(false);

  const suggestedName = useRef<string>('');

  const [form, setForm] = useState<FormData>(() => {
    const suggested = sessionStorage.getItem('suggestedMarkName') || '';
    if (suggested) {
      sessionStorage.removeItem('suggestedMarkName');
      suggestedName.current = suggested;
    }
    return {
      applicantType: 'company',
      legalName: '', country: '', address: '', city: '',
      stateProvince: '', postalCode: '', email: '', emailConfirm: '',
      phoneDialCode: '', phoneNumber: '', wechat: '', whatsapp: '', taxId: '',
      contactPerson: '', preferredLanguage: language as 'en' | 'zh' | 'es' | 'de' | 'fr' | 'hi' | 'pt',
      markName: suggested, markType: 'word', containsNonSpanish: false,
      markLanguage: 'en', meaningSpanish: '', transliteration: '',
      markDescription: '', claimsColor: false, colorDescription: '',
      logoFile: null,
      classEntries: [newEntry()],
      usedInMexico: false, firstUseDate: '', priorityClaimed: false,
      priorityCountry: '', priorityAppNumber: '', priorityFilingDate: '',
      isOwner: true, knownSimilarMarks: '',
    };
  });

  const set = (updates: Partial<FormData>) => setForm(f => ({ ...f, ...updates }));

  const updateEntry = (id: string, updates: Partial<ClassEntry>) => {
    setForm(f => ({
      ...f,
      classEntries: f.classEntries.map(e => e.id === id ? { ...e, ...updates } : e),
    }));
  };

  const removeEntry = (id: string) => {
    setForm(f => ({
      ...f,
      classEntries: f.classEntries.filter(e => e.id !== id),
    }));
  };

  const addNewEntry = () => {
    setForm(f => ({ ...f, classEntries: [...f.classEntries, newEntry()] }));
    setTimeout(() => {
      activeEntryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  const confirmedEntries = form.classEntries.filter(e => e.isConfirmed || e.fallbackClasses.length > 0);
  const activeEntry = form.classEntries[form.classEntries.length - 1];
  const activeEntryIsConfirmed = activeEntry.isConfirmed || activeEntry.fallbackClasses.length > 0;

  const allSelectedClassNumbers: number[] = [];
  for (const entry of form.classEntries) {
    if (entry.isConfirmed && entry.classNumber !== null) {
      allSelectedClassNumbers.push(entry.classNumber);
    } else if (entry.fallbackClasses.length > 0) {
      allSelectedClassNumbers.push(...entry.fallbackClasses);
    }
  }
  const totalClasses = allSelectedClassNumbers.length || 1;

  const { pricePerClass, total: serviceFee } = calculatePrice(totalClasses);
  const govFee = totalClasses * 170;
  const grandTotal = serviceFee + govFee;

  const getRelatedClasses = (entryId: string): RelatedClass[] => {
    const result: RelatedClass[] = [];
    for (const entry of form.classEntries) {
      if (entry.id === entryId) break;
      if (entry.isConfirmed && entry.classNumber !== null) {
        result.push({ classNumber: entry.classNumber, titleEn: entry.classTitleEn });
      } else if (entry.fallbackClasses.length > 0) {
        for (const cn of entry.fallbackClasses) {
          const nc = ALL_CLASSES.find(c => c.classNumber === cn);
          if (nc) result.push({ classNumber: cn, titleEn: nc.titleEn });
        }
      }
    }
    return result;
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowed = ['image/png','image/jpeg','image/jpg','image/svg+xml','application/pdf'];
    if (!allowed.includes(file.type)) return;
    set({ logoFile: file });
    if (file.type !== 'application/pdf') {
      const reader = new FileReader();
      reader.onload = ev => setLogoPreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setLogoPreview(null);
    }
  };

  const handleApplyCoupon = async () => {
    const code = couponInput.trim().toUpperCase();
    if (!code) return;
    setCouponChecking(true);
    setCouponError(null);
    setCouponApplied(null);

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      // Validate by calling the edge function with a dummy preview (no applicationId)
      const res = await fetch(`${supabaseUrl}/functions/v1/validate-coupon`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Apikey': supabaseAnonKey,
        },
        body: JSON.stringify({ couponCode: code }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setCouponError(data.error || tri('Invalid coupon code.', '无效优惠码。', 'Código de descuento inválido.', 'Ungültiger Gutscheincode.', 'Code promo invalide.', 'अमान्य कूपन कोड।', 'Código de desconto inválido.'));
      } else {
        setCouponApplied({ code, discountPercent: data.discountPercent });
        setCouponInput('');
      }
    } catch {
      setCouponError(tri('Could not verify coupon. Please try again.', '无法验证优惠码，请重试。', 'No se pudo verificar el cupón. Inténtalo de nuevo.', 'Gutschein konnte nicht überprüft werden.', 'Impossible de vérifier le code promo.', 'कूपन सत्यापित नहीं हो सका।', 'Não foi possível verificar o cupom.'));
    } finally {
      setCouponChecking(false);
    }
  };

  const removeCoupon = () => {
    setCouponApplied(null);
    setCouponError(null);
    setFinalTotal(null);
  };

  const discountedTotal = couponApplied
    ? Math.max(0.50, grandTotal * (1 - couponApplied.discountPercent / 100))
    : grandTotal;

  // Called when user clicks "Proceed to Payment" — saves records, creates PaymentIntent
  const handleProceedToPayment = async () => {
    setSubmitting(true);
    setPaymentError(null);
    try {
      const cn = generateCaseNumber();
      setCaseNumber(cn);

      const { data: clientData } = await supabase.from('clients').insert({
        user_id: user?.id || null,
        applicant_type: form.applicantType,
        legal_name: form.legalName,
        country: form.country,
        address: form.address,
        city: form.city,
        state_province: form.stateProvince,
        postal_code: form.postalCode,
        email: form.email,
        phone: form.phoneDialCode ? `${form.phoneDialCode} ${form.phoneNumber}` : form.phoneNumber,
        wechat: form.wechat,
        whatsapp: form.whatsapp,
        tax_id: form.taxId,
        contact_person: form.contactPerson,
        preferred_language: form.preferredLanguage,
      }).select().maybeSingle();

      if (!clientData) throw new Error('Failed to create client record');

      const { data: appData } = await supabase.from('applications').insert({
        case_number: cn,
        client_id: clientData.id,
        user_id: user?.id || null,
        payment_status: 'pending',
        filing_status: 'pending_payment',
        total_classes: totalClasses,
        service_fee_usd: serviceFee,
        government_fee_usd: govFee,
        total_amount_usd: grandTotal,
        priority_claimed: form.priorityClaimed,
        priority_country: form.priorityCountry,
        priority_app_number: form.priorityAppNumber,
        priority_filing_date: form.priorityFilingDate || null,
        source: 'website',
      }).select().maybeSingle();

      if (!appData) throw new Error('Failed to create application record');
      setApplicationId(appData.id);

      await supabase.from('trademarks').insert({
        application_id: appData.id,
        mark_name: form.markName,
        mark_type: form.markType as 'word',
        contains_non_spanish: form.containsNonSpanish,
        mark_language: form.markLanguage,
        meaning_spanish: form.meaningSpanish,
        transliteration: form.transliteration,
        mark_description: form.markDescription,
        claims_color: form.claimsColor,
        color_description: form.colorDescription,
      });

      for (const entry of form.classEntries) {
        const classNums = entry.isConfirmed && entry.classNumber !== null
          ? [entry.classNumber]
          : entry.fallbackClasses;
        if (classNums.length === 0) continue;

        await supabase.from('goods_services').insert({
          application_id: appData.id,
          description_original: entry.description,
          original_language: form.preferredLanguage,
          business_industry: entry.businessIndustry,
          sales_channels: [],
          countries_sold: [],
          mexico_launch_status: 'planning',
        });

        for (const classNum of classNums) {
          const nc = ALL_CLASSES.find(c => c.classNumber === classNum);
          if (nc) {
            await supabase.from('trademark_classes').insert({
              application_id: appData.id,
              class_number: classNum,
              class_title_en: entry.classTitleEn || nc.titleEn,
              classification_source: entry.isConfirmed ? 'ai_classified' : 'user_selected',
              confidence_score: entry.confidence,
            });
          }
        }
      }

      // Create Stripe PaymentIntent via Edge Function
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      const res = await fetch(`${supabaseUrl}/functions/v1/create-payment-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Apikey': supabaseAnonKey,
        },
        body: JSON.stringify({
          applicationId: appData.id,
          amountUsd: grandTotal,
          markName: form.markName,
          totalClasses,
          couponCode: couponApplied?.code ?? undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.clientSecret) {
        throw new Error(data.error || 'Failed to initialize payment');
      }

      setClientSecret(data.clientSecret);
      setFinalTotal(data.finalAmountUsd ?? grandTotal);
    } catch (err) {
      console.error(err);
      setPaymentError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePaymentSuccess = () => {
    setStep(7);
  };

  const inputClass = 'w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent';
  const labelClass = 'block text-sm font-medium text-gray-700 mb-1.5';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <div className="text-center mb-8">
          <h1 className="text-2xl lg:text-3xl font-bold text-navy-900">
            {tri('File Your Mexican Trademark', '申请您的墨西哥商标', 'Registra tu Marca en México', 'Ihre Marke in Mexiko anmelden', 'Déposez votre marque au Mexique', 'अपना मेक्सिको ट्रेडमार्क दाखिल करें', 'Registre sua Marca no México')}
          </h1>
          <p className="text-gray-500 text-sm mt-2">
            {tri('Complete each step to prepare your IMPI application.', '完成每个步骤以准备您的IMPI申请。', 'Completa cada paso para preparar tu solicitud ante el IMPI.', 'Füllen Sie jeden Schritt aus, um Ihren IMPI-Antrag vorzubereiten.', 'Complétez chaque étape pour préparer votre dossier IMPI.', 'अपना IMPI आवेदन तैयार करने के लिए प्रत्येक चरण पूरा करें।', 'Complete cada etapa para preparar seu pedido no IMPI.')}
          </p>
        </div>

        {step < 7 && <StepIndicator current={step} total={7} t={t} />}

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 lg:p-8">
          {/* STEP 1 */}
          {step === 1 && (
            <div>
              <h2 className="text-lg font-bold text-navy-900 mb-6">{t('form.step1')}</h2>
              <div className="space-y-4">
                <div>
                  <label className={labelClass}>{tri('Applicant Type', '申请人类型', 'Tipo de Solicitante', 'Antragstellertyp', 'Type de déposant', 'आवेदक प्रकार', 'Tipo de Solicitante')}</label>
                  <div className="flex gap-3">
                    {['company','individual'].map(type => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => set({ applicantType: type as 'company' })}
                        className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
                          form.applicantType === type
                            ? 'border-gold-500 bg-gold-50 text-gold-700'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        {type === 'company' ? tri('Company', '公司', 'Empresa', 'Unternehmen', 'Entreprise', 'कंपनी', 'Empresa') : tri('Individual', '个人', 'Persona Física', 'Einzelperson', 'Particulier', 'व्यक्ति', 'Pessoa Física')}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className={labelClass}>{tri('Full Legal Name *', '完整法定名称 *', 'Nombre o Razón Social *', 'Vollständiger rechtlicher Name *', 'Nom légal complet *', 'पूरा कानूनी नाम *', 'Nome Legal Completo *')}</label>
                    <input type="text" required className={inputClass} value={form.legalName} onChange={e => set({ legalName: e.target.value })} />
                  </div>
                  <div>
                    <label className={labelClass}>{tri('Country *', '国家 *', 'País *', 'Land *', 'Pays *', 'देश *', 'País *')}</label>
                    <select required className={inputClass} value={form.country} onChange={e => set({ country: e.target.value })}>
                      <option value="">{tri('— Select country —', '— 选择国家 —', '— Seleccionar país —', '— Land auswählen —', '— Sélectionner un pays —', '— देश चुनें —', '— Selecionar país —')}</option>
                      {sortedCountries.map(c => (
                        <option key={c.code} value={c.code}>{c[language as SupportedLang] || c.en}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>{tri('Contact Person', '联系人', 'Persona de Contacto', 'Kontaktperson', 'Personne de contact', 'संपर्क व्यक्ति', 'Pessoa de Contato')}</label>
                    <input type="text" className={inputClass} value={form.contactPerson} onChange={e => set({ contactPerson: e.target.value })} />
                  </div>
                  <div className="sm:col-span-2">
                    <label className={labelClass}>{tri('Address', '地址', 'Domicilio', 'Adresse', 'Adresse', 'पता', 'Endereço')}</label>
                    <input type="text" className={inputClass} value={form.address} onChange={e => set({ address: e.target.value })} />
                  </div>
                  <div>
                    <label className={labelClass}>{tri('City', '城市', 'Ciudad', 'Stadt', 'Ville', 'शहर', 'Cidade')}</label>
                    <input type="text" className={inputClass} value={form.city} onChange={e => set({ city: e.target.value })} />
                  </div>
                  <div>
                    <label className={labelClass}>{tri('Postal Code', '邮政编码', 'Código Postal', 'Postleitzahl', 'Code postal', 'पिन कोड', 'CEP')}</label>
                    <input type="text" className={inputClass} value={form.postalCode} onChange={e => set({ postalCode: e.target.value })} />
                  </div>
                  <div>
                    <label className={labelClass}>{tri('Email Address *', '电子邮件 *', 'Correo Electrónico *', 'E-Mail-Adresse *', 'Adresse e-mail *', 'ईमेल पता *', 'Endereço de E-mail *')}</label>
                    <input type="email" required className={inputClass} value={form.email} onChange={e => set({ email: e.target.value })} />
                  </div>
                  <div>
                    <label className={labelClass}>{tri('Confirm Email Address *', '确认电子邮件 *', 'Confirmar Correo Electrónico *', 'E-Mail-Adresse bestätigen *', 'Confirmer l\'adresse e-mail *', 'ईमेल पता की पुष्टि करें *', 'Confirmar Endereço de E-mail *')}</label>
                    <input
                      type="email"
                      required
                      className={`${inputClass} ${form.emailConfirm && form.email !== form.emailConfirm ? 'border-red-400 focus:ring-red-400' : ''}`}
                      value={form.emailConfirm}
                      onChange={e => set({ emailConfirm: e.target.value })}
                    />
                    {form.emailConfirm && form.email !== form.emailConfirm && (
                      <p className="text-xs text-red-500 mt-1">
                        {tri('Email addresses do not match', '两次输入的电子邮件不一致', 'Los correos no coinciden', 'E-Mail-Adressen stimmen nicht überein', 'Les adresses e-mail ne correspondent pas', 'ईमेल पते मेल नहीं खाते', 'Os endereços de e-mail não coincidem')}
                      </p>
                    )}
                  </div>
                  <div className="sm:col-span-2">
                    <label className={labelClass}>{tri('Phone / WeChat / WhatsApp', '电话/微信/WhatsApp', 'Teléfono / WhatsApp', 'Telefon / WeChat / WhatsApp', 'Téléphone / WeChat / WhatsApp', 'फोन / WeChat / WhatsApp', 'Telefone / WhatsApp')}</label>
                    <div className="flex gap-2">
                      <select
                        className="border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent w-48 flex-shrink-0"
                        value={form.phoneDialCode}
                        onChange={e => set({ phoneDialCode: e.target.value })}
                      >
                        <option value="">{tri('Code', '区号', 'Código', 'Vorwahl', 'Indicatif', 'कोड', 'Código')}</option>
                        {sortedDialCodes.map(d => (
                          <option key={d.code} value={d.dialCode}>{d.name} ({d.dialCode})</option>
                        ))}
                      </select>
                      <input
                        type="tel"
                        className={`${inputClass} flex-1`}
                        placeholder={tri('Phone number', '电话号码', 'Número de teléfono', 'Telefonnummer', 'Numéro de téléphone', 'फोन नंबर', 'Número de telefone')}
                        value={form.phoneNumber}
                        onChange={e => set({ phoneNumber: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>{tri('Tax ID / Registration No.', '税号/注册号', 'RFC / Número de Registro', 'Steuer-ID / Registrierungsnr.', 'Numéro fiscal / Enregistrement', 'टैक्स ID / पंजीकरण नं.', 'CNPJ/CPF / Nº de Registro')}</label>
                    <input type="text" className={inputClass} value={form.taxId} onChange={e => set({ taxId: e.target.value })} />
                  </div>
                  <div>
                    <label className={labelClass}>{tri('Preferred Language', '首选语言', 'Idioma de Preferencia', 'Bevorzugte Sprache', 'Langue préférée', 'पसंदीदा भाषा', 'Idioma Preferido')}</label>
                    <select className={inputClass} value={form.preferredLanguage} onChange={e => set({ preferredLanguage: e.target.value as 'en' | 'zh' | 'es' | 'de' | 'fr' | 'hi' | 'pt' })}>
                      <option value="en">English</option>
                      <option value="zh">中文 (Chinese)</option>
                      <option value="es">Español (Spanish)</option>
                      <option value="de">Deutsch (German)</option>
                      <option value="fr">Français (French)</option>
                      <option value="hi">हिन्दी (Hindi)</option>
                      <option value="pt">Português (Portuguese)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div>
              <h2 className="text-lg font-bold text-navy-900 mb-6">{t('form.step2')}</h2>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-sm font-medium text-gray-700">{tri('Trademark / Word Mark *', '商标/文字商标 *', 'Nombre de Marca *', 'Marke / Wortmarke *', 'Marque / Marque verbale *', 'ट्रेडमार्क / शब्द चिह्न *', 'Marca / Marca Denominativa *')}</label>
                    <Link to="/trademark-ideas" className="flex items-center gap-1 text-xs text-gold-600 hover:text-gold-700 font-medium">
                      <Sparkles size={11} />
                      {tri('Need a name idea?', '需要名称创意？', '¿Necesitas ideas para el nombre?', 'Benötigen Sie eine Namensidee?', 'Besoin d\'une idée de nom ?', 'एक नाम विचार चाहिए?', 'Precisa de uma ideia de nome?')}
                    </Link>
                  </div>
                  {suggestedName.current && form.markName === suggestedName.current && (
                    <div className="flex items-center gap-2 bg-gold-50 border border-gold-200 rounded-lg px-3 py-2 mb-2 text-xs text-gold-700">
                      <Sparkles size={12} className="flex-shrink-0 text-gold-500" />
                      {tri(
                        `Name pre-filled from Idea Generator: "${suggestedName.current}"`,
                        `已从商标创意生成器预填充名称："${suggestedName.current}"`,
                        `Nombre pre-completado desde el Generador de Ideas: "${suggestedName.current}"`
                      )}
                    </div>
                  )}
                  <input type="text" required className={inputClass} value={form.markName} onChange={e => set({ markName: e.target.value })} />
                </div>
                <div>
                  <label className={labelClass}>{tri('Type of Mark', '商标类型', 'Tipo de Marca', 'Art der Marke', 'Type de marque', 'चिह्न का प्रकार', 'Tipo de Marca')}</label>
                  <select className={inputClass} value={form.markType} onChange={e => set({ markType: e.target.value })}>
                    <option value="word">{tri('Word Mark', '文字商标', 'Marca Denominativa', 'Wortmarke', 'Marque verbale', 'शब्द चिह्न', 'Marca Denominativa')}</option>
                    <option value="design">{tri('Design / Logo Mark', '图形/标志商标', 'Diseño / Logo', 'Design / Logomarke', 'Marque figurative / Logo', 'डिज़ाइन / लोगो चिह्न', 'Marca Figurativa / Logo')}</option>
                    <option value="combined">{tri('Combined Word + Design', '文字+图形组合', 'Denominativa + Diseño', 'Kombinierte Wort + Design', 'Marque mixte', 'संयुक्त शब्द + डिज़ाइन', 'Denominativa + Figurativa')}</option>
                    <option value="trade_name">{tri('Trade Name', '商号', 'Nombre Comercial', 'Handelsname', 'Nom commercial', 'व्यापार नाम', 'Nome Comercial')}</option>
                    <option value="slogan">{tri('Slogan / Commercial Notice', '口号/商业通告', 'Eslogan / Aviso Comercial', 'Slogan / Handelsaufschrift', 'Slogan / Enseigne commerciale', 'नारा / वाणिज्यिक सूचना', 'Slogan / Aviso Comercial')}</option>
                  </select>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>{tri('Language of the Mark', '商标语言', 'Idioma de la Marca', 'Sprache der Marke', 'Langue de la marque', 'चिह्न की भाषा', 'Idioma da Marca')}</label>
                    <select className={inputClass} value={form.markLanguage} onChange={e => set({ markLanguage: e.target.value })}>
                      <option value="en">English</option>
                      <option value="zh">中文 (Chinese)</option>
                      <option value="es">Español (Spanish)</option>
                      <option value="de">Deutsch (German)</option>
                      <option value="fr">Français (French)</option>
                      <option value="hi">हिन्दी (Hindi)</option>
                      <option value="pt">Português (Portuguese)</option>
                      <option value="other">{tri('Other / No Language', '其他/无语言', 'Otro / Sin Idioma', 'Andere / Keine Sprache', 'Autre / Aucune langue', 'अन्य / कोई भाषा नहीं', 'Outro / Sem Idioma')}</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-3 pt-6">
                    <input
                      type="checkbox"
                      id="nonSpanish"
                      checked={form.containsNonSpanish}
                      onChange={e => set({ containsNonSpanish: e.target.checked })}
                      className="rounded border-gray-300 text-gold-500 focus:ring-gold-400"
                    />
                    <label htmlFor="nonSpanish" className="text-sm text-gray-700">
                      {tri('Contains non-Spanish words', '包含非西班牙语词汇', 'Contiene palabras en otro idioma', 'Enthält nicht-spanische Wörter', 'Contient des mots non espagnols', 'गैर-स्पेनिश शब्द शामिल हैं', 'Contém palavras não espanholas')}
                    </label>
                  </div>
                </div>
                {(form.containsNonSpanish || form.markLanguage === 'zh') && (
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>{tri('Meaning in Spanish', '西班牙语含义', 'Significado en Español', 'Bedeutung auf Spanisch', 'Signification en espagnol', 'स्पेनिश में अर्थ', 'Significado em Espanhol')}</label>
                      <input type="text" className={inputClass} value={form.meaningSpanish} onChange={e => set({ meaningSpanish: e.target.value })} />
                    </div>
                    <div>
                      <label className={labelClass}>{tri('Transliteration (if Chinese)', '音译（如为中文）', 'Transliteración (si aplica)')}</label>
                      <input type="text" className={inputClass} value={form.transliteration} onChange={e => set({ transliteration: e.target.value })} />
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="claimsColor"
                    checked={form.claimsColor}
                    onChange={e => set({ claimsColor: e.target.checked })}
                    className="rounded border-gray-300 text-gold-500 focus:ring-gold-400"
                  />
                  <label htmlFor="claimsColor" className="text-sm text-gray-700">
                    {tri('Claiming specific colors', '声明特定颜色', 'Reivindica colores específicos', 'Beansprucht spezifische Farben', 'Revendique des couleurs spécifiques', 'विशिष्ट रंगों का दावा', 'Reivindica cores específicas')}
                  </label>
                </div>
                {form.claimsColor && (
                  <div>
                    <label className={labelClass}>{tri('Color Description', '颜色描述', 'Descripción de Colores', 'Farbbeschreibung', 'Description des couleurs', 'रंग विवरण', 'Descrição de Cores')}</label>
                    <input type="text" className={inputClass} value={form.colorDescription} onChange={e => set({ colorDescription: e.target.value })} placeholder={tri('e.g. Red and gold', '例如：红色和金色', 'p.ej. Rojo y dorado', 'z.B. Rot und Gold', 'ex. Rouge et or', 'उदा. लाल और सुनहरा', 'ex. Vermelho e dourado')} />
                  </div>
                )}
                <div>
                  <label className={labelClass}>{tri('Upload Logo / Design File', '上传标志/设计文件', 'Subir Logo / Archivo de Diseño', 'Logo / Designdatei hochladen', 'Télécharger logo / fichier design', 'लोगो / डिज़ाइन फ़ाइल अपलोड करें', 'Enviar Logo / Arquivo de Design')}</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:border-gold-400 transition-colors">
                    {logoPreview ? (
                      <div className="relative inline-block">
                        <img src={logoPreview} alt="Logo preview" className="max-h-24 max-w-full rounded" />
                        <button
                          type="button"
                          onClick={() => { set({ logoFile: null }); setLogoPreview(null); }}
                          className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ) : form.logoFile ? (
                      <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                        <span>{form.logoFile.name}</span>
                        <button type="button" onClick={() => set({ logoFile: null })} className="text-red-500 hover:text-red-600">
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <label className="cursor-pointer">
                        <Upload size={20} className="mx-auto mb-2 text-gray-400" />
                        <span className="text-sm text-gray-500">
                          {tri('PNG, JPG, JPEG, PDF, SVG (max 10MB)', 'PNG、JPG、JPEG、PDF、SVG（最大10MB）', 'PNG, JPG, PDF, SVG (máx. 10MB)')}
                        </span>
                        <input type="file" className="hidden" accept=".png,.jpg,.jpeg,.pdf,.svg" onChange={handleLogoChange} />
                      </label>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div>
              <h2 className="text-lg font-bold text-navy-900 mb-1">{t('form.step3')}</h2>
              <p className="text-sm text-gray-500 mb-6">
                {tri('Describe the goods or services for each Nice Classification class you want to protect. Add as many classes as needed.', '描述每个您希望保护的尼斯分类类别的商品或服务。可以添加任意数量的类别。', 'Describe los bienes o servicios para cada clase de la Clasificación de Niza. Agrega tantas clases como necesites.', 'Beschreiben Sie die Waren oder Dienstleistungen für jede Nizza-Klasse. Fügen Sie so viele Klassen wie nötig hinzu.', 'Décrivez les produits ou services pour chaque classe de Nice. Ajoutez autant de classes que nécessaire.', 'प्रत्येक नाइस वर्गीकरण कक्षा के लिए वस्तुओं या सेवाओं का वर्णन करें। जितनी जरूरत हो उतनी कक्षाएं जोड़ें।', 'Descreva os bens ou serviços para cada classe de Nice. Adicione quantas classes forem necessárias.')}
              </p>

              {confirmedEntries.length > 0 && (
                <div className="space-y-2 mb-6">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    {tri('Confirmed Classes', '已确认类别', 'Clases Confirmadas', 'Bestätigte Klassen', 'Classes confirmées', 'पुष्टि की गई कक्षाएं', 'Classes Confirmadas')}
                  </p>
                  {form.classEntries.filter(e => (e.isConfirmed || e.fallbackClasses.length > 0) && e.id !== activeEntry.id).map((entry) => {
                    const classNums = entry.isConfirmed && entry.classNumber !== null
                      ? [entry.classNumber]
                      : entry.fallbackClasses;
                    return (
                      <div key={entry.id}>
                        <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
                          <CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              {classNums.map(cn => {
                                const nc = ALL_CLASSES.find(c => c.classNumber === cn);
                                return (
                                  <span key={cn} className="text-xs font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                                    Class {cn}{nc ? ` — ${nc.titleEn}` : ''}
                                  </span>
                                );
                              })}
                            </div>
                            {entry.description && (
                              <p className="text-xs text-gray-500 mt-1 truncate">{entry.description}</p>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => removeEntry(entry.id)}
                            className="flex-shrink-0 text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                        {form.markName.trim() && classNums.length > 0 && (
                          <TrademarkClearancePanel
                            markName={form.markName}
                            classes={classNums}
                            language={(language === 'zh' ? 'zh' : language === 'es' ? 'es' : language === 'de' ? 'de' : language === 'fr' ? 'fr' : language === 'hi' ? 'hi' : language === 'pt' ? 'pt' : 'en') as 'en' | 'zh' | 'es' | 'de' | 'fr' | 'hi' | 'pt'}
                            autoRun={true}
                            onResult={r => setClearanceResults(prev => ({ ...prev, [entry.id]: r }))}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              <div ref={activeEntryRef}>
                {activeEntryIsConfirmed ? (
                  <div className="space-y-4">
                    {(() => {
                      const classNums = activeEntry.isConfirmed && activeEntry.classNumber !== null
                        ? [activeEntry.classNumber]
                        : activeEntry.fallbackClasses;
                      return (
                        <div>
                          <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
                            <CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                {classNums.map(cn => {
                                  const nc = ALL_CLASSES.find(c => c.classNumber === cn);
                                  return (
                                    <span key={cn} className="text-xs font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                                      Class {cn}{nc ? ` — ${nc.titleEn}` : ''}
                                    </span>
                                  );
                                })}
                              </div>
                              {activeEntry.description && (
                                <p className="text-xs text-gray-500 mt-1 truncate">{activeEntry.description}</p>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => removeEntry(activeEntry.id)}
                              className="flex-shrink-0 text-gray-400 hover:text-red-500 transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                          {form.markName.trim() && classNums.length > 0 && (
                            <TrademarkClearancePanel
                              markName={form.markName}
                              classes={classNums}
                              language={(language === 'zh' ? 'zh' : language === 'es' ? 'es' : language === 'de' ? 'de' : language === 'fr' ? 'fr' : language === 'hi' ? 'hi' : language === 'pt' ? 'pt' : 'en') as 'en' | 'zh' | 'es' | 'de' | 'fr' | 'hi' | 'pt'}
                              autoRun={true}
                              onResult={r => setClearanceResults(prev => ({ ...prev, [activeEntry.id]: r }))}
                            />
                          )}
                        </div>
                      );
                    })()}
                    <button
                      type="button"
                      onClick={addNewEntry}
                      className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-gold-300 hover:border-gold-500 text-gold-600 hover:text-gold-700 font-semibold py-4 rounded-xl text-sm transition-all hover:bg-gold-50"
                    >
                      <Plus size={16} />
                      {tri('Add Another Class', '添加另一个类别', 'Agregar Otra Clase', 'Weitere Klasse hinzufügen', 'Ajouter une autre classe', 'एक और कक्षा जोड़ें', 'Adicionar Outra Classe')}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {confirmedEntries.length > 0 && (
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 rounded-full bg-navy-900 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                          {confirmedEntries.length + 1}
                        </div>
                        <span className="text-sm font-semibold text-navy-900">
                          {tri(`Class ${confirmedEntries.length + 1}`, `第 ${confirmedEntries.length + 1} 类`, `Clase ${confirmedEntries.length + 1}`, `Klasse ${confirmedEntries.length + 1}`, `Classe ${confirmedEntries.length + 1}`, `वर्ग ${confirmedEntries.length + 1}`, `Classe ${confirmedEntries.length + 1}`)}
                        </span>
                      </div>
                    )}
                    <AIDescriptionAssistant
                      key={activeEntry.id}
                      language={(language === 'zh' ? 'zh' : language === 'es' ? 'es' : language === 'de' ? 'de' : language === 'fr' ? 'fr' : language === 'hi' ? 'hi' : language === 'pt' ? 'pt' : 'en') as 'en' | 'zh' | 'es' | 'de' | 'fr' | 'hi' | 'pt'}
                      initialDescription={activeEntry.description}
                      businessIndustry={activeEntry.businessIndustry}
                      onDescriptionChange={desc => updateEntry(activeEntry.id, { description: desc })}
                      onIndustryChange={ind => updateEntry(activeEntry.id, { businessIndustry: ind })}
                      onClassesAccepted={(nums, descEn, descEs) => {
                        if (nums.length === 0) return;
                        const primaryClass = nums[0];
                        const nc = ALL_CLASSES.find(c => c.classNumber === primaryClass);
                        updateEntry(activeEntry.id, {
                          classNumber: primaryClass,
                          classTitleEn: nc?.titleEn || '',
                          descriptionEn: descEn[primaryClass] || '',
                          descriptionEs: descEs[primaryClass] || '',
                          confidence: 0.9,
                          isConfirmed: true,
                        });
                      }}
                      onFallbackSuggestions={suggestions => updateEntry(activeEntry.id, { fallbackSuggestions: suggestions })}
                      selectedClasses={
                        activeEntry.isConfirmed && activeEntry.classNumber !== null
                          ? [activeEntry.classNumber]
                          : activeEntry.fallbackClasses
                      }
                      onToggleClass={num => {
                        const current = activeEntry.fallbackClasses;
                        const updated = current.includes(num)
                          ? current.filter(n => n !== num)
                          : [...current, num];
                        updateEntry(activeEntry.id, { fallbackClasses: updated });
                      }}
                      relatedClasses={getRelatedClasses(activeEntry.id)}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 4 */}
          {step === 4 && (
            <div>
              <h2 className="text-lg font-bold text-navy-900 mb-6">{t('form.step4')}</h2>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <input type="checkbox" id="usedInMexico" checked={form.usedInMexico} onChange={e => set({ usedInMexico: e.target.checked })} className="rounded border-gray-300 text-gold-500" />
                  <label htmlFor="usedInMexico" className="text-sm text-gray-700">
                    {tri('This mark is already used in Mexico', '该商标已在墨西哥使用', 'Esta marca ya se usa en México', 'Diese Marke wird bereits in Mexiko verwendet', 'Cette marque est déjà utilisée au Mexique', 'यह चिह्न पहले से मेक्सिको में उपयोग हो रहा है', 'Esta marca já é usada no México')}
                  </label>
                </div>
                {form.usedInMexico && (
                  <div>
                    <label className={labelClass}>{tri('First Use Date in Mexico', '在墨西哥首次使用日期', 'Fecha de Primer Uso en México', 'Erstes Verwendungsdatum in Mexiko', 'Date de première utilisation au Mexique', 'मेक्सिको में पहले उपयोग की तारीख', 'Data do Primeiro Uso no México')}</label>
                    <input type="date" className={inputClass} value={form.firstUseDate} onChange={e => set({ firstUseDate: e.target.value })} />
                  </div>
                )}
                <div className="flex items-center gap-3 mt-2">
                  <input type="checkbox" id="priorityClaimed" checked={form.priorityClaimed} onChange={e => set({ priorityClaimed: e.target.checked })} className="rounded border-gray-300 text-gold-500" />
                  <label htmlFor="priorityClaimed" className="text-sm text-gray-700">
                    {tri('Claiming priority from a foreign application', '声明来自外国申请的优先权', 'Reclama prioridad de una solicitud extranjera', 'Priorität aus einer ausländischen Anmeldung beanspruchen', 'Revendique la priorité d\'une demande étrangère', 'विदेशी आवेदन से प्राथमिकता का दावा', 'Reivindicando prioridade de um pedido estrangeiro')}
                  </label>
                </div>
                {form.priorityClaimed && (
                  <div className="grid sm:grid-cols-2 gap-4 pl-6">
                    <div>
                      <label className={labelClass}>{tri('Priority Country', '优先权国家', 'País de Prioridad', 'Prioritätsland', 'Pays de priorité', 'प्राथमिकता देश', 'País de Prioridade')}</label>
                      <input type="text" className={inputClass} value={form.priorityCountry} onChange={e => set({ priorityCountry: e.target.value })} />
                    </div>
                    <div>
                      <label className={labelClass}>{tri('Application Number', '申请号', 'Número de Solicitud', 'Antragsnummer', 'Numéro de demande', 'आवेदन नंबर', 'Número do Pedido')}</label>
                      <input type="text" className={inputClass} value={form.priorityAppNumber} onChange={e => set({ priorityAppNumber: e.target.value })} />
                    </div>
                    <div>
                      <label className={labelClass}>{tri('Filing Date', '申请日期', 'Fecha de Presentación', 'Einreichungsdatum', 'Date de dépôt', 'दाखिल तारीख', 'Data de Protocolo')}</label>
                      <input type="date" className={inputClass} value={form.priorityFilingDate} onChange={e => set({ priorityFilingDate: e.target.value })} />
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3 mt-2">
                  <input type="checkbox" id="isOwner" checked={form.isOwner} onChange={e => set({ isOwner: e.target.checked })} className="rounded border-gray-300 text-gold-500" />
                  <label htmlFor="isOwner" className="text-sm text-gray-700">
                    {tri('I confirm I am the owner of this mark', '我确认我是该商标的所有人', 'Confirmo que soy el titular de esta marca', 'Ich bestätige, dass ich der Inhaber dieser Marke bin', 'Je confirme être le titulaire de cette marque', 'मैं पुष्टि करता/करती हूं कि मैं इस चिह्न का मालिक हूं', 'Confirmo que sou o titular desta marca')}
                  </label>
                </div>
                <div>
                  <label className={labelClass}>{tri('Any Known Similar Marks? (Optional)', '已知任何类似商标？（可选）', '¿Marcas similares conocidas? (Opcional)')}</label>
                  <textarea rows={2} className={inputClass} value={form.knownSimilarMarks} onChange={e => set({ knownSimilarMarks: e.target.value })} />
                </div>
              </div>
            </div>
          )}

          {/* STEP 5 — Review */}
          {step === 5 && (
            <div>
              <h2 className="text-lg font-bold text-navy-900 mb-6">{t('form.step5')}</h2>
              <div className="space-y-4">
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200">
                    <span className="text-sm font-semibold text-navy-900">{tri('Applicant', '申请人', 'Solicitante', 'Antragsteller', 'Déposant', 'आवेदक', 'Solicitante')}</span>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {[
                      { label: tri('Legal Name', '法定名称', 'Nombre o Razón Social', 'Rechtlicher Name', 'Nom légal', 'कानूनी नाम', 'Nome Legal'), val: form.legalName },
                      { label: tri('Country', '国家', 'País', 'Land', 'Pays', 'देश', 'País'), val: form.country ? (sortedCountries.find(c => c.code === form.country)?.[language as SupportedLang] || form.country) : '' },
                      { label: tri('Email', '电子邮件', 'Correo', 'E-Mail', 'E-mail', 'ईमेल', 'E-mail'), val: form.email },
                    ].map((row, ri) => (
                      <div key={ri} className="flex px-4 py-2.5 gap-4">
                        <span className="text-xs text-gray-500 w-32 flex-shrink-0">{row.label}</span>
                        <span className="text-sm text-gray-800">{row.val || '—'}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200">
                    <span className="text-sm font-semibold text-navy-900">{tri('Trademark', '商标', 'Marca', 'Marke', 'Marque', 'ट्रेडमार्क', 'Marca')}</span>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {[
                      { label: tri('Mark Name', '商标名称', 'Nombre de Marca', 'Markenname', 'Nom de marque', 'चिह्न का नाम', 'Nome da Marca'), val: form.markName },
                      { label: tri('Mark Type', '商标类型', 'Tipo de Marca', 'Markentyp', 'Type de marque', 'चिह्न का प्रकार', 'Tipo de Marca'), val: form.markType },
                      { label: tri('Language', '语言', 'Idioma', 'Sprache', 'Langue', 'भाषा', 'Idioma'), val: form.markLanguage },
                    ].map((row, ri) => (
                      <div key={ri} className="flex px-4 py-2.5 gap-4">
                        <span className="text-xs text-gray-500 w-32 flex-shrink-0">{row.label}</span>
                        <span className="text-sm text-gray-800">{row.val || '—'}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200 flex items-center justify-between">
                    <span className="text-sm font-semibold text-navy-900">{tri('Goods & Services', '商品和服务', 'Bienes y Servicios', 'Waren & Dienstleistungen', 'Produits & services', 'वस्तुएं और सेवाएं', 'Bens e Serviços')}</span>
                    <span className="text-xs text-gray-500">{totalClasses} {tri('class(es)', '个类别', 'clase(s)')}</span>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {form.classEntries.map((entry) => {
                      const classNums = entry.isConfirmed && entry.classNumber !== null
                        ? [entry.classNumber]
                        : entry.fallbackClasses;
                      if (classNums.length === 0) return null;
                      return (
                        <div key={entry.id} className="px-4 py-3">
                          <div className="flex items-start gap-3">
                            <div className="flex flex-wrap gap-1.5 flex-1">
                              {classNums.map(cn => {
                                const nc = ALL_CLASSES.find(c => c.classNumber === cn);
                                return (
                                  <span key={cn} className="text-xs font-bold bg-navy-100 text-navy-700 px-2 py-0.5 rounded-full">
                                    Class {cn}{nc ? ` — ${nc.titleEn}` : ''}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                          {entry.description && (
                            <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">{entry.description}</p>
                          )}
                          {entry.descriptionEn && (
                            <p className="text-xs text-gray-600 mt-1 italic">{entry.descriptionEn}</p>
                          )}
                        </div>
                      );
                    })}
                    {totalClasses === 0 && (
                      <div className="px-4 py-3 text-sm text-gray-400">
                        {tri('No classes selected', '未选择类别', 'Sin clases seleccionadas', 'Keine Klassen ausgewählt', 'Aucune classe sélectionnée', 'कोई कक्षा नहीं चुनी', 'Nenhuma classe selecionada')}
                      </div>
                    )}
                  </div>
                </div>

                {Object.keys(clearanceResults).length > 0 && (
                  <div className="border border-gray-200 rounded-xl overflow-hidden">
                    <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200 flex items-center justify-between">
                      <span className="text-sm font-semibold text-navy-900">{tri('Clearance Check Summary', '商标检索摘要', 'Resumen de Búsqueda de Disponibilidad', 'Zusammenfassung der Markenrecherche', 'Résumé de la vérification de disponibilité', 'क्लीयरेंस जांच सारांश', 'Resumo da Verificação de Disponibilidade')}</span>
                    </div>
                    <div className="divide-y divide-gray-100">
                      {Object.entries(clearanceResults).map(([entryId, res]) => {
                        const entry = form.classEntries.find(e => e.id === entryId);
                        const classNums = entry
                          ? entry.isConfirmed && entry.classNumber !== null ? [entry.classNumber] : entry.fallbackClasses
                          : [];
                        const riskColors = { low: 'text-emerald-700 bg-emerald-100', medium: 'text-amber-700 bg-amber-100', high: 'text-red-700 bg-red-100' };
                        return (
                          <div key={entryId} className="flex items-center gap-3 px-4 py-2.5">
                            <div className="flex flex-wrap gap-1 flex-1">
                              {classNums.map(cn => (
                                <span key={cn} className="text-xs font-medium text-gray-600">Class {cn}</span>
                              ))}
                            </div>
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${riskColors[res.risk]}`}>
                              {res.risk === 'low'
                                ? (tri('Low risk', '低风险', 'Riesgo bajo', 'Niedriges Risiko', 'Risque faible', 'कम जोखिम', 'Baixo risco'))
                                : res.risk === 'medium'
                                ? (tri('Medium risk', '中等风险', 'Riesgo medio', 'Mittleres Risiko', 'Risque modéré', 'मध्यम जोखिम', 'Risco médio'))
                                : (tri('High risk', '高风险', 'Riesgo alto', 'Hohes Risiko', 'Risque élevé', 'उच्च जोखिम', 'Alto risco'))}
                            </span>
                            <span className="text-xs text-gray-400">
                              {res.marciaFindings.length + res.webFindings.length} {tri('findings', '条结果', 'resultados', 'Ergebnisse', 'résultats', 'परिणाम', 'resultados')}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <p className="text-xs text-amber-800 font-medium">
                    {tri('Spanish translation status: Pending admin review. Our team will review and confirm all translations before filing.', '西班牙语翻译状态：待管理员审查。我们的团队将在提交前审查并确认所有翻译。', 'Estado de redacción en español: Pendiente de revisión. Nuestro equipo revisará y confirmará la redacción antes de presentar la solicitud.', 'Status der spanischen Übersetzung: Ausstehende Prüfung. Unser Team prüft und bestätigt alle Übersetzungen vor der Einreichung.', 'Statut de la traduction espagnole : Révision en attente. Notre équipe examinera et confirmera toutes les traductions avant le dépôt.', 'स्पेनिश अनुवाद स्थिति: व्यवस्थापक समीक्षा लंबित। हमारी टीम दाखिल करने से पहले सभी अनुवादों की समीक्षा करेगी।', 'Status da tradução para espanhol: Revisão pendente. Nossa equipe revisará e confirmará todas as traduções antes do protocolo.')}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 6 — Payment */}
          {step === 6 && (
            <div>
              <h2 className="text-lg font-bold text-navy-900 mb-6">{t('form.step6')}</h2>

              {/* Order summary — always visible */}
              <div className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden mb-6">
                <div className="px-5 py-3 border-b border-gray-200 bg-white flex items-center gap-2">
                  <CreditCard size={16} className="text-gray-400" />
                  <span className="text-sm font-semibold text-navy-900">
                    {tri('Order Summary', '订单摘要', 'Resumen del Pedido', 'Bestellübersicht', 'Récapitulatif de commande', 'ऑर्डर सारांश', 'Resumo do Pedido')}
                  </span>
                </div>
                <div className="divide-y divide-gray-100">
                  <div className="flex justify-between px-5 py-3">
                    <span className="text-sm text-gray-600">
                      {tri(`${totalClasses} class${totalClasses !== 1 ? 'es' : ''} × USD $${pricePerClass} (service fee)`, `${totalClasses} 个类别 × USD $${pricePerClass}（服务费）`, `${totalClasses} clase${totalClasses !== 1 ? 's' : ''} × USD $${pricePerClass} (honorarios)`, `${totalClasses} Klasse${totalClasses !== 1 ? 'n' : ''} × USD $${pricePerClass} (Servicegebühr)`, `${totalClasses} classe${totalClasses !== 1 ? 's' : ''} × USD $${pricePerClass} (frais de service)`, `${totalClasses} वर्ग × USD $${pricePerClass} (सेवा शुल्क)`, `${totalClasses} classe${totalClasses !== 1 ? 's' : ''} × USD $${pricePerClass} (taxa de serviço)`)}
                    </span>
                    <span className="text-sm font-medium">USD ${serviceFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between px-5 py-3">
                    <span className="text-sm text-gray-600">
                      {tri('IMPI Government Fees (est.)', 'IMPI官方费用（估计）', 'Tasas Oficiales IMPI (est.)')}
                    </span>
                    <span className="text-sm font-medium">USD ${govFee.toFixed(2)}</span>
                  </div>

                  {/* Coupon row */}
                  {couponApplied && (
                    <div className="flex justify-between items-center px-5 py-3 bg-emerald-50">
                      <span className="flex items-center gap-1.5 text-sm text-emerald-700 font-medium">
                        <Tag size={14} />
                        {tri('Discount', '折扣', 'Descuento', 'Rabatt', 'Remise', 'छूट', 'Desconto')}
                        <span className="font-mono text-xs bg-emerald-100 border border-emerald-200 rounded px-1.5 py-0.5">{couponApplied.code}</span>
                        <span className="text-xs">(-{couponApplied.discountPercent}%)</span>
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-emerald-700">
                          -USD ${(grandTotal - discountedTotal).toFixed(2)}
                        </span>
                        {!clientSecret && (
                          <button type="button" onClick={removeCoupon} className="text-emerald-500 hover:text-red-500 transition-colors">
                            <X size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between px-5 py-4 bg-white">
                    <span className="text-base font-bold text-navy-900">
                      {tri('Total Due', '应付总额', 'Total a Pagar', 'Gesamtbetrag fällig', 'Total à payer', 'कुल देय', 'Total a Pagar')}
                    </span>
                    <div className="text-right">
                      {couponApplied && (
                        <div className="text-sm text-gray-400 line-through">USD ${grandTotal.toFixed(2)}</div>
                      )}
                      <span className="text-base font-bold text-navy-900">USD ${discountedTotal.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="px-5 pb-4 pt-1">
                    <p className="text-xs font-bold text-emerald-700">
                      {tri('Our prices already include all applicable taxes', '我们的价格已包含所有适用税费', 'Nuestros precios ya incluyen todos los impuestos aplicables', 'Unsere Preise beinhalten bereits alle anfallenden Steuern', 'Nos prix incluent déjà toutes les taxes applicables', 'हमारी कीमतों में पहले से ही सभी लागू कर शामिल हैं', 'Nossos preços já incluem todos os impostos aplicáveis')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Coupon input — only shown before payment is initiated */}
              {!clientSecret && (
                <div className="mb-6">
                  {!couponApplied ? (
                    <div className="space-y-2">
                      <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
                        <Tag size={14} className="text-gray-400" />
                        {tri('Have a discount code?', '有优惠码？', '¿Tienes un código de descuento?', 'Haben Sie einen Gutscheincode?', 'Vous avez un code promo ?', 'डिस्काउंट कोड है?', 'Tem um código de desconto?')}
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={couponInput}
                          onChange={e => { setCouponInput(e.target.value); setCouponError(null); }}
                          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleApplyCoupon(); } }}
                          placeholder={tri('Enter code', '输入优惠码', 'Ingresa el código', 'Code eingeben', 'Entrer le code', 'कोड दर्ज करें', 'Inserir código')}
                          className="flex-1 border border-gray-300 rounded-xl px-4 py-2.5 text-sm uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent"
                        />
                        <button
                          type="button"
                          onClick={handleApplyCoupon}
                          disabled={couponChecking || !couponInput.trim()}
                          className="flex items-center gap-2 bg-navy-900 hover:bg-navy-800 disabled:opacity-50 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors whitespace-nowrap"
                        >
                          {couponChecking
                            ? <Loader2 size={14} className="animate-spin" />
                            : <Tag size={14} />}
                          {tri('Apply', '应用', 'Aplicar', 'Anwenden', 'Appliquer', 'लागू करें', 'Aplicar')}
                        </button>
                      </div>
                      {couponError && (
                        <p className="flex items-center gap-1.5 text-xs text-red-600">
                          <AlertCircle size={12} />
                          {couponError}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
                      <CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0" />
                      <p className="text-sm text-emerald-700 font-medium flex-1">
                        {tri(
                          `Code "${couponApplied.code}" applied — ${couponApplied.discountPercent}% off!`,
                          `优惠码 "${couponApplied.code}" 已应用 — 优惠 ${couponApplied.discountPercent}%！`,
                          `Código "${couponApplied.code}" aplicado — ${couponApplied.discountPercent}% de descuento!`,
                          `Code "${couponApplied.code}" angewendet — ${couponApplied.discountPercent}% Rabatt!`,
                          `Code "${couponApplied.code}" appliqué — ${couponApplied.discountPercent}% de remise !`,
                          `कोड "${couponApplied.code}" लागू — ${couponApplied.discountPercent}% छूट!`,
                          `Código "${couponApplied.code}" aplicado — ${couponApplied.discountPercent}% de desconto!`
                        )}
                      </p>
                      <button type="button" onClick={removeCoupon} className="text-emerald-400 hover:text-red-500 transition-colors flex-shrink-0">
                        <X size={16} />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Payment section — either "proceed" button or Stripe Element */}
              {!clientSecret ? (
                <div className="space-y-4">
                  <div className="bg-navy-50 rounded-xl p-4 border border-navy-100">
                    <p className="text-xs text-navy-700">
                      {tri('Payment is processed securely via Stripe. By proceeding, you agree to our Terms of Service. Filing target is 24 business hours after payment confirmation.', '付款通过Stripe安全处理。继续即表示您同意我们的服务条款。申请目标是付款确认后24个工作小时。', 'El pago se procesa de forma segura vía Stripe. Al continuar, aceptas nuestros Términos de Servicio. El objetivo de presentación es de 24 horas hábiles tras la confirmación del pago.', 'Die Zahlung erfolgt sicher über Stripe. Durch Fortfahren stimmen Sie unseren Nutzungsbedingungen zu. Einreichungsziel sind 24 Geschäftsstunden nach Zahlungsbestätigung.', 'Le paiement est traité en toute sécurité via Stripe. En continuant, vous acceptez nos Conditions d\'utilisation. Objectif de dépôt : 24 heures ouvrées après confirmation du paiement.', 'भुगतान Stripe के माध्यम से सुरक्षित रूप से संसाधित होता है। आगे बढ़कर आप हमारी सेवा शर्तों से सहमत होते हैं। दाखिल लक्ष्य भुगतान पुष्टि के 24 व्यावसायिक घंटे बाद है।', 'O pagamento é processado com segurança via Stripe. Ao prosseguir, você concorda com nossos Termos de Serviço. Meta de protocolo: 24 horas úteis após a confirmação do pagamento.')}
                    </p>
                  </div>

                  {paymentError && (
                    <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3">
                      <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-red-700">{paymentError}</p>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleProceedToPayment}
                    disabled={submitting}
                    className="w-full flex items-center justify-center gap-2 bg-gold-500 hover:bg-gold-600 disabled:opacity-60 text-white font-bold py-4 rounded-xl text-base transition-colors shadow-md"
                  >
                    <Lock size={16} />
                    {submitting
                      ? (tri('Preparing payment...', '准备付款中...', 'Preparando pago...', 'Zahlung wird vorbereitet...', 'Préparation du paiement...', 'भुगतान तैयार हो रहा है...', 'Preparando pagamento...'))
                      : (tri(`Proceed to Payment — USD $${discountedTotal.toFixed(2)}`, `前往付款 — USD $${discountedTotal.toFixed(2)}`, `Proceder al Pago — USD $${discountedTotal.toFixed(2)}`, `Zur Zahlung — USD $${discountedTotal.toFixed(2)}`, `Procéder au Paiement — USD $${discountedTotal.toFixed(2)}`, `भुगतान करें — USD $${discountedTotal.toFixed(2)}`, `Prosseguir para Pagamento — USD $${discountedTotal.toFixed(2)}`))}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-sm text-gray-600 font-medium">
                      {tri('Enter your payment details below', '请在下方输入您的付款信息', 'Ingresa los datos de tu tarjeta a continuación', 'Geben Sie unten Ihre Zahlungsdetails ein', 'Saisissez vos coordonnées de paiement ci-dessous', 'नीचे अपना भुगतान विवरण दर्ज करें', 'Insira seus dados de pagamento abaixo')}
                    </span>
                  </div>

                  {stripePromise ? (
                    <Elements
                      stripe={stripePromise}
                      options={{
                        clientSecret,
                        appearance: {
                          theme: 'stripe',
                          variables: {
                            colorPrimary: '#B8952A',
                            colorBackground: '#ffffff',
                            borderRadius: '12px',
                            fontFamily: 'inherit',
                          },
                        },
                      }}
                    >
                      <CheckoutForm
                        language={language}
                        finalTotal={finalTotal ?? discountedTotal}
                        onSuccess={handlePaymentSuccess}
                      />
                    </Elements>
                  ) : (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                      <p className="text-sm text-amber-800">
                        {tri('Payment system is not configured yet. Please contact us to complete your filing.', '付款系统尚未配置。请联系我们完成您的申请。', 'El sistema de pago no está configurado. Por favor contáctanos para completar tu registro.', 'Zahlungssystem noch nicht konfiguriert. Bitte kontaktieren Sie uns.', 'Système de paiement non configuré. Veuillez nous contacter.', 'भुगतान प्रणाली अभी तक कॉन्फ़िगर नहीं है। कृपया हमसे संपर्क करें।', 'Sistema de pagamento não configurado. Por favor, entre em contato conosco.')}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* STEP 7 — Confirmation */}
          {step === 7 && (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
                <CheckCircle2 size={36} className="text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-navy-900 mb-3">
                {tri('Payment Confirmed!', '付款已确认！', '¡Pago Confirmado!', 'Zahlung bestätigt!', 'Paiement confirmé !', 'भुगतान की पुष्टि हुई!', 'Pagamento Confirmado!')}
              </h2>
              {caseNumber && (
                <div className="bg-gray-100 rounded-xl px-5 py-3 inline-block mb-5">
                  <div className="text-xs text-gray-500 mb-0.5">{tri('Your Case Number', '您的案件编号', 'Tu Número de Expediente', 'Ihre Fallnummer', 'Votre numéro de dossier', 'आपका केस नंबर', 'Seu Número de Processo')}</div>
                  <div className="text-lg font-bold font-mono text-navy-900">{caseNumber}</div>
                </div>
              )}
              <p className="text-gray-600 text-sm leading-relaxed max-w-lg mx-auto mb-6">
                {tri('Thank you — your payment has been received and your trademark filing is confirmed. Our team will review your application, confirm classification, translate into Spanish, and target filing before IMPI within 24 business hours.', '感谢您——我们已收到您的付款，您的商标申请已确认。我们的团队将在24个工作小时内审查您的申请、确认分类、翻译成西班牙语并向IMPI提交。', 'Gracias — hemos recibido tu pago y tu solicitud de registro de marca está confirmada. Nuestro equipo revisará tu solicitud, confirmará la clasificación y presentará ante el IMPI en 24 horas hábiles.')}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={() => navigate(user ? '/dashboard' : '/login')}
                  className="inline-flex items-center justify-center gap-2 bg-gold-500 hover:bg-gold-600 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
                >
                  <ChevronRight size={18} />
                  {user ? tri('Go to Dashboard', '前往仪表板', 'Ir al Panel', 'Zum Dashboard', 'Aller au tableau de bord', 'डैशबोर्ड पर जाएं', 'Ir ao Painel') : tri('Create Account to Track', '创建账户以跟踪', 'Crear Cuenta para Seguimiento', 'Konto erstellen zum Verfolgen', 'Créer un compte pour suivre', 'ट्रैक करने के लिए खाता बनाएं', 'Criar Conta para Acompanhar')}
                </button>
              </div>
            </div>
          )}

          {/* Conflict warning modal */}
          {showConflictModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                    <AlertCircle size={20} className="text-amber-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-navy-900 text-base">
                      {tri('Potential conflicts detected', '检测到潜在冲突', 'Se detectaron posibles conflictos', 'Potenzielle Konflikte erkannt', 'Conflits potentiels détectés', 'संभावित विरोध पाए गए', 'Conflitos potenciais detectados')}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {tri('Our clearance check flagged potential conflicts for one or more of your selected classes. This is not legal advice — we recommend reviewing the findings before proceeding.', '我们的检索发现一个或多个类别存在潜在冲突。这不是法律建议——建议您在继续之前查看检索结果。', 'Nuestra búsqueda detectó posibles conflictos en una o más de tus clases. Esto no es asesoría legal — te recomendamos revisar los resultados antes de continuar.', 'Unsere Recherche hat potenzielle Konflikte für eine oder mehrere Ihrer ausgewählten Klassen festgestellt. Dies ist keine Rechtsberatung — wir empfehlen, die Ergebnisse zu prüfen.', 'Notre vérification a détecté des conflits potentiels pour une ou plusieurs de vos classes. Ceci n\'est pas un conseil juridique — nous vous recommandons d\'examiner les résultats avant de continuer.', 'हमारी क्लीयरेंस जांच ने आपकी एक या अधिक चुनी हुई कक्षाओं के लिए संभावित विरोध पाए हैं। यह कानूनी सलाह नहीं है — आगे बढ़ने से पहले परिणामों की समीक्षा करने की सिफारिश की जाती है।', 'Nossa verificação detectou conflitos potenciais em uma ou mais das suas classes selecionadas. Isto não é assessoria jurídica — recomendamos revisar os resultados antes de prosseguir.')}
                    </p>
                  </div>
                </div>
                <div className="flex gap-3 mt-5">
                  <button
                    type="button"
                    onClick={() => setShowConflictModal(false)}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:border-gray-300 transition-colors"
                  >
                    {tri('Review findings', '查看检索结果', 'Revisar resultados', 'Ergebnisse überprüfen', 'Examiner les résultats', 'परिणाम देखें', 'Revisar resultados')}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowConflictModal(false); setStep(4); }}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-navy-900 hover:bg-navy-800 text-white text-sm font-semibold transition-colors"
                  >
                    {tri('Continue anyway', '仍然继续', 'Continuar de todas formas', 'Trotzdem fortfahren', 'Continuer quand même', 'फिर भी जारी रखें', 'Continuar mesmo assim')}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          {step < 7 && (
            <div className="flex justify-between mt-8 pt-6 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setStep(s => Math.max(1, s - 1) as Step)}
                disabled={step === 1 || (step === 6 && !!clientSecret)}
                className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:border-gray-300 disabled:opacity-40 transition-colors"
              >
                {t('form.back')}
              </button>
              {step < 6 && (
                <button
                  type="button"
                  onClick={() => {
                    if (step === 1 && form.email !== form.emailConfirm) return;
                    if (step === 3) {
                      const hasHighRisk = Object.values(clearanceResults).some(r => r.risk === 'high' || r.risk === 'medium');
                      if (hasHighRisk) {
                        setShowConflictModal(true);
                        return;
                      }
                    }
                    setStep(s => Math.min(6, s + 1) as Step);
                  }}
                  disabled={
                    (step === 1 && (form.email !== form.emailConfirm)) ||
                    (step === 3 && confirmedEntries.length === 0 && !activeEntryIsConfirmed)
                  }
                  className="px-5 py-2.5 rounded-xl bg-navy-900 hover:bg-navy-800 text-white text-sm font-semibold transition-colors disabled:opacity-40"
                >
                  {t('form.next')} <ChevronRight size={16} className="inline" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

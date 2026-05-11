import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { CheckCircle2, ChevronRight, Upload, X, Plus, Trash2, Lock, CreditCard, AlertCircle, AlertTriangle, Sparkles, Tag, Loader2, Pencil, Eye, EyeOff, UserPlus, HelpCircle, Info, Save, Shield, Search, LogIn, Mail } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { calculatePrice, getAllClasses, type ClassSuggestion } from '../lib/classifier';
import { getSortedCountries, getSortedDialCodes, type SupportedLang } from '../lib/countries';
import AIDescriptionAssistant, { type RelatedClass } from '../components/AIDescriptionAssistant';
import TrademarkClearancePanel, { type ClearanceResult } from '../components/TrademarkClearancePanel';

type Step = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

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
  preferredLanguage: 'en' | 'zh' | 'es' | 'de' | 'fr' | 'hi' | 'pt' | 'ja'; // kept for DB compat, not shown in UI
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

// ─── Info Tooltip ─────────────────────────────────────────────────────────────
function InfoTooltip({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-flex items-center ml-1.5">
      <button
        type="button"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={() => setOpen(v => !v)}
        className="text-gray-400 hover:text-[#2d5a2d] transition-colors focus:outline-none"
        aria-label="What is this?"
      >
        <HelpCircle size={14} />
      </button>
      {open && (
        <span className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 bg-[#1a2e1a] text-white text-xs rounded-xl px-3 py-2.5 shadow-xl leading-relaxed pointer-events-none">
          {text}
          <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#1a2e1a]" />
        </span>
      )}
    </span>
  );
}

function StepIndicator({ current, total, t }: { current: Step; total: number; t: (k: string) => string }) {
  const stepLabels = [
    t('form.step1'), t('form.step2'), t('form.step3'),
    t('form.step4'), t('form.step5'), t('form.step6'),
    t('form.step7'), t('form.step8'),
  ];
  return (
    <div className="mb-8 px-2">
      {/* Number row — always fits */}
      <div className="flex items-center justify-between">
        {stepLabels.slice(0, total).map((_, i) => {
          const num = (i + 1) as Step;
          const done = current > num;
          const active = current === num;
          return (
            <div key={i} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-shrink-0">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  done ? 'bg-green-500 text-white' : active ? 'bg-gold-500 text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  {done ? <CheckCircle2 size={13} /> : num}
                </div>
              </div>
              {i < total - 1 && (
                <div className={`flex-1 h-0.5 mx-1 ${done ? 'bg-green-400' : 'bg-gray-200'}`} />
              )}
            </div>
          );
        })}
      </div>
      {/* Label row — only active step label shown on mobile, all on sm+ */}
      <div className="flex items-start justify-between mt-1.5">
        {stepLabels.slice(0, total).map((label, i) => {
          const num = (i + 1) as Step;
          const active = current === num;
          return (
            <div key={i} className="flex-1 flex justify-center">
              <span className={`text-center text-xs leading-tight max-w-[64px] ${
                active ? 'text-gold-600 font-semibold' : 'text-gray-400 hidden sm:block'
              }`}>
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Stripe checkout inner form ──────────────────────────────────────────────
interface CheckoutFormProps {
  language: string;
  finalTotal: number;
  onSuccess: () => void;
  applicationId: string | null;
  paymentIntentId: string | null;
}

function CheckoutForm({ language, finalTotal, onSuccess, applicationId, paymentIntentId }: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const tri = (en: string, zh: string, es: string, de?: string, fr?: string, hi?: string, pt?: string, ja?: string): string =>
    language === 'zh' ? zh : language === 'es' ? es : language === 'de' ? (de ?? en) : language === 'fr' ? (fr ?? en) : language === 'hi' ? (hi ?? en) : language === 'pt' ? (pt ?? en) : language === 'ja' ? (ja ?? en) : en;

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
      return;
    }

    // Immediately sync payment status and trigger confirmation emails
    if (applicationId && paymentIntentId) {
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
        await fetch(`${supabaseUrl}/functions/v1/confirm-payment-client`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseAnonKey}`,
            'Apikey': supabaseAnonKey,
          },
          body: JSON.stringify({ paymentIntentId, applicationId }),
        });
      } catch (e) {
        console.error('confirm-payment-client failed:', e);
      }
    }

    onSuccess();
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
          ? (tri('Processing payment...', '处理付款中...', 'Procesando pago...', 'Zahlung wird verarbeitet...', 'Traitement du paiement...', 'भुगतान हो रहा है...', 'Processando pagamento...', '決済処理中...'))
          : (tri(`Pay USD $${finalTotal.toFixed(2)}`, `支付 USD $${finalTotal.toFixed(2)}`, `Pagar USD $${finalTotal.toFixed(2)}`, `USD $${finalTotal.toFixed(2)} bezahlen`, `Payer USD $${finalTotal.toFixed(2)}`, `USD $${finalTotal.toFixed(2)} का भुगतान करें`, `Pagar USD $${finalTotal.toFixed(2)}`, `USD $${finalTotal.toFixed(2)} を支払う`))}
      </button>

      <p className="text-center text-xs text-gray-400 flex items-center justify-center gap-1">
        <Lock size={11} />
        {tri('Secured by Stripe', '由Stripe保护', 'Pago seguro vía Stripe', 'Gesichert durch Stripe', 'Sécurisé par Stripe', 'Stripe द्वारा सुरक्षित', 'Protegido pelo Stripe', 'Stripeで保護')}
      </p>
    </form>
  );
}
// ─── Auth Gate Modal ─────────────────────────────────────────────────────────
interface AuthGateProps {
  language: string;
  onSuccess: () => void;
  onClose: () => void;
}

function AuthGateModal({ language, onSuccess, onClose }: AuthGateProps) {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'signup' | 'login'>('signup');
  const [form, setForm] = useState({ email: '', password: '', fullName: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  const l = (en: string, zh: string, es: string, de?: string, fr?: string, hi?: string, pt?: string, ja?: string) =>
    language === 'zh' ? zh : language === 'es' ? es : language === 'de' ? (de ?? en) : language === 'fr' ? (fr ?? en) : language === 'hi' ? (hi ?? en) : language === 'pt' ? (pt ?? en) : language === 'ja' ? (ja ?? en) : en;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    if (mode === 'login') {
      const { error } = await signIn(form.email, form.password);
      if (error) {
        setError(l('Invalid email or password.', '邮箱或密码错误。', 'Correo o contraseña incorrectos.', 'Ungültige E-Mail oder Passwort.', 'E-mail ou mot de passe invalide.', 'अमान्य ईमेल या पासवर्ड।', 'E-mail ou senha inválidos.', 'メールアドレスまたはパスワードが正しくありません。'));
      } else {
        onSuccess();
      }
    } else {
      if (form.password.length < 6) {
        setError(l('Password must be at least 6 characters.', '密码至少需要6个字符。', 'La contraseña debe tener al menos 6 caracteres.', 'Passwort muss mindestens 6 Zeichen haben.', 'Le mot de passe doit comporter au moins 6 caractères.', 'पासवर्ड कम से कम 6 अक्षर का होना चाहिए।', 'A senha deve ter pelo menos 6 caracteres.', 'パスワードは6文字以上必要です。'));
        setLoading(false);
        return;
      }
      const { error } = await signUp(form.email, form.password, form.fullName || form.email);
      if (error) {
        setError(error.message);
      } else {
        onSuccess();
      }
    }
    setLoading(false);
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);
    await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${window.location.origin}/dashboard`,
    });
    setResetSent(true);
    setResetLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-navy-900 px-6 py-5 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gold-500 rounded-xl flex items-center justify-center flex-shrink-0">
              <UserPlus size={18} className="text-white" />
            </div>
            <div>
              <h3 className="text-white font-bold text-base">
                {l('Create Your Account', '创建您的账户', 'Crea tu Cuenta', 'Konto erstellen', 'Créer votre compte', 'अपना खाता बनाएं', 'Crie sua Conta', 'アカウントを作成')}
              </h3>
              <p className="text-navy-300 text-xs mt-0.5">
                {l('Save your filing and track its progress', '保存申请并跟踪进度', 'Guarda tu solicitud y haz seguimiento', 'Einreichung speichern und verfolgen', 'Enregistrez votre dépôt et suivez son avancement', 'अपनी फाइलिंग सेव करें और प्रगति ट्रैक करें', 'Salve seu pedido e acompanhe o andamento', '出願を保存して進捗を追跡')}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-navy-400 hover:text-white transition-colors mt-0.5">
            <X size={18} />
          </button>
        </div>

        <div className="p-6">
          {/* Mode tabs */}
          <div className="flex bg-gray-100 rounded-xl p-1 mb-5">
            <button
              type="button"
              onClick={() => { setMode('signup'); setError(''); setShowReset(false); }}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${mode === 'signup' ? 'bg-white shadow text-navy-900' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {l('Create Account', '创建账户', 'Crear Cuenta', 'Konto erstellen', 'Créer un compte', 'खाता बनाएं', 'Criar Conta', 'アカウント作成')}
            </button>
            <button
              type="button"
              onClick={() => { setMode('login'); setError(''); setShowReset(false); }}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${mode === 'login' ? 'bg-white shadow text-navy-900' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {l('Sign In', '登录', 'Iniciar Sesión', 'Anmelden', 'Se connecter', 'साइन इन', 'Entrar', 'サインイン')}
            </button>
          </div>

          {showReset ? (
            <div>
              {resetSent ? (
                <div className="text-center py-4">
                  <CheckCircle2 size={36} className="text-green-500 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-gray-800 mb-1">
                    {l('Check your email', '请查看您的邮件', 'Revisa tu correo', 'Überprüfen Sie Ihre E-Mail', 'Vérifiez votre e-mail', 'अपना ईमेल जांचें', 'Verifique seu e-mail', 'メールを確認してください')}
                  </p>
                  <p className="text-xs text-gray-500">
                    {l('We sent a password reset link to', 'パスワードリセットリンクを以下に送信しました', 'Enviamos un enlace para restablecer la contraseña a', 'Wir haben einen Link zum Zurücksetzen des Passworts gesendet an', 'Nous avons envoyé un lien de réinitialisation à', 'हमने पासवर्ड रीसेट लिंक भेजा है', 'Enviamos um link de redefinição para', 'パスワードリセットリンクを送信しました')} {resetEmail}
                  </p>
                  <button onClick={() => { setShowReset(false); setResetSent(false); }} className="mt-4 text-sm text-gold-600 hover:text-gold-700 font-medium">
                    {l('Back to sign in', '返回登录', 'Volver al inicio de sesión', 'Zurück zur Anmeldung', 'Retour à la connexion', 'साइन इन पर वापस', 'Voltar ao login', 'サインインに戻る')}
                  </button>
                </div>
              ) : (
                <form onSubmit={handlePasswordReset} className="space-y-4">
                  <p className="text-sm text-gray-600">
                    {l("Enter your email and we'll send you a reset link.", '输入您的邮箱，我们将发送重置链接。', 'Ingresa tu correo y te enviaremos un enlace de restablecimiento.', 'Geben Sie Ihre E-Mail ein und wir senden Ihnen einen Reset-Link.', 'Entrez votre e-mail et nous vous enverrons un lien de réinitialisation.', 'अपना ईमेल दर्ज करें और हम आपको रीसेट लिंक भेजेंगे।', 'Insira seu e-mail e enviaremos um link de redefinição.', 'メールアドレスを入力するとリセットリンクを送信します。')}
                  </p>
                  <input
                    type="email"
                    required
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent"
                    placeholder={l('your@email.com', 'your@email.com', 'tu@correo.com', 'ihre@email.de', 'votre@email.fr', 'आपका@ईमेल.com', 'seu@email.com', 'your@email.com')}
                    value={resetEmail}
                    onChange={e => setResetEmail(e.target.value)}
                  />
                  <button
                    type="submit"
                    disabled={resetLoading}
                    className="w-full bg-navy-900 hover:bg-navy-800 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors disabled:opacity-60"
                  >
                    {resetLoading ? l('Sending...', '发送中...', 'Enviando...', 'Senden...', 'Envoi...', 'भेज रहे हैं...', 'Enviando...', '送信中...') : l('Send Reset Link', '发送重置链接', 'Enviar enlace', 'Reset-Link senden', 'Envoyer le lien', 'रीसेट लिंक भेजें', 'Enviar link', 'リセットリンクを送信')}
                  </button>
                  <button type="button" onClick={() => setShowReset(false)} className="w-full text-sm text-gray-500 hover:text-gray-700">
                    {l('Back', '返回', 'Volver', 'Zurück', 'Retour', 'वापस', 'Voltar', '戻る')}
                  </button>
                </form>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
                  <AlertCircle size={15} />
                  {error}
                </div>
              )}

              {mode === 'signup' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {l('Full Name', '全名', 'Nombre Completo', 'Vollständiger Name', 'Nom complet', 'पूरा नाम', 'Nome Completo', '氏名')}
                  </label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent"
                    value={form.fullName}
                    onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))}
                    placeholder={l('Optional', '可选', 'Opcional', 'Optional', 'Facultatif', 'वैकल्पिक', 'Opcional', '任意')}
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {l('Email Address', '电子邮件', 'Correo Electrónico', 'E-Mail-Adresse', 'Adresse e-mail', 'ईमेल पता', 'Endereço de E-mail', 'メールアドレス')}
                </label>
                <input
                  type="email"
                  required
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {l('Password', '密码', 'Contraseña', 'Passwort', 'Mot de passe', 'पासवर्ड', 'Senha', 'パスワード')}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent pr-10"
                    placeholder={mode === 'signup' ? l('Min. 6 characters', '至少6个字符', 'Mín. 6 caracteres', 'Min. 6 Zeichen', 'Min. 6 caractères', 'न्यूनतम 6 अक्षर', 'Mín. 6 caracteres', '6文字以上') : ''}
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    onClick={() => setShowPassword(v => !v)}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {mode === 'login' && (
                <button
                  type="button"
                  onClick={() => { setShowReset(true); setResetEmail(form.email); setError(''); }}
                  className="text-xs text-gold-600 hover:text-gold-700 font-medium"
                >
                  {l('Forgot password?', '忘记密码？', '¿Olvidaste tu contraseña?', 'Passwort vergessen?', 'Mot de passe oublié ?', 'पासवर्ड भूल गए?', 'Esqueceu a senha?', 'パスワードをお忘れですか？')}
                </button>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-gold-500 hover:bg-gold-600 disabled:opacity-60 text-white font-bold py-3 rounded-xl text-sm transition-colors"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : null}
                {mode === 'signup'
                  ? l('Create Account & Continue', '创建账户并继续', 'Crear Cuenta y Continuar', 'Konto erstellen und fortfahren', 'Créer un compte et continuer', 'खाता बनाएं और जारी रखें', 'Criar Conta e Continuar', 'アカウントを作成して続ける')
                  : l('Sign In & Continue', '登录并继续', 'Iniciar sesión y continuar', 'Anmelden und fortfahren', 'Se connecter et continuer', 'साइन इन करें और जारी रखें', 'Entrar e Continuar', 'サインインして続ける')}
              </button>
            </form>
          )}

          <p className="text-center text-xs text-gray-400 mt-4">
            {l('Your data is encrypted and never shared.', '您的数据已加密，绝不共享。', 'Tus datos están cifrados y nunca se comparten.', 'Ihre Daten sind verschlüsselt und werden nie geteilt.', 'Vos données sont chiffrées et jamais partagées.', 'आपका डेटा एन्क्रिप्टेड है और कभी साझा नहीं किया जाता।', 'Seus dados são criptografados e nunca compartilhados.', 'データは暗号化され、共有されません。')}
          </p>
        </div>
      </div>
    </div>
  );
}
// ─── Fireworks overlay ────────────────────────────────────────────────────────

const FW_COLORS = ['#f59e0b','#10b981','#3b82f6','#ef4444','#a855f7','#ec4899','#84cc16','#06b6d4'];

function FireworksOverlay({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDone, 3500);
    return () => clearTimeout(timer);
  }, [onDone]);

  const particles = Array.from({ length: 60 }, (_, i) => {
    const angle = (i / 60) * 360;
    const distance = 80 + Math.random() * 120;
    const x = Math.cos((angle * Math.PI) / 180) * distance;
    const y = Math.sin((angle * Math.PI) / 180) * distance;
    const color = FW_COLORS[i % FW_COLORS.length];
    const delay = Math.random() * 0.8;
    const size = 4 + Math.random() * 6;
    return { x, y, color, delay, size, angle };
  });

  const bursts = [
    { left: '20%', top: '30%' },
    { left: '75%', top: '25%' },
    { left: '50%', top: '15%' },
    { left: '30%', top: '60%' },
    { left: '70%', top: '55%' },
  ];

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      <style>{`
        @keyframes fw-particle {
          0% { transform: translate(0,0) scale(1); opacity: 1; }
          100% { transform: translate(var(--tx), var(--ty)) scale(0); opacity: 0; }
        }
        .fw-p { animation: fw-particle 1.2s ease-out forwards; }
      `}</style>
      {bursts.map((burst, bi) => (
        <div key={bi} className="absolute" style={{ left: burst.left, top: burst.top }}>
          {particles.map((p, pi) => (
            <div
              key={pi}
              className="fw-p absolute rounded-full"
              style={{
                width: p.size,
                height: p.size,
                background: p.color,
                left: 0,
                top: 0,
                '--tx': `${p.x}px`,
                '--ty': `${p.y}px`,
                animationDelay: `${(bi * 0.4) + p.delay}s`,
              } as React.CSSProperties}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export default function ApplyPage() {
  const { language, t } = useLanguage();
  // tri: helper for inline strings not yet moved to translation keys
  const tri = (en: string, zh: string, es: string, de?: string, fr?: string, hi?: string, pt?: string, ja?: string): string =>
    language === 'zh' ? zh : language === 'es' ? es : language === 'de' ? (de ?? en) : language === 'fr' ? (fr ?? en) : language === 'hi' ? (hi ?? en) : language === 'pt' ? (pt ?? en) : language === 'ja' ? (ja ?? en) : en;
  const sortedCountries = getSortedCountries(language as SupportedLang);
  const sortedDialCodes = getSortedDialCodes(language as SupportedLang);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState<Step>(1);
  const [showAuthGate, setShowAuthGate] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [caseNumber, setCaseNumber] = useState('');
  const [applicationId, setApplicationId] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const activeEntryRef = useRef<HTMLDivElement>(null);
  const [draftId, setDraftId] = useState<string | null>(null);
  const draftLoaded = useRef(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Edit-mode state (when navigated from /apply?edit=<appId>)
  const [editingAppId, setEditingAppId] = useState<string | null>(null);
  const [editingClientId, setEditingClientId] = useState<string | null>(null);
  const [editingCaseNumber, setEditingCaseNumber] = useState<string | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const editLoaded = useRef(false);

  // Stripe state
  const [stripePromise] = useState(() => {
    const key = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
    return key ? loadStripe(key) : null;
  });
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Coupon state
  const [couponInput, setCouponInput] = useState('');
  const [couponApplied, setCouponApplied] = useState<{ code: string; discountPercent: number } | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponChecking, setCouponChecking] = useState(false);
  const [finalTotal, setFinalTotal] = useState<number | null>(null);

  const [clearanceResults, setClearanceResults] = useState<Record<string, ClearanceResult>>({});
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [step3RiskAcknowledged, setStep3RiskAcknowledged] = useState(false);

  // Detect if user arrived from a prior clearance search
  const fromClearance = !!sessionStorage.getItem('tcpSearchName') &&
    (sessionStorage.getItem('tcpSearchName') ?? '').toLowerCase() === form.markName.trim().toLowerCase();
  const [clearanceSkipped, setClearanceSkipped] = useState(false);

  // Pre-payment clearance gate state
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [agreedToDisclaimer, setAgreedToDisclaimer] = useState(false);
  const [disclaimerError, setDisclaimerError] = useState(false);

  // Post-payment account prompt state
  const [postPaymentMode, setPostPaymentMode] = useState<'prompt' | 'login' | 'reset' | 'reset_sent'>('prompt');
  const [postPaymentLoginEmail, setPostPaymentLoginEmail] = useState('');
  const [postPaymentLoginPassword, setPostPaymentLoginPassword] = useState('');
  const [postPaymentLoginError, setPostPaymentLoginError] = useState('');
  const [postPaymentLoginLoading, setPostPaymentLoginLoading] = useState(false);
  const [postPaymentShowPassword, setPostPaymentShowPassword] = useState(false);
  const [fireworksDone, setFireworksDone] = useState(false);

  const suggestedName = useRef<string>('');

  const [form, setForm] = useState<FormData>(() => {
    const fromUrl = new URLSearchParams(window.location.search).get('mark') ?? '';
    const suggested = fromUrl || sessionStorage.getItem('suggestedMarkName') || '';
    if (!fromUrl && suggested) {
      sessionStorage.removeItem('suggestedMarkName');
    }
    if (suggested) suggestedName.current = suggested;
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
      // preferredLanguage auto-set from site language
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
        setCouponError(data.error || tri('Invalid coupon code.', '无效优惠码。', 'Código de descuento inválido.', 'Ungültiger Gutscheincode.', 'Code promo invalide.', 'अमान्य कूपन कोड।', 'Código de desconto inválido.', '無効なクーポンコード。'));
      } else {
        setCouponApplied({ code, discountPercent: data.discountPercent });
        setCouponInput('');
      }
    } catch {
      setCouponError(tri('Could not verify coupon. Please try again.', '无法验证优惠码，请重试。', 'No se pudo verificar el cupón. Inténtalo de nuevo.', 'Gutschein konnte nicht überprüft werden.', 'Impossible de vérifier le code promo.', 'कूपन सत्यापित नहीं हो सका।', 'Não foi possível verificar o cupom.', 'クーポンを確認できませんでした。もう一度お試しください。'));
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
  // ─── Draft persistence ─────────────────────────────────────────────────────

  const serializeForm = useCallback((f: FormData) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { logoFile, ...rest } = f;
    return rest;
  }, []);

  const LS_DRAFT_KEY = 'mtc_filing_draft';

  // Load existing draft on mount
  useEffect(() => {
    if (user) {
      // Authenticated: load from Supabase
      (async () => {
        const { data } = await supabase
          .from('filing_drafts')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (data) {
          if (searchParams.get('fresh') === '1') {
            await supabase.from('filing_drafts').delete().eq('id', data.id);
            localStorage.removeItem(LS_DRAFT_KEY);
            draftLoaded.current = true;
            return;
          }
          setDraftId(data.id);
          const savedStep = (data.current_step ?? 1) as Step;
          const savedForm = data.form_data as Partial<FormData> | null;
          const savedEntries = data.class_entries as ClassEntry[] | null;
          if (savedForm) {
            setForm(f => ({
              ...f,
              ...savedForm,
              logoFile: null,
              classEntries: savedEntries && savedEntries.length > 0 ? savedEntries : f.classEntries,
            }));
          }
          if (data.logo_preview_data) setLogoPreview(data.logo_preview_data);
          if (searchParams.get('resume') === '1') setStep(savedStep);
        } else {
          // No Supabase draft — check if there's a localStorage draft to migrate
          const lsRaw = localStorage.getItem(LS_DRAFT_KEY);
          if (lsRaw && searchParams.get('fresh') !== '1') {
            try {
              const lsDraft = JSON.parse(lsRaw);
              const savedForm = lsDraft.form_data as Partial<FormData> | null;
              const savedEntries = lsDraft.class_entries as ClassEntry[] | null;
              if (savedForm) {
                setForm(f => ({
                  ...f,
                  ...savedForm,
                  logoFile: null,
                  classEntries: savedEntries && savedEntries.length > 0 ? savedEntries : f.classEntries,
                }));
              }
              if (lsDraft.logo_preview_data) setLogoPreview(lsDraft.logo_preview_data);
              if (searchParams.get('resume') === '1' && lsDraft.current_step) setStep(lsDraft.current_step as Step);
            } catch {
              localStorage.removeItem(LS_DRAFT_KEY);
            }
          }
        }
        draftLoaded.current = true;
      })();
    } else {
      // Unauthenticated: load from localStorage
      if (searchParams.get('fresh') === '1') {
        localStorage.removeItem(LS_DRAFT_KEY);
        draftLoaded.current = true;
        return;
      }
      const lsRaw = localStorage.getItem(LS_DRAFT_KEY);
      if (lsRaw) {
        try {
          const lsDraft = JSON.parse(lsRaw);
          const savedForm = lsDraft.form_data as Partial<FormData> | null;
          const savedEntries = lsDraft.class_entries as ClassEntry[] | null;
          if (savedForm) {
            setForm(f => ({
              ...f,
              ...savedForm,
              logoFile: null,
              classEntries: savedEntries && savedEntries.length > 0 ? savedEntries : f.classEntries,
            }));
          }
          if (lsDraft.logo_preview_data) setLogoPreview(lsDraft.logo_preview_data);
          if (searchParams.get('resume') === '1' && lsDraft.current_step) setStep(lsDraft.current_step as Step);
        } catch {
          localStorage.removeItem(LS_DRAFT_KEY);
        }
      }
      draftLoaded.current = true;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Load existing application when ?edit=<appId> is present
  useEffect(() => {
    const editId = searchParams.get('edit');
    if (!editId || !user || editLoaded.current) return;
    editLoaded.current = true;
    setEditLoading(true);
    (async () => {
      const [appRes, tmRes, classRes, gsRes] = await Promise.all([
        supabase.from('applications').select('id, case_number, client_id, priority_claimed, priority_country, priority_app_number, priority_filing_date').eq('id', editId).eq('user_id', user.id).maybeSingle(),
        supabase.from('trademarks').select('*').eq('application_id', editId).maybeSingle(),
        supabase.from('trademark_classes').select('class_number, class_title_en').eq('application_id', editId),
        supabase.from('goods_services').select('description_original, business_industry').eq('application_id', editId),
      ]);
      if (!appRes.data) { setEditLoading(false); return; }

      const app = appRes.data;
      setEditingAppId(app.id);
      setEditingClientId(app.client_id);
      setEditingCaseNumber(app.case_number);
      setCaseNumber(app.case_number);

      // Load client row
      const { data: client } = await supabase.from('clients').select('*').eq('id', app.client_id).maybeSingle();

      // Reconstruct classEntries from trademark_classes + goods_services
      const classes = classRes.data ?? [];
      const gs = gsRes.data ?? [];
      const entries: ClassEntry[] = classes.map((c, i) => ({
        id: `entry-edit-${i}-${c.class_number}`,
        description: gs[i]?.description_original ?? '',
        businessIndustry: gs[i]?.business_industry ?? '',
        classNumber: c.class_number,
        classTitleEn: c.class_title_en ?? '',
        descriptionEn: '',
        descriptionEs: '',
        confidence: 1,
        isConfirmed: true,
        fallbackClasses: [],
        fallbackSuggestions: [],
      }));

      const tm = tmRes.data;
      setForm(f => ({
        ...f,
        // Step 1 — applicant
        applicantType: (client?.applicant_type as 'individual' | 'company') ?? 'company',
        legalName: client?.legal_name ?? '',
        country: client?.country ?? '',
        address: client?.address ?? '',
        city: client?.city ?? '',
        stateProvince: client?.state_province ?? '',
        postalCode: client?.postal_code ?? '',
        email: client?.email ?? '',
        emailConfirm: client?.email ?? '',
        phoneNumber: client?.phone ?? '',
        wechat: client?.wechat ?? '',
        whatsapp: client?.whatsapp ?? '',
        taxId: client?.tax_id ?? '',
        contactPerson: client?.contact_person ?? '',
        preferredLanguage: (client?.preferred_language as FormData['preferredLanguage']) ?? f.preferredLanguage,
        // Step 2 — mark
        markName: tm?.mark_name ?? '',
        markType: tm?.mark_type ?? 'word',
        containsNonSpanish: tm?.contains_non_spanish ?? false,
        markLanguage: tm?.mark_language ?? 'en',
        meaningSpanish: tm?.meaning_spanish ?? '',
        transliteration: tm?.transliteration ?? '',
        markDescription: tm?.mark_description ?? '',
        claimsColor: tm?.claims_color ?? false,
        colorDescription: tm?.color_description ?? '',
        // Step 3 — classes
        classEntries: entries.length > 0 ? entries : [newEntry()],
        // Priority fields
        priorityClaimed: app.priority_claimed ?? false,
        priorityCountry: app.priority_country ?? '',
        priorityAppNumber: app.priority_app_number ?? '',
        priorityFilingDate: app.priority_filing_date ?? '',
      }));

      if (tm?.logo_preview_url) setLogoPreview(tm.logo_preview_url);
      setEditLoading(false);
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Auto-save draft on form/step change (debounced 1.5s, not on step 8 or in edit mode)
  useEffect(() => {
    if (!draftLoaded.current || step === 8 || editingAppId) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      const payload = {
        current_step: step,
        mark_name: form.markName,
        form_data: serializeForm(form),
        class_entries: form.classEntries,
        logo_preview_data: logoPreview ?? null,
        updated_at: new Date().toISOString(),
      };
      if (user) {
        // Authenticated: save to Supabase
        const dbPayload = { ...payload, user_id: user.id };
        if (draftId) {
          await supabase.from('filing_drafts').update(dbPayload).eq('id', draftId);
        } else {
          const { data } = await supabase.from('filing_drafts').insert(dbPayload).select('id').maybeSingle();
          if (data?.id) setDraftId(data.id);
        }
      } else {
        // Unauthenticated: save to localStorage
        try { localStorage.setItem(LS_DRAFT_KEY, JSON.stringify(payload)); } catch { /* storage full */ }
      }
    }, 1500);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, step, form, logoPreview, draftId, serializeForm]);

  const deleteDraft = useCallback(async () => {
    localStorage.removeItem(LS_DRAFT_KEY);
    if (!draftId || !user) return;
    await supabase.from('filing_drafts').delete().eq('id', draftId);
    setDraftId(null);
  }, [draftId, user]);

  const [draftSavedFeedback, setDraftSavedFeedback] = useState(false);

  const handleSaveAndContinueLater = useCallback(async () => {
    if (!user) {
      setShowAuthGate(true);
      return;
    }
    const payload = {
      user_id: user.id,
      current_step: step,
      mark_name: form.markName,
      form_data: serializeForm(form),
      class_entries: form.classEntries,
      logo_preview_data: logoPreview ?? null,
      updated_at: new Date().toISOString(),
    };
    if (draftId) {
      await supabase.from('filing_drafts').update(payload).eq('id', draftId);
    } else {
      const { data } = await supabase.from('filing_drafts').insert(payload).select('id').maybeSingle();
      if (data?.id) setDraftId(data.id);
    }
    setDraftSavedFeedback(true);
    setTimeout(() => setDraftSavedFeedback(false), 3000);
  }, [user, step, form, logoPreview, draftId, serializeForm]);

  // ─── Payment ───────────────────────────────────────────────────────────────

  const handleProceedToPayment = async () => {
    setSubmitting(true);
    setPaymentError(null);
    try {
      // Validate: every class entry must have at least one class number selected
      const unclassified = form.classEntries.filter(e => {
        const hasConfirmed = e.isConfirmed && e.classNumber !== null;
        const hasFallback = e.fallbackClasses.length > 0;
        return !hasConfirmed && !hasFallback;
      });
      if (unclassified.length > 0) {
        setPaymentError('Please classify all goods and services before proceeding to payment.');
        setSubmitting(false);
        return;
      }

      let resolvedAppId: string;

      if (editingAppId && editingClientId) {
        // ── EDIT MODE: update existing records ──────────────────────────────
        resolvedAppId = editingAppId;

        await supabase.from('clients').update({
          applicant_type: form.applicantType,
          legal_name: form.legalName,
          country: form.country,
          address: form.address,
          city: form.city,
          state_province: form.stateProvince,
          postal_code: form.postalCode,
          email: form.email,
          phone: form.phoneNumber,
          wechat: form.wechat,
          whatsapp: form.whatsapp,
          tax_id: form.taxId,
          contact_person: form.contactPerson,
          preferred_language: form.preferredLanguage,
        }).eq('id', editingClientId);

        await supabase.from('applications').update({
          total_classes: totalClasses,
          service_fee_usd: serviceFee,
          government_fee_usd: govFee,
          total_amount_usd: grandTotal,
          priority_claimed: form.priorityClaimed,
          priority_country: form.priorityCountry,
          priority_app_number: form.priorityAppNumber,
          priority_filing_date: form.priorityFilingDate || null,
        }).eq('id', editingAppId);

        await supabase.from('trademarks').update({
          mark_name: form.markName,
          mark_type: form.markType as 'word',
          contains_non_spanish: form.containsNonSpanish,
          mark_language: form.markLanguage,
          meaning_spanish: form.meaningSpanish,
          transliteration: form.transliteration,
          mark_description: form.markDescription,
          claims_color: form.claimsColor,
          color_description: form.colorDescription,
        }).eq('application_id', editingAppId);

        // Replace classes and goods_services
        await supabase.from('trademark_classes').delete().eq('application_id', editingAppId);
        await supabase.from('goods_services').delete().eq('application_id', editingAppId);

        for (const entry of form.classEntries) {
          const classNums = entry.isConfirmed && entry.classNumber !== null
            ? [entry.classNumber]
            : entry.fallbackClasses;
          if (classNums.length === 0) continue;

          await supabase.from('goods_services').insert({
            application_id: editingAppId,
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
                application_id: editingAppId,
                class_number: classNum,
                class_title_en: entry.classTitleEn || nc.titleEn,
                classification_source: entry.isConfirmed ? 'ai_classified' : 'user_selected',
                confidence_score: entry.confidence,
              });
            }
          }
        }

        setApplicationId(editingAppId);
      } else {
        // ── CREATE MODE: insert new records ─────────────────────────────────
        const cn = generateCaseNumber();
        setCaseNumber(cn);

        // Ensure the profile row exists for authenticated users (it may be missing
        // if the insert during signUp was blocked by RLS before the policy was added)
        if (user) {
          await supabase.from('profiles').upsert({
            id: user.id,
            email: user.email ?? form.email,
            full_name: form.contactPerson || form.legalName,
            role: 'client',
          }, { onConflict: 'id', ignoreDuplicates: true });
        }

        const { data: clientData, error: clientError } = await supabase.from('clients').insert({
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

        if (clientError || !clientData) throw new Error(`Failed to create client record: ${clientError?.message ?? 'no data returned'}`);

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
          terms_accepted: agreedToTerms,
          disclaimer_accepted: agreedToDisclaimer,
          disclaimer_accepted_at: agreedToDisclaimer ? new Date().toISOString() : null,
        }).select().maybeSingle();

        if (!appData) throw new Error('Failed to create application record');
        resolvedAppId = appData.id;
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
          applicationId: resolvedAppId,
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
      setPaymentIntentId(data.paymentIntentId ?? null);
      setFinalTotal(data.finalAmountUsd ?? grandTotal);
    } catch (err) {
      console.error(err);
      setPaymentError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePaymentSuccess = () => {
    deleteDraft();
    setStep(7);
  };

  const inputClass = 'w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent';
  const labelClass = 'block text-sm font-medium text-gray-700 mb-1.5';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="bg-gradient-to-br from-navy-950 via-navy-900 to-navy-800 text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-20">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gold-500/20 border border-gold-500/30 flex items-center justify-center">
              <Shield size={20} className="text-gold-400" />
            </div>
            <span className="text-gold-300 text-sm font-medium tracking-wide uppercase">
              {tri('Official IMPI Trademark Filing', '官方IMPI商标申请', 'Solicitud Oficial ante el IMPI', 'Offizielle IMPI-Markenanmeldung', 'Dépôt officiel auprès de l\'IMPI', 'आधिकारिक IMPI ट्रेडमार्क फाइलिंग', 'Registro Oficial no IMPI', '公式IMPI商標出願')}
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-4">
            {tri('File Your Mexican Trademark', '申请您的墨西哥商标', 'Registra tu Marca en México', 'Ihre Marke in Mexiko anmelden', 'Déposez votre marque au Mexique', 'अपना मेक्सिको ट्रेडमार्क दाखिल करें', 'Registre sua Marca no México', 'メキシコ商標出願')}
          </h1>
          <p className="text-lg text-gray-300 leading-relaxed">
            {tri('Complete each step to prepare your IMPI application.', '完成每个步骤以准备您的IMPI申请。', 'Completa cada paso para preparar tu solicitud ante el IMPI.', 'Füllen Sie jeden Schritt aus, um Ihren IMPI-Antrag vorzubereiten.', 'Complétez chaque étape pour préparer votre dossier IMPI.', 'अपना IMPI आवेदन तैयार करने के लिए प्रत्येक चरण पूरा करें।', 'Complete cada etapa para preparar seu pedido no IMPI.', '各ステップを完了してIMPI出願を準備してください。')}
          </p>
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10">
        {step < 8 && <StepIndicator current={step} total={8} t={t} />}

        {/* Edit-mode loading */}
        {editLoading && (
          <div className="mb-4 flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 text-sm text-amber-700">
            <Loader2 size={14} className="animate-spin flex-shrink-0" />
            <span>Loading your case details…</span>
          </div>
        )}

        {/* Edit-mode banner */}
        {editingAppId && !editLoading && step < 8 && (
          <div className="mb-4 flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 text-sm text-amber-800">
            <Pencil size={14} className="flex-shrink-0 text-amber-600" />
            <span>
              Editing case <span className="font-mono font-semibold">{editingCaseNumber}</span> — review your details and proceed to payment when ready.
            </span>
          </div>
        )}

        {/* Draft resumed notice */}
        {draftId && !editingAppId && step > 1 && step < 8 && (
          <div className="mb-4 flex items-center justify-between gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5 text-sm text-blue-700">
            <span>
              {tri('Draft restored — you can edit any previous step.', '草稿已恢复——您可以编辑任何之前的步骤。', 'Borrador restaurado: puede editar cualquier paso anterior.', 'Entwurf wiederhergestellt – Sie können jeden Schritt bearbeiten.', 'Brouillon restauré — vous pouvez modifier n\'importe quelle étape.', 'ड्राफ़्ट पुनर्स्थापित — आप कोई भी पिछला चरण संपादित कर सकते हैं।', 'Rascunho restaurado — você pode editar qualquer etapa anterior.', '下書きが復元されました。前のステップを編集できます。')}
            </span>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 lg:p-8">
          {/* STEP 1 — Trademark Details (was Step 2) */}
          {step === 1 && (
            <div>
              <h2 className="text-lg font-bold text-navy-900 mb-6">{t('form.step1')}</h2>
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
                  <label className={labelClass}>
                    {tri('Type of Mark', '商标类型', 'Tipo de Marca', 'Art der Marke', 'Type de marque', 'चिह्न का प्रकार', 'Tipo de Marca')}
                    <InfoTooltip text={t('tooltip.markType')} />
                  </label>
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

          {/* STEP 5 — Owner Details */}
          {step === 5 && (
            <div>
              <h2 className="text-lg font-bold text-navy-900 mb-6">{t('form.step5')}</h2>
              <div className="space-y-4">
                <div>
                  <label className={labelClass}>
                    {tri('Applicant Type', '申请人类型', 'Tipo de Solicitante', 'Antragstellertyp', 'Type de déposant', 'आवेदक प्रकार', 'Tipo de Solicitante')}
                    <InfoTooltip text={t('tooltip.ownerType')} />
                  </label>
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
                    <label className={labelClass}>
                      {tri('Full Legal Name *', '完整法定名称 *', 'Nombre o Razón Social *', 'Vollständiger rechtlicher Name *', 'Nom légal complet *', 'पूरा कानूनी नाम *', 'Nome Legal Completo *', '正式法定名称 *')}
                      <InfoTooltip text={tri('This name will appear on the official IMPI trademark certificate as the registered owner.', '该名称将作为注册所有人出现在IMPI官方商标证书上。', 'Este nombre aparecerá en el certificado oficial de marca del IMPI como titular registrado.', 'Dieser Name erscheint als eingetragener Inhaber im offiziellen IMPI-Markenzertifikat.', 'Ce nom figurera sur le certificat officiel de marque IMPI en tant que titulaire enregistré.', 'यह नाम पंजीकृत स्वामी के रूप में IMPI के आधिकारिक ट्रेडमार्क प्रमाणपत्र पर दिखाई देगा।', 'Este nome constará no certificado oficial de marca do IMPI como titular registrado.', 'この名前は、登録所有者としてIMPIの公式商標証明書に記載されます。')} />
                    </label>
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
                    <label className={labelClass}>{tri('Contact Person (if different from the Owner)', '联系人（如与所有人不同）', 'Persona de Contacto (si difiere del Titular)', 'Kontaktperson (falls abweichend vom Inhaber)', 'Personne de contact (si différente du titulaire)', 'संपर्क व्यक्ति (यदि मालिक से अलग हो)', 'Pessoa de Contato (se diferente do Titular)', '担当者（所有者と異なる場合）')}</label>
                    <input type="text" className={inputClass} value={form.contactPerson} onChange={e => set({ contactPerson: e.target.value })} />
                  </div>
                  <div className="sm:col-span-2">
                    <label className={labelClass}>{tri('Address (Street & Number) *', '地址（街道和门牌号）*', 'Domicilio (Calle y Número) *', 'Adresse (Straße und Nr.) *', 'Adresse (Rue et numéro) *', 'पता (गली और नंबर) *', 'Endereço (Rua e Número) *', '住所（番地・丁目）*')}</label>
                    <input type="text" required className={inputClass} value={form.address} onChange={e => set({ address: e.target.value })} />
                  </div>
                  <div>
                    <label className={labelClass}>{tri('City *', '城市 *', 'Ciudad *', 'Stadt *', 'Ville *', 'शहर *', 'Cidade *', '市区町村 *')}</label>
                    <input type="text" required className={inputClass} value={form.city} onChange={e => set({ city: e.target.value })} />
                  </div>
                  <div>
                    <label className={labelClass}>{tri('Postal Code *', '邮政编码 *', 'Código Postal *', 'Postleitzahl *', 'Code postal *', 'पिन कोड *', 'CEP *', '郵便番号 *')}</label>
                    <input type="text" required className={inputClass} value={form.postalCode} onChange={e => set({ postalCode: e.target.value })} />
                  </div>
                  <div>
                    <label className={labelClass}>
                      {tri('Email Address *', '电子邮件 *', 'Correo Electrónico *', 'E-Mail-Adresse *', 'Adresse e-mail *', 'ईमेल पता *', 'Endereço de E-mail *')}
                      <InfoTooltip text={t('tooltip.ownerEmail')} />
                    </label>
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
                    <label className={labelClass}>{tri('Phone / WeChat', '电话 / 微信', 'Teléfono / WeChat', 'Telefon / WeChat', 'Téléphone / WeChat', 'फोन / WeChat', 'Telefone / WeChat')}</label>
                    <div className="flex gap-2">
                      <select
                        className="border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent w-48 flex-shrink-0"
                        value={form.phoneDialCode}
                        onChange={e => set({ phoneDialCode: e.target.value })}
                      >
                        <option value="">{tri('Country Code', '国家区号', 'Código de País', 'Ländervorwahl', 'Indicatif pays', 'देश कोड', 'Código do País', '国番号')}</option>
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
                </div>
              </div>
            </div>
          )}

          {/* STEP 2 — Goods & Services (was Step 3) */}
          {step === 2 && (
            <div>
              <h2 className="text-lg font-bold text-navy-900 mb-1 flex items-center gap-2">
                {t('form.step2')}
                <InfoTooltip text={t('tooltip.niceClass')} />
              </h2>
              <p className="text-sm text-gray-500 mb-6">
                {tri('Describe the goods or services for each Nice Classification class you want to protect. Add as many classes as needed.', '描述每个您希望保护的尼斯分类类别的商品或服务。可以添加任意数量的类别。', 'Describe los bienes o servicios para cada clase de la Clasificación de Niza. Agrega tantas clases como necesites.', 'Beschreiben Sie die Waren oder Dienstleistungen für jede Nizza-Klasse. Fügen Sie so viele Klassen wie nötig hinzu.', 'Décrivez les produits ou services pour chaque classe de Nice. Ajoutez autant de classes que nécessaire.', 'प्रत्येक नाइस वर्गीकरण कक्षा के लिए वस्तुओं या सेवाओं का वर्णन करें। जितनी जरूरत हो उतनी कक्षाएं जोड़ें।', 'Descreva os bens ou serviços para cada classe de Nice. Adicione quantas classes forem necessárias.')}
              </p>
              {/* Reusing G&S content marker — inserted below as step2gscontent */}
              {/* STEP 2 content START */}
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
                          <button type="button" onClick={() => removeEntry(entry.id)} className="flex-shrink-0 text-gray-400 hover:text-red-500 transition-colors">
                            <Trash2 size={14} />
                          </button>
                        </div>
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
                            <button type="button" onClick={() => removeEntry(activeEntry.id)} className="flex-shrink-0 text-gray-400 hover:text-red-500 transition-colors">
                              <Trash2 size={14} />
                            </button>
                          </div>
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
                      onDescriptionChange={desc => updateEntry(activeEntry.id, { description: desc })}
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

          {/* STEP 3 — Clearance Review */}
          {step === 3 && (() => {
            const priorSearchName = sessionStorage.getItem('tcpSearchName') ?? '';
            const priorGoods = sessionStorage.getItem('tcpSearchGoods') ?? '';
            const hasPriorClearance = !!priorSearchName && priorSearchName.toLowerCase() === form.markName.trim().toLowerCase();
            const panelLang = (language === 'zh' ? 'zh' : language === 'es' ? 'es' : language === 'de' ? 'de' : language === 'fr' ? 'fr' : language === 'hi' ? 'hi' : language === 'pt' ? 'pt' : 'en') as 'en' | 'zh' | 'es' | 'de' | 'fr' | 'hi' | 'pt';
            return (
              <div>
                <h2 className="text-lg font-bold text-navy-900 mb-1 flex items-center gap-2">{t('form.step3')}</h2>
                <p className="text-sm text-gray-500 mb-6">
                  {tri(
                    'Review trademark availability before proceeding. This helps you assess any conflicts with existing marks.',
                    '在继续之前检索商标可用性，帮助您评估与现有商标的潜在冲突。',
                    'Verifica la disponibilidad de tu marca antes de continuar. Esto te ayuda a evaluar posibles conflictos con marcas existentes.',
                    'Überprüfen Sie die Markenverfügbarkeit vor dem Fortfahren.',
                    'Vérifiez la disponibilité de la marque avant de continuer.',
                    'आगे बढ़ने से पहले ट्रेडमार्क उपलब्धता की जांच करें।',
                    'Verifique a disponibilidade da marca antes de continuar.',
                  )}
                </p>

                {hasPriorClearance && !clearanceSkipped ? (
                  <div className="space-y-4">
                    <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-2">
                      <CheckCircle2 size={18} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-emerald-800">
                          {tri('Clearance results found from your earlier search', '已找到您之前搜索的检索结果', 'Resultados de búsqueda previos encontrados', 'Frühere Suchergebnisse gefunden', 'Résultats de recherche antérieure trouvés', 'आपकी पहले की खोज के परिणाम मिले', 'Resultados de pesquisa anterior encontrados')}
                        </p>
                        <p className="text-xs text-emerald-700 mt-0.5">
                          {tri(`For mark: "${priorSearchName}"${priorGoods ? ` · ${priorGoods.slice(0, 60)}${priorGoods.length > 60 ? '…' : ''}` : ''}`, `商标："${priorSearchName}"`, `Marca: "${priorSearchName}"`)}
                        </p>
                      </div>
                    </div>
                    <TrademarkClearancePanel
                      markName={priorSearchName}
                      goodsServices={priorGoods}
                      classes={allSelectedClassNumbers}
                      language={panelLang}
                      onResult={r => { setClearanceResults(prev => ({ ...prev, _prior: r })); setStep3RiskAcknowledged(false); }}
                      onSelectDespiteRisk={() => {}}
                      onRiskAcknowledgedChange={ack => setStep3RiskAcknowledged(ack)}
                    />
                    <button
                      type="button"
                      onClick={() => setClearanceSkipped(true)}
                      className="text-xs text-gray-500 hover:text-gray-700 underline underline-offset-2"
                    >
                      {tri('Run a new clearance check instead', '运行新的商标检索', 'Realizar una nueva búsqueda de disponibilidad', 'Neue Recherche durchführen', 'Effectuer une nouvelle recherche', 'नई क्लीयरेंस जांच चलाएं', 'Realizar uma nova verificação de disponibilidade')}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {form.markName.trim() && (
                      <TrademarkClearancePanel
                        markName={form.markName}
                        goodsServices={form.classEntries.map(e => e.description).filter(Boolean).join('; ')}
                        classes={allSelectedClassNumbers}
                        language={panelLang}
                        onResult={r => { setClearanceResults(prev => ({ ...prev, _step3: r })); setStep3RiskAcknowledged(false); }}
                        onSelectDespiteRisk={() => setShowConflictModal(false)}
                        onRiskAcknowledgedChange={ack => setStep3RiskAcknowledged(ack)}
                      />
                    )}
                  </div>
                )}
              </div>
            );
          })()}

          {/* STEP 4 — Prior Use */}
          {step === 4 && (
            <div>
              <h2 className="text-lg font-bold text-navy-900 mb-1">{t('form.step4')}</h2>
              <p className="text-sm text-gray-500 mb-6">
                {tri('Tell us about any prior use of this mark and whether you are claiming priority from a foreign application.', '请告诉我们该商标是否已在使用，以及您是否主张外国申请的优先权。', 'Indícanos si esta marca ya está siendo usada y si reclamas prioridad de una solicitud extranjera.', 'Teilen Sie uns mit, ob diese Marke bereits verwendet wird und ob Sie Priorität aus einer ausländischen Anmeldung beanspruchen.', 'Indiquez si cette marque est déjà utilisée et si vous revendiquez la priorité d\'une demande étrangère.', 'हमें बताएं कि क्या यह चिह्न पहले से उपयोग में है और क्या आप किसी विदेशी आवेदन से प्राथमिकता का दावा कर रहे हैं।', 'Informe-nos se esta marca já está em uso e se você reivindica prioridade de um pedido estrangeiro.', 'この商標がすでに使用されているか、また外国出願から優先権を主張するかをお知らせください。')}
              </p>
              <div className="space-y-5">
                {/* Radio cards: used vs not used */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => set({ usedInMexico: true })}
                    className={`text-left border-2 rounded-xl p-5 transition-all ${form.usedInMexico === true ? 'border-gold-500 bg-gold-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${form.usedInMexico === true ? 'border-gold-500' : 'border-gray-300'}`}>
                        {form.usedInMexico === true && <div className="w-2 h-2 rounded-full bg-gold-500" />}
                      </div>
                      <div>
                        <div className={`text-sm font-semibold leading-snug ${form.usedInMexico === true ? 'text-gold-800' : 'text-gray-800'}`}>
                          {tri('This mark is already used in Mexico', '该商标已在墨西哥使用', 'Esta marca ya se usa en México', 'Diese Marke wird bereits in Mexiko verwendet', 'Cette marque est déjà utilisée au Mexique', 'यह चिह्न पहले से मेक्सिको में उपयोग हो रहा है', 'Esta marca já é usada no México', 'この商標はすでにメキシコで使用されています')}
                        </div>
                        <div className="text-xs text-gray-500 mt-1 leading-relaxed">
                          {tri('You have commercially used this mark in Mexico before filing.', '您在申请前已在墨西哥商业使用此商标。', 'Ha utilizado esta marca comercialmente en México antes de solicitar.', 'Sie haben diese Marke vor der Anmeldung kommerziell in Mexiko verwendet.', 'Vous avez utilisé cette marque commercialement au Mexique avant de déposer.', 'आपने दाखिल करने से पहले मेक्सिको में इस चिह्न का व्यावसायिक उपयोग किया है।', 'Você usou esta marca comercialmente no México antes de depositar.', '出願前にメキシコでこの商標を商業的に使用しました。')}
                        </div>
                      </div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => set({ usedInMexico: false })}
                    className={`text-left border-2 rounded-xl p-5 transition-all ${form.usedInMexico === false ? 'border-navy-500 bg-navy-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${form.usedInMexico === false ? 'border-navy-500' : 'border-gray-300'}`}>
                        {form.usedInMexico === false && <div className="w-2 h-2 rounded-full bg-navy-500" />}
                      </div>
                      <div>
                        <div className={`text-sm font-semibold leading-snug ${form.usedInMexico === false ? 'text-navy-800' : 'text-gray-800'}`}>
                          {tri('This mark has not yet been used in Mexico', '该商标尚未在墨西哥使用', 'Esta marca aún no ha sido usada en México', 'Diese Marke wurde noch nicht in Mexiko verwendet', 'Cette marque n\'a pas encore été utilisée au Mexique', 'यह चिह्न अभी तक मेक्सिको में उपयोग नहीं हुआ है', 'Esta marca ainda não foi usada no México', 'この商標はまだメキシコで使用されていません')}
                        </div>
                        <div className="text-xs text-gray-500 mt-1 leading-relaxed">
                          {tri('You are filing on an intent-to-use basis.', '您基于使用意图提出申请。', 'Está solicitando con base en intención de uso.', 'Sie melden auf Basis der Verwendungsabsicht an.', 'Vous déposez sur la base d\'une intention d\'utilisation.', 'आप उपयोग की मंशा के आधार पर दाखिल कर रहे हैं।', 'Você está depositando com base em intenção de uso.', '使用意思に基づいて出願しています。')}
                        </div>
                      </div>
                    </div>
                  </button>
                </div>
                {form.usedInMexico === true && (
                  <div className="bg-white border border-gray-200 rounded-xl p-5">
                    <label className={labelClass}>{tri('First Use Date in Mexico', '在墨西哥首次使用日期', 'Fecha de Primer Uso en México', 'Erstes Verwendungsdatum in Mexiko', 'Date de première utilisation au Mexique', 'मेक्सिको में पहले उपयोग की तारीख', 'Data do Primeiro Uso no México', 'メキシコでの初使用日')}</label>
                    <input type="date" className={inputClass} value={form.firstUseDate} onChange={e => set({ firstUseDate: e.target.value })} />
                  </div>
                )}

                <div className="bg-white border border-gray-200 rounded-xl p-5">
                  <div className="flex items-start gap-3 mb-3">
                    <input type="checkbox" id="priorityClaimed" checked={form.priorityClaimed} onChange={e => set({ priorityClaimed: e.target.checked })} className="mt-0.5 rounded border-gray-300 text-gold-500" />
                    <label htmlFor="priorityClaimed" className="text-sm font-medium text-gray-800 leading-snug">
                      {tri('Claiming priority from a foreign application', '声明来自外国申请的优先权', 'Reclama prioridad de una solicitud extranjera', 'Priorität aus einer ausländischen Anmeldung beanspruchen', 'Revendiquer la priorité d\'une demande étrangère', 'विदेशी आवेदन से प्राथमिकता का दावा', 'Reivindicando prioridade de um pedido estrangeiro', '外国出願から優先権を主張する')}
                      <InfoTooltip text={t('tooltip.priorityClaim')} />
                    </label>
                  </div>
                  {form.priorityClaimed && (
                    <div className="grid sm:grid-cols-2 gap-4 pl-7">
                      <div>
                        <label className={labelClass}>{tri('Priority Country', '优先权国家', 'País de Prioridad', 'Prioritätsland', 'Pays de priorité', 'प्राथमिकता देश', 'País de Prioridade', '優先権国')}</label>
                        <input type="text" className={inputClass} value={form.priorityCountry} onChange={e => set({ priorityCountry: e.target.value })} />
                      </div>
                      <div>
                        <label className={labelClass}>{tri('Application Number', '申请号', 'Número de Solicitud', 'Antragsnummer', 'Numéro de demande', 'आवेदन नंबर', 'Número do Pedido', '出願番号')}</label>
                        <input type="text" className={inputClass} value={form.priorityAppNumber} onChange={e => set({ priorityAppNumber: e.target.value })} />
                      </div>
                      <div>
                        <label className={labelClass}>{tri('Filing Date', '申请日期', 'Fecha de Presentación', 'Einreichungsdatum', 'Date de dépôt', 'दाखिल तारीख', 'Data de Protocolo', '出願日')}</label>
                        <input type="date" className={inputClass} value={form.priorityFilingDate} onChange={e => set({ priorityFilingDate: e.target.value })} />
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-start gap-3">
                  <input type="checkbox" id="isOwner" checked={form.isOwner} onChange={e => set({ isOwner: e.target.checked })} className="mt-0.5 rounded border-gray-300 text-gold-500" />
                  <label htmlFor="isOwner" className="text-sm text-gray-700 leading-snug">
                    {tri('I confirm I am the owner of this mark', '我确认我是该商标的所有人', 'Confirmo que soy el titular de esta marca', 'Ich bestätige, dass ich der Inhaber dieser Marke bin', 'Je confirme être le titulaire de cette marque', 'मैं पुष्टि करता/करती हूं कि मैं इस चिह्न का मालिक हूं', 'Confirmo que sou o titular desta marca', '私はこの商標の所有者であることを確認します')}
                  </label>
                </div>

              </div>
            </div>
          )}

          {/* STEP 6 — Review */}
          {step === 6 && (() => {
            const EditBtn = ({ targetStep }: { targetStep: Step }) => (
              <button
                type="button"
                onClick={() => setStep(targetStep)}
                className="flex items-center gap-1 text-xs font-medium text-gold-600 hover:text-gold-700 transition-colors px-2 py-1 rounded hover:bg-gold-50"
              >
                <Pencil size={12} />
                {tri('Edit', '编辑', 'Editar', 'Bearbeiten', 'Modifier', 'संपादित करें', 'Editar', '編集')}
              </button>
            );

            const ReviewRow = ({ label, val }: { label: string; val: string }) => (
              <div className="flex px-4 py-2.5 gap-4">
                <span className="text-xs text-gray-500 w-36 flex-shrink-0">{label}</span>
                <span className="text-sm text-gray-800 break-words min-w-0">{val || '—'}</span>
              </div>
            );

            const markTypeLabel = {
              word: tri('Word Mark', '文字商标', 'Marca Denominativa', 'Wortmarke', 'Marque verbale', 'शब्द चिह्न', 'Marca Denominativa', '文字商標'),
              design: tri('Design / Logo', '图形/标志', 'Diseño / Logo', 'Design / Logo', 'Marque figurative', 'डिज़ाइन / लोगो', 'Marca Figurativa', 'デザイン/ロゴ'),
              combined: tri('Combined', '组合', 'Denominativa + Diseño', 'Kombiniert', 'Mixte', 'संयुक्त', 'Combinada', '結合'),
              trade_name: tri('Trade Name', '商号', 'Nombre Comercial', 'Handelsname', 'Nom commercial', 'व्यापार नाम', 'Nome Comercial', '商号'),
              slogan: tri('Slogan', '口号', 'Eslogan', 'Slogan', 'Slogan', 'नारा', 'Slogan', 'スローガン'),
            }[form.markType] ?? form.markType;

            return (
              <div>
                <h2 className="text-lg font-bold text-navy-900 mb-2">{t('form.step6')}</h2>
                <p className="text-sm text-gray-500 mb-6">
                  {tri('Review all details below. Click Edit on any section to make changes.', '请仔细检查以下所有信息。点击各栏的编辑按钮进行修改。', 'Revisa todos los detalles a continuación. Haz clic en Editar para modificar cualquier sección.', 'Überprüfen Sie alle Details unten. Klicken Sie auf Bearbeiten, um Änderungen vorzunehmen.', 'Vérifiez tous les détails ci-dessous. Cliquez sur Modifier pour apporter des changements.', 'नीचे सभी विवरण जांचें। किसी भी अनुभाग में परिवर्तन करने के लिए संपादित करें पर क्लिक करें।', 'Revise todos os detalhes abaixo. Clique em Editar para fazer alterações.', '以下のすべての詳細を確認してください。変更するには各セクションの編集をクリックしてください。')}
                </p>
                {/* Mexico filing notice */}
                <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl p-4 mb-2">
                  <Info size={18} className="text-blue-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-blue-800 font-medium leading-snug">
                    {t('review.mexicoNotice')}
                  </p>
                </div>

                <div className="space-y-4">

                  {/* Applicant */}
                  <div className="border border-gray-200 rounded-xl overflow-hidden">
                    <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200 flex items-center justify-between">
                      <span className="text-sm font-semibold text-navy-900">{tri('Applicant', '申请人', 'Solicitante', 'Antragsteller', 'Déposant', 'आवेदक', 'Solicitante', '出願人')}</span>
                      <EditBtn targetStep={5} />
                    </div>
                    <div className="divide-y divide-gray-100">
                      <ReviewRow label={tri('Legal Name', '法定名称', 'Nombre o Razón Social', 'Rechtlicher Name', 'Nom légal', 'कानूनी नाम', 'Nome Legal', '法人名')} val={form.legalName} />
                      <ReviewRow label={tri('Type', '类型', 'Tipo', 'Typ', 'Type', 'प्रकार', 'Tipo', '種類')} val={form.applicantType === 'company' ? tri('Company', '公司', 'Empresa', 'Unternehmen', 'Entreprise', 'कंपनी', 'Empresa', '法人') : tri('Individual', '个人', 'Persona Física', 'Einzelperson', 'Particulier', 'व्यक्ति', 'Pessoa Física', '個人')} />
                      <ReviewRow label={tri('Country', '国家', 'País', 'Land', 'Pays', 'देश', 'País', '国')} val={form.country ? (sortedCountries.find(c => c.code === form.country)?.[language as SupportedLang] || form.country) : ''} />
                      <ReviewRow label={tri('Address', '地址', 'Domicilio', 'Adresse', 'Adresse', 'पता', 'Endereço', '住所')} val={form.address} />
                      <ReviewRow label={tri('City', '城市', 'Ciudad', 'Stadt', 'Ville', 'शहर', 'Cidade', '市区町村')} val={form.city} />
                      {form.stateProvince && <ReviewRow label={tri('State / Province', '州/省', 'Estado / Provincia', 'Bundesland', 'État / Province', 'राज्य', 'Estado', '都道府県')} val={form.stateProvince} />}
                      <ReviewRow label={tri('Postal Code', '邮政编码', 'Código Postal', 'Postleitzahl', 'Code postal', 'पिन कोड', 'CEP', '郵便番号')} val={form.postalCode} />
                      <ReviewRow label={tri('Email', '电子邮件', 'Correo', 'E-Mail', 'E-mail', 'ईमेल', 'E-mail', 'メール')} val={form.email} />
                      {(form.phoneDialCode || form.phoneNumber) && <ReviewRow label={tri('Phone', '电话', 'Teléfono', 'Telefon', 'Téléphone', 'फोन', 'Telefone', '電話')} val={[form.phoneDialCode, form.phoneNumber].filter(Boolean).join(' ')} />}
                      {form.contactPerson && <ReviewRow label={tri('Contact Person', '联系人', 'Persona de Contacto', 'Kontaktperson', 'Personne de contact', 'संपर्क व्यक्ति', 'Pessoa de Contato', '担当者')} val={form.contactPerson} />}
                      {form.taxId && <ReviewRow label={tri('Tax ID', '税号', 'RFC', 'Steuer-ID', 'N° fiscal', 'टैक्स ID', 'CNPJ/CPF', '税番号')} val={form.taxId} />}
                    </div>
                  </div>

                  {/* Trademark */}
                  <div className="border border-gray-200 rounded-xl overflow-hidden">
                    <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200 flex items-center justify-between">
                      <span className="text-sm font-semibold text-navy-900">{tri('Trademark', '商标', 'Marca', 'Marke', 'Marque', 'ट्रेडमार्क', 'Marca', '商標')}</span>
                      <EditBtn targetStep={1} />
                    </div>
                    <div className="divide-y divide-gray-100">
                      <ReviewRow label={tri('Mark Name', '商标名称', 'Nombre de Marca', 'Markenname', 'Nom de marque', 'चिह्न का नाम', 'Nome da Marca', '商標名')} val={form.markName} />
                      <ReviewRow label={tri('Mark Type', '商标类型', 'Tipo de Marca', 'Markentyp', 'Type de marque', 'चिह्न का प्रकार', 'Tipo de Marca', '商標種別')} val={markTypeLabel} />
                      <ReviewRow label={tri('Language', '语言', 'Idioma', 'Sprache', 'Langue', 'भाषा', 'Idioma', '言語')} val={form.markLanguage} />
                      {form.containsNonSpanish && <ReviewRow label={tri('Non-Spanish', '非西班牙语', 'No español', 'Nicht-Spanisch', 'Non espagnol', 'गैर-स्पेनिश', 'Não espanhol', '非スペイン語')} val={tri('Yes', '是', 'Sí', 'Ja', 'Oui', 'हाँ', 'Sim', 'はい')} />}
                      {form.meaningSpanish && <ReviewRow label={tri('Meaning (ES)', '西班牙语含义', 'Significado', 'Bedeutung', 'Signification', 'अर्थ', 'Significado', '意味')} val={form.meaningSpanish} />}
                      {form.transliteration && <ReviewRow label={tri('Transliteration', '音译', 'Transliteración', 'Transliteration', 'Translittération', 'लिप्यंतरण', 'Transliteração', '翻字')} val={form.transliteration} />}
                      {form.claimsColor && <ReviewRow label={tri('Color Claim', '颜色声明', 'Reclamo de Color', 'Farbanspruch', 'Revendication couleur', 'रंग दावा', 'Reivindicação de Cor', '色彩主張')} val={form.colorDescription || tri('Yes', '是', 'Sí', 'Ja', 'Oui', 'हाँ', 'Sim', 'はい')} />}
                      {form.markDescription && <ReviewRow label={tri('Description', '描述', 'Descripción', 'Beschreibung', 'Description', 'विवरण', 'Descrição', '説明')} val={form.markDescription} />}
                      {form.logoFile && <ReviewRow label={tri('Logo File', '标志文件', 'Archivo de Logo', 'Logo-Datei', 'Fichier logo', 'लोगो फ़ाइल', 'Arquivo de Logo', 'ロゴファイル')} val={form.logoFile.name} />}
                    </div>
                  </div>

                  {/* Goods & Services */}
                  <div className="border border-gray-200 rounded-xl overflow-hidden">
                    <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200 flex items-center justify-between">
                      <span className="text-sm font-semibold text-navy-900">{tri('Goods & Services', '商品和服务', 'Bienes y Servicios', 'Waren & Dienstleistungen', 'Produits & services', 'वस्तुएं और सेवाएं', 'Bens e Serviços', '商品・サービス')}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-500">{totalClasses} {tri('class(es)', '个类别', 'clase(s)', 'Klasse(n)', 'classe(s)', 'वर्ग', 'classe(s)', 'クラス')}</span>
                        <EditBtn targetStep={2} />
                      </div>
                    </div>
                    <div className="divide-y divide-gray-100">
                      {form.classEntries.map((entry) => {
                        const classNums = entry.isConfirmed && entry.classNumber !== null
                          ? [entry.classNumber]
                          : entry.fallbackClasses;
                        if (classNums.length === 0) return null;
                        return (
                          <div key={entry.id} className="px-4 py-3">
                            <div className="flex flex-wrap gap-1.5 mb-1.5">
                              {classNums.map(cn => {
                                const nc = ALL_CLASSES.find(c => c.classNumber === cn);
                                return (
                                  <span key={cn} className="text-xs font-bold bg-navy-100 text-navy-700 px-2 py-0.5 rounded-full">
                                    Class {cn}{nc ? ` — ${nc.titleEn}` : ''}
                                  </span>
                                );
                              })}
                            </div>
                            {entry.description && (
                              <p className="text-xs text-gray-500 leading-relaxed">{entry.description}</p>
                            )}
                            {entry.descriptionEn && (
                              <p className="text-xs text-gray-600 mt-0.5 italic">{entry.descriptionEn}</p>
                            )}
                          </div>
                        );
                      })}
                      {totalClasses === 0 && (
                        <div className="px-4 py-3 text-sm text-gray-400">
                          {tri('No classes selected', '未选择类别', 'Sin clases seleccionadas', 'Keine Klassen ausgewählt', 'Aucune classe sélectionnée', 'कोई कक्षा नहीं चुनी', 'Nenhuma classe selecionada', 'クラス未選択')}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Prior Use & Priority */}
                  <div className="border border-gray-200 rounded-xl overflow-hidden">
                    <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200 flex items-center justify-between">
                      <span className="text-sm font-semibold text-navy-900">{tri('Prior Use & Priority', '在先使用和优先权', 'Uso Previo y Prioridad', 'Vorbenutzt & Priorität', 'Usage antérieur & Priorité', 'पूर्व उपयोग और प्राथमिकता', 'Uso Anterior e Prioridade', '先使用・優先権')}</span>
                      <EditBtn targetStep={4} />
                    </div>
                    <div className="divide-y divide-gray-100">
                      <ReviewRow label={tri('Used in Mexico', '在墨西哥使用', 'Usada en México', 'In Mexiko verwendet', 'Utilisée au Mexique', 'मेक्सिको में उपयोग', 'Usada no México', 'メキシコで使用')} val={form.usedInMexico ? tri('Yes', '是', 'Sí', 'Ja', 'Oui', 'हाँ', 'Sim', 'はい') : tri('No', '否', 'No', 'Nein', 'Non', 'नहीं', 'Não', 'いいえ')} />
                      {form.usedInMexico && form.firstUseDate && <ReviewRow label={tri('First Use Date', '首次使用日期', 'Fecha Primer Uso', 'Erstbenutzungsdatum', 'Date 1er usage', 'पहले उपयोग की तारीख', 'Data 1º Uso', '初使用日')} val={form.firstUseDate} />}
                      <ReviewRow label={tri('Priority Claimed', '声明优先权', 'Prioridad Reclamada', 'Priorität beansprucht', 'Priorité revendiquée', 'प्राथमिकता का दावा', 'Prioridade Reivindicada', '優先権主張')} val={form.priorityClaimed ? tri('Yes', '是', 'Sí', 'Ja', 'Oui', 'हाँ', 'Sim', 'はい') : tri('No', '否', 'No', 'Nein', 'Non', 'नहीं', 'Não', 'いいえ')} />
                      {form.priorityClaimed && form.priorityCountry && <ReviewRow label={tri('Priority Country', '优先权国家', 'País de Prioridad', 'Prioritätsland', 'Pays de priorité', 'प्राथमिकता देश', 'País de Prioridade', '優先権国')} val={form.priorityCountry} />}
                      {form.priorityClaimed && form.priorityAppNumber && <ReviewRow label={tri('App. Number', '申请号', 'Nº Solicitud', 'Antragsnr.', 'Nº demande', 'आवेदन नं.', 'Nº Pedido', '出願番号')} val={form.priorityAppNumber} />}
                      {form.priorityClaimed && form.priorityFilingDate && <ReviewRow label={tri('Filing Date', '申请日期', 'Fecha Presentación', 'Einreichungsdatum', 'Date de dépôt', 'दाखिल तारीख', 'Data Protocolo', '出願日')} val={form.priorityFilingDate} />}
                      <ReviewRow label={tri('Owner Confirmed', '所有人确认', 'Titular Confirmado', 'Inhaber bestätigt', 'Titulaire confirmé', 'मालिक पुष्टि', 'Titular Confirmado', '所有者確認')} val={form.isOwner ? tri('Yes', '是', 'Sí', 'Ja', 'Oui', 'हाँ', 'Sim', 'はい') : tri('No', '否', 'No', 'Nein', 'Non', 'नहीं', 'Não', 'いいえ')} />
                    </div>
                  </div>

                  {Object.keys(clearanceResults).length > 0 && (
                    <div className="border border-gray-200 rounded-xl overflow-hidden">
                      <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200">
                        <span className="text-sm font-semibold text-navy-900">{tri('Clearance Check Summary', '商标检索摘要', 'Resumen de Búsqueda de Disponibilidad', 'Zusammenfassung der Markenrecherche', 'Résumé de la vérification de disponibilité', 'क्लीयरेंस जांच सारांश', 'Resumo da Verificação de Disponibilidade', '商標調査結果')}</span>
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
                                  ? (tri('Low risk', '低风险', 'Riesgo bajo', 'Niedriges Risiko', 'Risque faible', 'कम जोखिम', 'Baixo risco', '低リスク'))
                                  : res.risk === 'medium'
                                  ? (tri('Medium risk', '中等风险', 'Riesgo medio', 'Mittleres Risiko', 'Risque modéré', 'मध्यम जोखिम', 'Risco médio', '中リスク'))
                                  : (tri('High risk', '高风险', 'Riesgo alto', 'Hohes Risiko', 'Risque élevé', 'उच्च जोखिम', 'Alto risco', '高リスク'))}
                              </span>
                              <span className="text-xs text-gray-400">
                                {res.marciaFindings.length + res.webFindings.length} {tri('findings', '条结果', 'resultados', 'Ergebnisse', 'résultats', 'परिणाम', 'resultados', '件')}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <p className="text-xs text-amber-800 font-medium">
                      {tri('Spanish translation status: Pending admin review. Our team will review and confirm all translations before filing.', '西班牙语翻译状态：待管理员审查。我们的团队将在提交前审查并确认所有翻译。', 'Estado de redacción en español: Pendiente de revisión. Nuestro equipo revisará y confirmará la redacción antes de presentar la solicitud.', 'Status der spanischen Übersetzung: Ausstehende Prüfung. Unser Team prüft und bestätigt alle Übersetzungen vor der Einreichung.', 'Statut de la traduction espagnole : Révision en attente. Notre équipe examinera et confirmera toutes les traductions avant le dépôt.', 'स्पेनिश अनुवाद स्थिति: व्यवस्थापक समीक्षा लंबित। हमारी टीम दाखिल करने से पहले सभी अनुवादों की समीक्षा करेगी।', 'Status da tradução para espanhol: Revisão pendente. Nossa equipe revisará e confirmará todas as traduções antes do protocolo.', 'スペイン語翻訳状態：管理者審査待ち。出願前にチームが全翻訳を確認します。')}
                    </p>
                  </div>

                  {/* Registrability risk summary from clearance checks */}
                  {(() => {
                    const allFlags = Object.values(clearanceResults).flatMap(r => r.registrabilityFlags ?? []);
                    const highCount = allFlags.filter(f => f.severity === 'high').length;
                    const medCount = allFlags.filter(f => f.severity === 'medium').length;
                    if (allFlags.length === 0) return null;
                    return (
                      <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                        <div className="flex items-start gap-2 mb-2">
                          <AlertCircle size={15} className="text-red-600 flex-shrink-0 mt-0.5" />
                          <p className="text-xs font-bold text-red-800">
                            {tri(
                              `Registrability Risk Detected (${allFlags.length} issue${allFlags.length !== 1 ? 's' : ''})`,
                              `检测到可注册性风险（${allFlags.length}个问题）`,
                              `Riesgo de Registrabilidad Detectado (${allFlags.length} problema${allFlags.length !== 1 ? 's' : ''})`,
                              `Registrierbarkeitsrisiko erkannt (${allFlags.length} Problem${allFlags.length !== 1 ? 'e' : ''})`,
                              `Risque de registrabilité détecté (${allFlags.length} problème${allFlags.length !== 1 ? 's' : ''})`,
                              `पंजीकरण योग्यता जोखिम मिला (${allFlags.length} समस्या${allFlags.length !== 1 ? 'एं' : ''})`,
                              `Risco de Registrabilidade Detectado (${allFlags.length} problema${allFlags.length !== 1 ? 's' : ''})`,
                              `登録可能性リスク検出 (${allFlags.length}件の問題)`
                            )}
                          </p>
                        </div>
                        {(highCount > 0 || medCount > 0) && (
                          <p className="text-xs text-red-700 mb-2 leading-relaxed">
                            {tri(
                              `Our AI analysis detected ${highCount > 0 ? `${highCount} high-severity` : ''}${highCount > 0 && medCount > 0 ? ' and ' : ''}${medCount > 0 ? `${medCount} medium-severity` : ''} issue${(highCount + medCount) !== 1 ? 's' : ''} that may cause IMPI to refuse this mark. Review the Goods & Services step for details.`,
                              `AI分析检测到${highCount > 0 ? `${highCount}个高风险` : ''}${highCount > 0 && medCount > 0 ? '和' : ''}${medCount > 0 ? `${medCount}个中等风险` : ''}问题，可能导致IMPI驳回该商标。请在商品和服务步骤中查看详情。`,
                              `Nuestro análisis de IA detectó ${highCount > 0 ? `${highCount} problema${highCount !== 1 ? 's' : ''} de alta gravedad` : ''}${highCount > 0 && medCount > 0 ? ' y ' : ''}${medCount > 0 ? `${medCount} de gravedad media` : ''} que pueden causar que el IMPI rechace esta marca. Revisa el paso de Bienes y Servicios para más detalles.`,
                              undefined, undefined, undefined, undefined,
                              `当社のAI分析では、IMPIがこの商標を拒絶する可能性がある${highCount > 0 ? `高重大度${highCount}件` : ''}${highCount > 0 && medCount > 0 ? 'および' : ''}${medCount > 0 ? `中重大度${medCount}件` : ''}の問題が検出されました。`
                            )}
                          </p>
                        )}
                        <p className="text-xs text-red-600 font-medium">
                          {tri(
                            'Filing is allowed at your own risk. All fees are non-refundable regardless of IMPI\'s decision.',
                            '您可自行承担风险继续提交。无论IMPI的决定如何，所有费用均不予退还。',
                            'Puedes presentar la solicitud bajo tu propio riesgo. Todos los honorarios son no reembolsables independientemente de la decisión del IMPI.',
                            'Eine Anmeldung ist auf eigenes Risiko möglich. Alle Gebühren sind unabhängig von der Entscheidung des IMPI nicht erstattungsfähig.',
                            'Le dépôt est autorisé à vos risques. Tous les honoraires sont non remboursables quelle que soit la décision de l\'IMPI.',
                            'दाखिल करना आपके अपने जोखिम पर अनुमत है। IMPI के निर्णय की परवाह किए बिना सभी शुल्क वापस नहीं होंगे।',
                            'O protocolo é permitido por sua conta e risco. Todos os honorários são irrecuperáveis independentemente da decisão do IMPI.',
                            '出願はご自身のリスクで許可されています。IMPIの決定に関わらず、すべての料金は返金不可です。'
                          )}
                        </p>
                      </div>
                    );
                  })()}

                  {/* No-guarantee / no-refund disclaimer + checkboxes */}
                  <div className="border-2 border-red-300 rounded-xl overflow-hidden">
                    <div className="bg-red-600 px-4 py-3 flex items-center gap-2">
                      <AlertTriangle size={15} className="text-white flex-shrink-0" />
                      <p className="text-sm font-bold text-white">
                        {tri(
                          'Important Disclaimer — Please Read Before Proceeding',
                          '重要声明 — 继续前请仔细阅读',
                          'Aviso Importante — Lea Antes de Continuar',
                          'Wichtiger Hinweis — Bitte Vor dem Fortfahren Lesen',
                          'Avis Important — Veuillez Lire Avant de Continuer',
                          'महत्वपूर्ण अस्वीकरण — आगे बढ़ने से पहले पढ़ें',
                          'Aviso Importante — Leia Antes de Continuar',
                          '重要な免責事項 — 続行前にお読みください'
                        )}
                      </p>
                    </div>
                    <div className="bg-red-50 px-4 py-4 space-y-3">
                      <p className="text-xs text-red-900 leading-relaxed">
                        {tri(
                          'Filing a trademark application does not guarantee registration. IMPI (Instituto Mexicano de la Propiedad Industrial) may refuse the application for any of the grounds established in Mexico\'s Ley Federal de Protección a la Propiedad Industrial (LFPPI), including but not limited to: descriptive or generic marks, confusingly similar prior marks, famous or notorious marks, deceptive signs, geographic indications, official emblems, and marks contrary to public order. The automated clearance analysis provided is preliminary and informational only — it does not constitute a legal clearance opinion or guarantee of registrability.',
                          '提交商标申请并不保证注册成功。IMPI（墨西哥工业产权局）可能基于墨西哥《联邦工业产权保护法》（LFPPI）规定的任何理由驳回申请，包括但不限于：描述性或通用性标志、与在先商标混淆相似、知名商标、欺骗性标志、地理标志、官方徽章及违反公共秩序的标志。所提供的自动检索分析仅供参考，不构成法律检索意见或可注册性保证。',
                          'La presentación de una solicitud de registro de marca no garantiza su registro. El IMPI (Instituto Mexicano de la Propiedad Industrial) puede rechazar la solicitud por cualquiera de los motivos establecidos en la Ley Federal de Protección a la Propiedad Industrial (LFPPI) de México, incluyendo pero no limitándose a: signos descriptivos o genéricos, marcas confundiblemente similares a marcas previas, marcas famosas o notoriamente conocidas, signos engañosos, indicaciones geográficas, emblemas oficiales y signos contrarios al orden público. El análisis de disponibilidad automatizado proporcionado es únicamente preliminar e informativo — no constituye una opinión legal de disponibilidad ni garantía de registrabilidad.',
                          'Die Einreichung einer Markenanmeldung garantiert keine Eintragung. Das IMPI kann den Antrag aus jedem der in Mexikos LFPPI festgelegten Gründe ablehnen. Die automatisierte Recherche ist nur vorläufig und informativ.',
                          'Le dépôt d\'une demande de marque ne garantit pas l\'enregistrement. L\'IMPI peut refuser la demande pour tout motif prévu par la LFPPI mexicaine. L\'analyse automatisée est uniquement préliminaire et informative.',
                          'ट्रेडमार्क आवेदन दाखिल करना पंजीकरण की गारंटी नहीं देता। IMPI मेक्सिको की LFPPI में निर्धारित किसी भी कारण से आवेदन अस्वीकार कर सकता है। स्वचालित विश्लेषण केवल प्रारंभिक और सूचनात्मक है।',
                          'O protocolo de um pedido de marca não garante o registro. O IMPI pode recusar o pedido por qualquer dos motivos estabelecidos na LFPPI do México. A análise automatizada é apenas preliminar e informativa.',
                          '商標出願の提出は登録を保証するものではありません。IMPIはメキシコのLFPPIに定められたいかなる理由によっても出願を拒絶する場合があります。自動分析は予備的・情報提供のみです。'
                        )}
                      </p>
                      <p className="text-xs text-red-900 leading-relaxed font-medium">
                        {tri(
                          'All fees paid — including our service fees and IMPI government fees — are strictly non-refundable once payment is processed, regardless of the outcome of the examination or any subsequent IMPI decision.',
                          '一旦付款处理完成，所有已付费用——包括我们的服务费和IMPI官方费用——均严格不予退还，无论审查结果或IMPI后续决定如何。',
                          'Todos los honorarios pagados — incluyendo nuestros honorarios de servicio y las tasas oficiales del IMPI — son estrictamente no reembolsables una vez procesado el pago, independientemente del resultado del examen o cualquier decisión posterior del IMPI.',
                          'Alle gezahlten Gebühren — einschließlich unserer Servicegebühren und IMPI-Regierungsgebühren — sind nach der Zahlung streng nicht erstattungsfähig.',
                          'Tous les honoraires payés — y compris nos frais de service et les taxes gouvernementales de l\'IMPI — sont strictement non remboursables une fois le paiement traité.',
                          'भुगतान प्रसंस्कृत होने के बाद सभी भुगतान की गई फीस — सेवा शुल्क और IMPI सरकारी शुल्क सहित — सख्ती से वापस नहीं होगी।',
                          'Todos os honorários pagos — incluindo nossas taxas de serviço e as taxas governamentais do IMPI — são estritamente irrecuperáveis uma vez que o pagamento seja processado.',
                          '支払われたすべての料金（当社サービス料金およびIMPI政府手数料を含む）は、審査結果やIMPIのその後の決定に関わらず、支払い処理後は一切返金されません。'
                        )}
                      </p>

                      <div className="space-y-3 pt-1">
                        <label className="flex items-start gap-3 cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={agreedToTerms}
                            onChange={e => { setAgreedToTerms(e.target.checked); if (e.target.checked) setDisclaimerError(false); }}
                            className="mt-0.5 rounded border-red-300 text-red-600 focus:ring-red-500"
                          />
                          <span className="text-xs text-red-900 leading-relaxed group-hover:text-red-800">
                            {tri(
                              'I have read and agree to the Terms of Service governing this trademark filing service.',
                              '我已阅读并同意管理本商标申请服务的服务条款。',
                              'He leído y acepto los Términos de Servicio que rigen este servicio de registro de marcas.',
                              'Ich habe die Nutzungsbedingungen für diesen Markenanmeldungsservice gelesen und stimme ihnen zu.',
                              'J\'ai lu et j\'accepte les Conditions d\'utilisation régissant ce service de dépôt de marque.',
                              'मैंने इस ट्रेडमार्क दाखिल करने की सेवा को नियंत्रित करने वाली सेवा शर्तें पढ़ी हैं और उनसे सहमत हूं।',
                              'Li e concordo com os Termos de Serviço que regem este serviço de registro de marcas.',
                              '私はこの商標出願サービスを規定する利用規約を読み、同意します。'
                            )}
                          </span>
                        </label>

                        <label className="flex items-start gap-3 cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={agreedToDisclaimer}
                            onChange={e => { setAgreedToDisclaimer(e.target.checked); if (e.target.checked) setDisclaimerError(false); }}
                            className="mt-0.5 rounded border-red-300 text-red-600 focus:ring-red-500"
                          />
                          <span className="text-xs text-red-900 leading-relaxed group-hover:text-red-800">
                            {tri(
                              'I understand and acknowledge that: (a) filing does not guarantee registration; (b) IMPI may refuse my application for any reason under Mexican law; (c) all fees paid are non-refundable; and (d) I assume the entire risk related to the registrability of this mark.',
                              '我理解并承认：（a）提交申请不保证注册；（b）IMPI可能因墨西哥法律规定的任何原因驳回我的申请；（c）所有已付费用不予退还；（d）我承担与该商标可注册性相关的全部风险。',
                              'Entiendo y reconozco que: (a) presentar la solicitud no garantiza el registro; (b) el IMPI puede rechazar mi solicitud por cualquier motivo bajo la ley mexicana; (c) todos los honorarios pagados no son reembolsables; y (d) asumo el riesgo total relacionado con la registrabilidad de esta marca.',
                              'Ich verstehe und anerkenne, dass: (a) die Einreichung keine Eintragung garantiert; (b) das IMPI meinen Antrag aus jedem Grund nach mexikanischem Recht ablehnen kann; (c) alle gezahlten Gebühren nicht erstattungsfähig sind; und (d) ich das gesamte Risiko bezüglich der Eintragungsfähigkeit dieser Marke trage.',
                              'Je comprends et reconnais que : (a) le dépôt ne garantit pas l\'enregistrement ; (b) l\'IMPI peut rejeter ma demande pour tout motif prévu par la loi mexicaine ; (c) tous les honoraires payés sont non remboursables ; et (d) j\'assume l\'entier risque lié à la registrabilité de cette marque.',
                              'मैं समझता/समझती हूं और स्वीकार करता/करती हूं कि: (a) दाखिल करना पंजीकरण की गारंटी नहीं देता; (b) IMPI मेक्सिकन कानून के तहत किसी भी कारण से मेरा आवेदन अस्वीकार कर सकता है; (c) सभी भुगतान की गई फीस वापस नहीं होगी; और (d) मैं इस चिह्न की पंजीकरण योग्यता से संबंधित पूरा जोखिम वहन करता/करती हूं।',
                              'Entendo e reconheço que: (a) o protocolo não garante o registro; (b) o IMPI pode recusar meu pedido por qualquer motivo sob a lei mexicana; (c) todos os honorários pagos são irrecuperáveis; e (d) assumo o risco total relacionado à registrabilidade desta marca.',
                              '私は以下を理解し認めます：(a) 出願は登録を保証しない；(b) IMPIはメキシコ法のいかなる理由によっても私の出願を拒絶できる；(c) 支払われたすべての料金は返金不可；(d) この商標の登録可能性に関するリスクを全面的に引き受ける。'
                            )}
                          </span>
                        </label>
                      </div>

                      {disclaimerError && (
                        <div className="flex items-center gap-2 bg-red-100 border border-red-300 rounded-lg px-3 py-2 mt-2">
                          <AlertCircle size={13} className="text-red-600 flex-shrink-0" />
                          <p className="text-xs text-red-700 font-medium">
                            {tri(
                              'You must check both boxes above to proceed.',
                              '您必须勾选上述两个复选框才能继续。',
                              'Debes marcar ambas casillas para continuar.',
                              'Sie müssen beide Kästchen ankreuzen, um fortzufahren.',
                              'Vous devez cocher les deux cases pour continuer.',
                              'आगे बढ़ने के लिए आपको दोनों बॉक्स चेक करने होंगे।',
                              'Você deve marcar ambas as caixas para continuar.',
                              '続行するには両方のチェックボックスをオンにする必要があります。'
                            )}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* STEP 7 — Payment */}
          {step === 7 && (
            <div>
              <h2 className="text-lg font-bold text-navy-900 mb-6">{t('form.step7')}</h2>

              {/* clearance gate removed — clearance is handled in Step 3 */}
              {false && (
                <div className="mb-6 bg-navy-50 border border-navy-200 rounded-2xl p-5">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-9 h-9 rounded-xl bg-navy-900 flex items-center justify-center flex-shrink-0">
                      <Shield size={18} className="text-gold-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-navy-900">{t('clearance.gate.question')}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{tri('Recommended — takes about 30 seconds', '推荐 — 约需30秒', 'Recomendado — tarda unos 30 segundos', 'Empfohlen — dauert ca. 30 Sekunden', 'Recommandé — prend environ 30 secondes', 'अनुशंसित — लगभग 30 सेकंड', 'Recomendado — leva cerca de 30 segundos', '推奨 — 約30秒')}</p>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      type="button"
                      onClick={() => setClearanceGateChoice('yes')}
                      className="flex-1 inline-flex items-center justify-center gap-2 bg-gold-500 hover:bg-gold-400 text-white font-semibold px-4 py-2.5 rounded-xl transition-colors text-sm shadow-md"
                    >
                      <Search size={15} />
                      {t('clearance.gate.yes')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setClearanceGateChoice('no')}
                      className="flex-1 inline-flex items-center justify-center gap-2 bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 font-semibold px-4 py-2.5 rounded-xl transition-colors text-sm"
                    >
                      {t('clearance.gate.no')}
                    </button>
                  </div>
                </div>
              )}

              {/* Inline clearance panel removed — clearance is in Step 3 */}
              {false && (
                <div className="mb-6 bg-white border border-gray-200 rounded-2xl overflow-hidden">
                  <div className="flex items-center gap-2 px-5 py-3 border-b border-gray-100 bg-navy-50">
                    <Shield size={15} className="text-navy-700" />
                    <span className="text-sm font-semibold text-navy-900">
                      {tri('Trademark Availability Check', '商标可用性检索', 'Verificación de Disponibilidad', 'Markenverfügbarkeitsprüfung', 'Vérification de disponibilité', 'ट्रेडमार्क उपलब्धता जांच', 'Verificação de Disponibilidade', '商標利用可能性確認')}
                    </span>
                    <button
                      type="button"
                      onClick={() => setClearanceGateChoice('no')}
                      className="ml-auto text-xs text-gray-500 hover:text-gray-700 underline underline-offset-2 transition-colors"
                    >
                      {tri('Skip', '跳过', 'Omitir', 'Überspringen', 'Passer', 'छोड़ें', 'Pular', 'スキップ')}
                    </button>
                  </div>
                  <div className="p-5">
                    <TrademarkClearancePanel
                      markName={form.markName}
                      goodsServices={form.classEntries.map(e => e.description).filter(Boolean).join('; ')}
                      classes={[]}
                      language={(language === 'zh' ? 'zh' : language === 'es' ? 'es' : language === 'de' ? 'de' : language === 'fr' ? 'fr' : language === 'hi' ? 'hi' : language === 'pt' ? 'pt' : 'en') as 'en' | 'zh' | 'es' | 'de' | 'fr' | 'hi' | 'pt'}
                      autoRun
                    />
                  </div>
                  {/* Acknowledgment checkbox */}
                  <div className="px-5 pb-5">
                    <label className="flex items-start gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={clearanceGateAcknowledged}
                        onChange={e => setClearanceGateAcknowledged(e.target.checked)}
                        className="mt-0.5 rounded border-gray-300 text-gold-500 focus:ring-gold-400 flex-shrink-0"
                      />
                      <span className="text-xs text-gray-600 group-hover:text-gray-800 transition-colors leading-relaxed">
                        {t('clearance.gate.acknowledge')}
                      </span>
                    </label>
                  </div>
                </div>
              )}

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
                          className="flex items-center gap-2 bg-gold-500 hover:bg-gold-400 disabled:opacity-50 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors whitespace-nowrap shadow-md"
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
                        applicationId={applicationId}
                        paymentIntentId={paymentIntentId}
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

          {/* STEP 8 — Confirmation */}
          {step === 8 && (
            <div className="py-4 relative">
              {/* Fireworks particles */}
              {!fireworksDone && (
                <FireworksOverlay onDone={() => setFireworksDone(true)} />
              )}

              {/* Success header */}
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <CheckCircle2 size={42} className="text-emerald-600" />
                </div>
                <h2 className="text-2xl font-bold text-navy-900 mb-2">
                  {tri('Payment Confirmed!', '付款已确认！', '¡Pago Confirmado!', 'Zahlung bestätigt!', 'Paiement confirmé !', 'भुगतान की पुष्टि हुई!', 'Pagamento Confirmado!')}
                </h2>
                {caseNumber && (
                  <div className="bg-gray-100 rounded-xl px-5 py-3 inline-block mb-3">
                    <div className="text-xs text-gray-500 mb-0.5">{tri('Your Case Number', '您的案件编号', 'Tu Número de Expediente', 'Ihre Fallnummer', 'Votre numéro de dossier', 'आपका केस नंबर', 'Seu Número de Processo')}</div>
                    <div className="text-lg font-bold font-mono text-navy-900">{caseNumber}</div>
                  </div>
                )}
                <p className="text-gray-600 text-sm leading-relaxed max-w-lg mx-auto">
                  {tri('Your payment has been received and your trademark filing is confirmed. Our team will review, classify, and file before IMPI within 24 business hours. A confirmation has been sent to', 'We收到您的付款，您的商标申请已确认。我们的团队将在24个工作小时内审查、分类并向IMPI提交。确认已发送至', 'Hemos recibido tu pago y tu solicitud está confirmada. Nuestro equipo presentará ante el IMPI en 24 horas hábiles. Se ha enviado confirmación a', 'Ihre Zahlung wurde empfangen und Ihre Markenanmeldung ist bestätigt. Unser Team reicht innerhalb von 24 Geschäftsstunden beim IMPI ein. Bestätigung gesendet an', 'Votre paiement a été reçu et votre dépôt est confirmé. Notre équipe déposera à l\'IMPI sous 24 heures ouvrées. Confirmation envoyée à', 'आपका भुगतान प्राप्त हुआ और आपकी ट्रेडमार्क फाइलिंग की पुष्टि हुई। हमारी टीम 24 व्यावसायिक घंटों में IMPI को दाखिल करेगी। पुष्टि भेजी गई:', 'Seu pagamento foi recebido e seu pedido está confirmado. Nossa equipe protocola no IMPI em 24 horas úteis. Confirmação enviada para')}
                  {' '}<strong>{form.email}</strong>.
                </p>
              </div>

              {/* Payment summary */}
              <div className="bg-gray-50 border border-gray-200 rounded-2xl overflow-hidden mb-5">
                <div className="px-5 py-3 border-b border-gray-200 bg-white flex items-center gap-2">
                  <CreditCard size={15} className="text-gray-400" />
                  <span className="text-sm font-semibold text-navy-900">{tri('Payment Summary', '付款摘要', 'Resumen de pago', 'Zahlungsübersicht', 'Récapitulatif du paiement', 'भुगतान सारांश', 'Resumo do pagamento')}</span>
                  <span className="ml-auto inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 text-xs font-bold px-2.5 py-0.5 rounded-full">
                    <CheckCircle2 size={11} /> {tri('Paid', '已付款', 'Pagado', 'Bezahlt', 'Payé', 'भुगतान हुआ', 'Pago')}
                  </span>
                </div>
                <div className="divide-y divide-gray-100">
                  <div className="flex justify-between items-center px-5 py-3">
                    <span className="text-sm text-gray-600">{tri('Mark', '商标', 'Marca', 'Marke', 'Marque', 'मार्क', 'Marca')}</span>
                    <span className="text-sm font-semibold text-navy-900">{form.markName}</span>
                  </div>
                  {form.classEntries.filter(e => e.classNumber !== null || e.fallbackClasses.length > 0).map((entry, i) => (
                    <div key={i} className="flex justify-between items-center px-5 py-2">
                      <span className="text-xs text-gray-500">
                        {tri('Class', '类别', 'Clase', 'Klasse', 'Classe', 'वर्ग', 'Classe')} {entry.classNumber ?? entry.fallbackClasses[0]}
                        {entry.classTitleEn ? ` — ${entry.classTitleEn}` : ''}
                      </span>
                    </div>
                  ))}
                  <div className="flex justify-between px-5 py-2">
                    <span className="text-sm text-gray-600">{tri('Service Fee', '服务费', 'Honorarios', 'Servicegebühr', 'Frais de service', 'सेवा शुल्क', 'Taxa de serviço')}</span>
                    <span className="text-sm font-medium">USD ${serviceFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between px-5 py-2">
                    <span className="text-sm text-gray-600">{tri('Government Fees (IMPI)', 'IMPI政府费用', 'Tasas IMPI', 'IMPI-Gebühren', 'Frais IMPI', 'IMPI शुल्क', 'Taxas IMPI')}</span>
                    <span className="text-sm font-medium">USD ${govFee.toFixed(2)}</span>
                  </div>
                  {couponApplied && (
                    <div className="flex justify-between px-5 py-2 bg-emerald-50">
                      <span className="text-sm text-emerald-700 flex items-center gap-1.5">
                        <Tag size={12} /> {couponApplied.code} (-{couponApplied.discountPercent}%)
                      </span>
                      <span className="text-sm font-medium text-emerald-700">-USD ${(grandTotal - discountedTotal).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between px-5 py-4 bg-white">
                    <span className="text-base font-bold text-navy-900">{tri('Total Paid', '已付总额', 'Total pagado', 'Gezahlter Betrag', 'Total payé', 'कुल भुगतान', 'Total pago')}</span>
                    <span className="text-base font-bold text-navy-900">USD ${(finalTotal ?? discountedTotal).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Account access panel */}
              <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="bg-gradient-to-r from-navy-900 to-navy-800 px-5 py-4 flex items-center gap-3">
                  <div className="w-9 h-9 bg-gold-500 rounded-xl flex items-center justify-center flex-shrink-0">
                    <UserPlus size={18} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-sm">
                      {tri('Track your filing from the Dashboard', '从仪表板跟踪您的申请', 'Haz seguimiento desde el Panel', 'Einreichung im Dashboard verfolgen', 'Suivez votre dépôt depuis le tableau de bord', 'डैशबोर्ड से अपनी फाइलिंग ट्रैक करें', 'Acompanhe seu pedido no Painel')}
                    </h3>
                    <p className="text-navy-300 text-xs mt-0.5">
                      {tri('Sign in or set up your account to access status updates, documents and correspondence.', '登录或设置账户以访问状态更新、文件和通信。', 'Inicia sesión o configura tu cuenta para ver actualizaciones, documentos y comunicaciones.', 'Anmelden oder Konto einrichten für Statusupdates, Dokumente und Korrespondenz.', 'Connectez-vous ou configurez votre compte pour accéder aux mises à jour, documents et correspondance.', 'स्थिति अपडेट, दस्तावेज़ और पत्राचार के लिए साइन इन करें या अपना खाता सेट करें।', 'Faça login ou configure sua conta para acessar atualizações, documentos e correspondência.')}
                    </p>
                  </div>
                </div>

                <div className="p-5">
                  {user ? (
                    /* Already logged in */
                    <div className="text-center space-y-3">
                      <p className="text-sm text-emerald-700 font-medium flex items-center justify-center gap-2">
                        <CheckCircle2 size={15} className="text-emerald-500" />
                        {tri('You are signed in as', 'حساب：', 'Sesión iniciada como', 'Angemeldet als', 'Connecté en tant que', 'के रूप में साइन इन है', 'Conectado como')} <strong>{user.email}</strong>
                      </p>
                      <button
                        onClick={() => navigate('/dashboard')}
                        className="w-full flex items-center justify-center gap-2 bg-gold-500 hover:bg-gold-600 text-white font-bold py-3 rounded-xl text-sm transition-colors"
                      >
                        <ChevronRight size={16} />
                        {tri('Go to Dashboard', '前往仪表板', 'Ir al Panel', 'Zum Dashboard', 'Aller au tableau de bord', 'डैशबोर्ड पर जाएं', 'Ir ao Painel')}
                      </button>
                    </div>
                  ) : postPaymentMode === 'prompt' ? (
                    /* Initial prompt: two options */
                    <div className="space-y-3">
                      <button
                        type="button"
                        onClick={() => { setPostPaymentMode('login'); setPostPaymentLoginEmail(form.email); }}
                        className="w-full flex items-center gap-4 bg-navy-900 hover:bg-navy-800 text-white font-semibold px-5 py-4 rounded-xl transition-colors text-left"
                      >
                        <div className="w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
                          <LogIn size={18} className="text-gold-400" />
                        </div>
                        <div>
                          <div className="text-sm font-bold">
                            {tri('I already have an account — Sign in', '我已有账户 — 登录', 'Ya tengo cuenta — Iniciar sesión', 'Ich habe ein Konto — Anmelden', 'J\'ai déjà un compte — Connexion', 'मेरे पास पहले से खाता है — साइन इन', 'Já tenho conta — Entrar')}
                          </div>
                          <div className="text-xs text-white/60 mt-0.5">
                            {tri('Access your dashboard with your existing credentials', '使用现有凭据访问仪表板', 'Accede a tu panel con tus credenciales actuales', 'Dashboard mit vorhandenen Zugangsdaten aufrufen', 'Accédez à votre tableau de bord avec vos identifiants', 'अपने मौजूदा क्रेडेंशियल से डैशबोर्ड एक्सेस करें', 'Acesse seu painel com suas credenciais existentes')}
                          </div>
                        </div>
                        <ChevronRight size={16} className="ml-auto text-white/40" />
                      </button>

                      <button
                        type="button"
                        onClick={async () => {
                          setPostPaymentMode('reset_sent');
                          await supabase.auth.resetPasswordForEmail(form.email, {
                            redirectTo: `${window.location.origin}/dashboard`,
                          });
                        }}
                        className="w-full flex items-center gap-4 bg-white hover:bg-gray-50 border-2 border-gray-200 hover:border-gold-300 text-navy-900 font-semibold px-5 py-4 rounded-xl transition-colors text-left"
                      >
                        <div className="w-9 h-9 bg-gold-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Mail size={18} className="text-gold-600" />
                        </div>
                        <div>
                          <div className="text-sm font-bold">
                            {tri('Set up my account — Send me a link', '设置我的账户 — 发送链接', 'Configurar mi cuenta — Enviarme un enlace', 'Konto einrichten — Link senden', 'Configurer mon compte — Envoyer un lien', 'मेरा खाता सेट करें — लिंक भेजें', 'Configurar minha conta — Enviar link')}
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            {tri("We'll email a link to set your password to", 'We将密码设置链接发送至', 'Enviaremos un enlace a', 'Link zum Passwort-Setzen an', 'Nous enverrons un lien à', 'पासवर्ड सेट करने का लिंक भेजेंगे', 'Enviaremos um link para')} <strong className="text-navy-700">{form.email}</strong>
                          </div>
                        </div>
                        <ChevronRight size={16} className="ml-auto text-gray-300" />
                      </button>
                    </div>
                  ) : postPaymentMode === 'reset_sent' ? (
                    /* Password reset link sent */
                    <div className="text-center space-y-3">
                      <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                        <Mail size={22} className="text-emerald-600" />
                      </div>
                      <p className="text-sm font-bold text-navy-900">
                        {tri('Check your inbox', '请查看您的收件箱', 'Revisa tu bandeja de entrada', 'Überprüfen Sie Ihren Posteingang', 'Vérifiez votre boîte mail', 'अपना इनबॉक्स जांचें', 'Verifique sua caixa de entrada')}
                      </p>
                      <p className="text-xs text-gray-500 leading-relaxed">
                        {tri("We sent a link to set your password to", '密码设置链接已发送至', 'Enviamos un enlace para establecer tu contraseña a', 'Link zum Passwort-Setzen gesendet an', 'Lien envoyé pour définir votre mot de passe à', 'पासवर्ड सेट करने का लिंक भेजा गया', 'Link enviado para definir sua senha para')} <strong>{form.email}</strong>.{' '}
                        {tri('Click the link to access your dashboard.', '点击链接访问您的仪表板。', 'Haz clic en el enlace para acceder a tu panel.', 'Klicken Sie den Link, um auf Ihr Dashboard zuzugreifen.', 'Cliquez sur le lien pour accéder à votre tableau de bord.', 'डैशबोर्ड एक्सेस करने के लिए लिंक पर क्लिक करें।', 'Clique no link para acessar seu painel.')}
                      </p>
                      <button
                        type="button"
                        onClick={() => setPostPaymentMode('login')}
                        className="text-xs text-gold-600 hover:text-gold-700 font-medium underline underline-offset-2"
                      >
                        {tri('Sign in instead', '改为登录', 'Iniciar sesión en su lugar', 'Stattdessen anmelden', 'Se connecter à la place', 'बजाय साइन इन करें', 'Entrar em vez disso')}
                      </button>
                    </div>
                  ) : (
                    /* Sign in form */
                    <form
                      onSubmit={async e => {
                        e.preventDefault();
                        setPostPaymentLoginError('');
                        setPostPaymentLoginLoading(true);
                        const { error } = await supabase.auth.signInWithPassword({
                          email: postPaymentLoginEmail,
                          password: postPaymentLoginPassword,
                        });
                        setPostPaymentLoginLoading(false);
                        if (error) {
                          setPostPaymentLoginError(tri('Invalid email or password.', '邮箱或密码错误。', 'Correo o contraseña incorrectos.', 'Ungültige E-Mail oder Passwort.', 'E-mail ou mot de passe invalide.', 'अमान्य ईमेल या पासवर्ड।', 'E-mail ou senha inválidos.'));
                        } else {
                          navigate('/dashboard');
                        }
                      }}
                      className="space-y-4"
                    >
                      {postPaymentLoginError && (
                        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
                          <AlertCircle size={14} className="flex-shrink-0" />
                          {postPaymentLoginError}
                        </div>
                      )}
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1.5">
                          {tri('Email', '电子邮件', 'Correo', 'E-Mail', 'E-mail', 'ईमेल', 'E-mail')}
                        </label>
                        <input
                          type="email"
                          required
                          className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent"
                          value={postPaymentLoginEmail}
                          onChange={e => setPostPaymentLoginEmail(e.target.value)}
                        />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="block text-xs font-medium text-gray-600">
                            {tri('Password', '密码', 'Contraseña', 'Passwort', 'Mot de passe', 'पासवर्ड', 'Senha')}
                          </label>
                          <button
                            type="button"
                            onClick={async () => {
                              setPostPaymentMode('reset_sent');
                              await supabase.auth.resetPasswordForEmail(postPaymentLoginEmail || form.email, {
                                redirectTo: `${window.location.origin}/dashboard`,
                              });
                            }}
                            className="text-xs text-gold-600 hover:text-gold-700 font-medium"
                          >
                            {tri('Forgot password?', '忘记密码？', '¿Olvidaste tu contraseña?', 'Passwort vergessen?', 'Mot de passe oublié ?', 'पासवर्ड भूल गए?', 'Esqueceu a senha?')}
                          </button>
                        </div>
                        <div className="relative">
                          <input
                            type={postPaymentShowPassword ? 'text' : 'password'}
                            required
                            className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent pr-10"
                            value={postPaymentLoginPassword}
                            onChange={e => setPostPaymentLoginPassword(e.target.value)}
                          />
                          <button
                            type="button"
                            onClick={() => setPostPaymentShowPassword(v => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {postPaymentShowPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                          </button>
                        </div>
                      </div>
                      <button
                        type="submit"
                        disabled={postPaymentLoginLoading}
                        className="w-full flex items-center justify-center gap-2 bg-gold-500 hover:bg-gold-600 disabled:opacity-60 text-white font-bold py-3 rounded-xl text-sm transition-colors"
                      >
                        {postPaymentLoginLoading ? <Loader2 size={15} className="animate-spin" /> : <LogIn size={15} />}
                        {tri('Sign In & Go to Dashboard', '登录并前往仪表板', 'Iniciar sesión e ir al Panel', 'Anmelden & zum Dashboard', 'Connexion & tableau de bord', 'साइन इन करें और डैशबोर्ड जाएं', 'Entrar e ir ao Painel')}
                      </button>
                      <button
                        type="button"
                        onClick={() => setPostPaymentMode('prompt')}
                        className="w-full text-xs text-gray-400 hover:text-gray-600"
                      >
                        {tri('Back', '返回', 'Volver', 'Zurück', 'Retour', 'वापस', 'Voltar')}
                      </button>
                    </form>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Account creation gate */}
          {showAuthGate && (
            <AuthGateModal
              language={language}
              onSuccess={() => { setShowAuthGate(false); }}
              onClose={() => setShowAuthGate(false)}
            />
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
                    onClick={() => { setShowConflictModal(false); setStep(3); }}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-gold-500 hover:bg-gold-400 text-white text-sm font-semibold transition-colors shadow-md"
                  >
                    {tri('Continue anyway', '仍然继续', 'Continuar de todas formas', 'Trotzdem fortfahren', 'Continuer quand même', 'फिर भी जारी रखें', 'Continuar mesmo assim')}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          {step < 8 && (
            <div className="mt-8 pt-6 border-t border-gray-100">
              {/* Save & Continue Later — shown for steps 1–6 */}
              {step < 7 && !editingAppId && (
                <div className="flex justify-center mb-4">
                  <button
                    type="button"
                    onClick={handleSaveAndContinueLater}
                    className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    <Save size={13} />
                    {draftSavedFeedback ? t('form.draftSaved') : t('form.saveLater')}
                  </button>
                </div>
              )}
              <div className="flex justify-between">
              <button
                type="button"
                onClick={() => setStep(s => Math.max(1, s - 1) as Step)}
                disabled={step === 1 || (step === 7 && !!clientSecret)}
                className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:border-gray-300 disabled:opacity-40 transition-colors"
              >
                {t('form.back')}
              </button>
              {step < 7 && (
                <button
                  type="button"
                  onClick={() => {
                    if (step === 5 && (form.email !== form.emailConfirm || !form.address.trim() || !form.city.trim() || !form.postalCode.trim() || !form.country.trim())) return;
                    if (step === 2) {
                      const hasHighRisk = Object.values(clearanceResults).some(r => r.risk === 'high' || r.risk === 'medium');
                      if (hasHighRisk) {
                        setShowConflictModal(true);
                        return;
                      }
                    }
                    if (step === 6) {
                      if (!agreedToTerms || !agreedToDisclaimer) {
                        setDisclaimerError(true);
                        return;
                      }
                    }
                    setStep(s => Math.min(7, s + 1) as Step);
                  }}
                  disabled={
                    (step === 5 && (form.email !== form.emailConfirm || !form.address.trim() || !form.city.trim() || !form.postalCode.trim() || !form.country.trim())) ||
                    (step === 2 && confirmedEntries.length === 0 && !activeEntryIsConfirmed) ||
                    (step === 3 && Object.values(clearanceResults).some(r => r.risk === 'high' || r.risk === 'medium') && !step3RiskAcknowledged)
                  }
                  className="px-5 py-2.5 rounded-xl bg-gold-500 hover:bg-gold-400 text-white text-sm font-semibold transition-colors disabled:opacity-40 shadow-md"
                >
                  {t('form.next')} <ChevronRight size={16} className="inline" />
                </button>
              )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

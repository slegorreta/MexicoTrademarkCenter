import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, ShieldCheck } from 'lucide-react';

type Lang = 'en' | 'zh' | 'es' | 'de' | 'fr' | 'hi' | 'pt';

interface Props {
  language: Lang;
  onVerified: () => void;
  onReset?: () => void;
}

const ui: Record<string, Record<Lang, string>> = {
  prompt: {
    en: 'Please solve this to continue:',
    zh: '请计算以下题目以继续：',
    es: 'Por favor resuelve esto para continuar:',
    de: 'Bitte lösen Sie diese Aufgabe zum Fortfahren:',
    fr: 'Veuillez résoudre ceci pour continuer :',
    hi: 'जारी रखने के लिए कृपया यह हल करें:',
    pt: 'Por favor resolva isso para continuar:',
  },
  placeholder: {
    en: 'Your answer',
    zh: '您的答案',
    es: 'Tu respuesta',
    de: 'Ihre Antwort',
    fr: 'Votre réponse',
    hi: 'आपका उत्तर',
    pt: 'Sua resposta',
  },
  wrongAnswer: {
    en: 'Incorrect answer. Please try again.',
    zh: '答案不正确，请重试。',
    es: 'Respuesta incorrecta. Inténtalo de nuevo.',
    de: 'Falsche Antwort. Bitte erneut versuchen.',
    fr: 'Réponse incorrecte. Veuillez réessayer.',
    hi: 'गलत उत्तर। कृपया पुनः प्रयास करें।',
    pt: 'Resposta incorreta. Por favor tente novamente.',
  },
  verified: {
    en: 'Verification passed',
    zh: '验证通过',
    es: 'Verificación superada',
    de: 'Verifizierung bestanden',
    fr: 'Vérification réussie',
    hi: 'सत्यापन सफल',
    pt: 'Verificação concluída',
  },
  refresh: {
    en: 'New challenge',
    zh: '换一题',
    es: 'Nueva pregunta',
    de: 'Neue Aufgabe',
    fr: 'Nouvelle question',
    hi: 'नई चुनौती',
    pt: 'Nova pergunta',
  },
  antiBot: {
    en: 'Human verification',
    zh: '人机验证',
    es: 'Verificación humana',
    de: 'Menschliche Verifizierung',
    fr: 'Vérification humaine',
    hi: 'मानव सत्यापन',
    pt: 'Verificação humana',
  },
};

function generateChallenge(): { a: number; b: number; op: '+' | '-' | '×'; answer: number } {
  const ops: Array<'+' | '-' | '×'> = ['+', '-', '×'];
  const op = ops[Math.floor(Math.random() * ops.length)];
  let a: number, b: number, answer: number;

  if (op === '+') {
    a = Math.floor(Math.random() * 20) + 1;
    b = Math.floor(Math.random() * 20) + 1;
    answer = a + b;
  } else if (op === '-') {
    a = Math.floor(Math.random() * 20) + 10;
    b = Math.floor(Math.random() * a) + 1;
    answer = a - b;
  } else {
    a = Math.floor(Math.random() * 9) + 2;
    b = Math.floor(Math.random() * 9) + 2;
    answer = a * b;
  }

  return { a, b, op, answer };
}

export default function MathCaptcha({ language, onVerified, onReset }: Props) {
  const [challenge, setChallenge] = useState(generateChallenge);
  const [input, setInput] = useState('');
  const [error, setError] = useState(false);
  const [passed, setPassed] = useState(false);

  const t = (key: string) => ui[key]?.[language] ?? ui[key]?.en ?? key;

  const refresh = useCallback(() => {
    setChallenge(generateChallenge());
    setInput('');
    setError(false);
    if (passed) {
      setPassed(false);
      onReset?.();
    }
  }, [passed, onReset]);

  const handleSubmit = () => {
    const val = parseInt(input.trim(), 10);
    if (val === challenge.answer) {
      setPassed(true);
      setError(false);
      onVerified();
    } else {
      setError(true);
      setInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit();
  };

  if (passed) {
    return (
      <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
        <ShieldCheck size={16} className="text-emerald-600 flex-shrink-0" />
        <span className="text-sm font-medium text-emerald-700">{t('verified')}</span>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2">
        <ShieldCheck size={15} className="text-gray-500 flex-shrink-0" />
        <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">{t('antiBot')}</span>
      </div>

      <p className="text-sm text-gray-700">{t('prompt')}</p>

      <div className="flex items-center gap-3">
        <div className="flex-shrink-0 bg-white border border-gray-300 rounded-xl px-5 py-3 text-center font-mono font-bold text-lg text-navy-900 select-none shadow-sm min-w-[130px]">
          {challenge.a} {challenge.op} {challenge.b} = ?
        </div>

        <input
          type="number"
          className="w-24 border border-gray-300 rounded-xl px-3 py-2.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent"
          placeholder={t('placeholder')}
          value={input}
          onChange={e => { setInput(e.target.value); setError(false); }}
          onKeyDown={handleKeyDown}
        />

        <button
          type="button"
          onClick={handleSubmit}
          disabled={!input.trim()}
          className="flex-shrink-0 bg-navy-900 hover:bg-navy-800 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
        >
          OK
        </button>

        <button
          type="button"
          onClick={refresh}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
          title={t('refresh')}
        >
          <RefreshCw size={15} />
        </button>
      </div>

      {error && (
        <p className="text-xs text-red-600 font-medium">{t('wrongAnswer')}</p>
      )}
    </div>
  );
}

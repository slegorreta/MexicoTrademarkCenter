import { Link } from 'react-router-dom';
import { useSearchParams } from 'react-router-dom';

export default function ImpiAutofillStatusPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', minHeight: '100vh', background: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ maxWidth: 560, width: '100%' }}>
        <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 10, padding: '40px 32px', textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, background: '#16a34a', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>

          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#166534', marginBottom: 12 }}>
            Application Received
          </h1>

          <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.7, marginBottom: 8 }}>
            Your application has been received and is being processed in the background.
          </p>

          <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.7, marginBottom: 28 }}>
            The attorney will receive an email confirmation at{' '}
            <strong>sergio.legorreta@lawtaem.com</strong> once the IMPI draft is ready for review.
          </p>

          <Link
            to={`/beta/impi-autofill?token=${token}`}
            style={{ display: 'inline-block', padding: '10px 24px', background: '#1d4ed8', color: '#fff', textDecoration: 'none', borderRadius: 6, fontSize: 14, fontWeight: 600 }}
          >
            Submit another application
          </Link>
        </div>

        <p style={{ textAlign: 'center', fontSize: 12, color: '#9ca3af', marginTop: 20 }}>
          Beta — internal use only
        </p>
      </div>
    </div>
  );
}

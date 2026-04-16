import { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { ChefHat, Eye, EyeOff } from 'lucide-react';
import axios from 'axios';
import { useI18n } from '../i18n/I18nProvider';

const Login = () => {
  const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [twoFactorRequired, setTwoFactorRequired] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [appName, setAppName] = useState('RestauPro');
  const [logoUrl, setLogoUrl] = useState(null);
  const { t } = useI18n();
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch public settings (no auth required)
    const fetchSettings = async () => {
      try {
        const res = await axios.get(`${apiBaseUrl}/api/public/settings`);
        console.log('Public settings response:', res.data);
        if (res.data) {
          setAppName(res.data.restaurant_name || 'RestauPro');
          if (res.data.restaurant_logo_url) {
            console.log('Logo URL found:', res.data.restaurant_logo_url);
            setLogoUrl(res.data.restaurant_logo_url);
          } else {
            console.log('No logo URL in settings');
          }
        }
      } catch (err) {
        console.log('Failed to fetch settings:', err);
      }
    };

    fetchSettings();
  }, [apiBaseUrl]);

  if (localStorage.getItem('token')) return <Navigate to="/" replace />;

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const payload = twoFactorRequired ? { email, password, otp_code: otpCode } : { email, password };
      const res = await axios.post(`${apiBaseUrl}/api/login`, payload);

      if (res.data?.two_factor_required) {
        setTwoFactorRequired(true);
        setError(t('2faRequired'));
        setIsLoading(false);
        return;
      }

      const token = res.data.token || res.data.access_token;
      const role = res.data.user?.role?.name || res.data.user?.role || res.data.role || 'admin';
      if (token) {
        localStorage.setItem('token', token);
        localStorage.setItem('role', role);
        localStorage.setItem('user_id', res.data.user?.id);
        localStorage.setItem('user_name', res.data.user?.name || 'User');
        navigate('/');
      }
      else setError(t('noTokenReceived'));
    } catch (err) {
      const message = err.response?.data?.message;
      if (message) {
        if (message.toLowerCase().includes('invalid credentials')) {
          setError(t('invalidCredentials'));
        } else {
          setError(message);
        }
      } else if (err.code === 'ERR_NETWORK') {
        setError(t('serverUnavailable'));
      } else {
        setError(t('error'));
      }
    }
    finally { setIsLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#0f0f12] flex items-center justify-center px-4 font-sans">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          {logoUrl ? (
            <img src={logoUrl} alt="Restaurant Logo" className="w-16 h-16 rounded-2xl shadow-xl shadow-amber-500/20 mb-4 object-cover" />
          ) : (
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-xl shadow-amber-500/20 mb-4">
              <ChefHat className="w-7 h-7 text-white" />
            </div>
          )}
          <h1 className="text-xl font-bold text-white">{appName}</h1>
          <p className="text-xs text-zinc-500 mt-1">{t('appSubtitle')}</p>
        </div>

        <div className="card p-6">
          <form className="space-y-4" onSubmit={handleLogin}>
            {error && <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl"><p className="text-[12px] text-red-400 font-medium">{error}</p></div>}
            <div>
              <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">{t('email')}</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@restaurant.com" disabled={isLoading} className="input-dark" />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">{t('password')}</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" disabled={isLoading} className="input-dark pr-10" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-400 transition-colors">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            {twoFactorRequired && (
              <div>
                <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">{t('code2fa')}</label>
                <input type="text" required value={otpCode} onChange={e => setOtpCode(e.target.value)} placeholder="123456" disabled={isLoading} className="input-dark" maxLength={6} />
              </div>
            )}
            <button type="submit" disabled={isLoading} className="btn-primary w-full disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center">
              {isLoading ? <><div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin mr-2"></div>{t('loginInProgress')}</> : (twoFactorRequired ? t('verifyCode') : t('signIn'))}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
export default Login;

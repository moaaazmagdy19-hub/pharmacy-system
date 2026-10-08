import React, { useState } from 'react';
import { Lock, User, Eye, EyeOff, ShieldCheck } from 'lucide-react';

interface LoginPageProps {
  onLoginSuccess: () => void;
}

const VALID_USERNAME = 'بسيوني';
const VALID_PASSWORD = '2561988';

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // محاكاة تحقق بسيطة (تأخير 500ms)
    setTimeout(() => {
      if (username.trim() === VALID_USERNAME && password === VALID_PASSWORD) {
        localStorage.setItem('pharmacy_auth', 'true');
        localStorage.setItem('pharmacy_auth_user', username.trim());
        onLoginSuccess();
      } else {
        setError('اسم المستخدم أو كلمة السر غير صحيحة');
        setIsLoading(false);
      }
    }, 500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-xl mb-4">
            <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v20M2 12h20M7 7l10 10M17 7l-10 10"/>
            </svg>
          </div>
          <h1 className="text-2xl font-black text-white mb-1">نظام إدارة الصيدلية</h1>
          <p className="text-xs text-blue-100">سجّل دخولك للمتابعة</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8">
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900">تسجيل الدخول</h2>
              <p className="text-[11px] text-slate-500">أدخل بياناتك للدخول إلى النظام</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div>
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-1.5">
                <User className="w-3.5 h-3.5 text-blue-600" />
                <span>اسم المستخدم</span>
              </label>
              <input
                type="text"
                required
                autoFocus
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="أدخل اسم المستخدم"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            {/* Password */}
            <div>
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-1.5">
                <Lock className="w-3.5 h-3.5 text-blue-600" />
                <span>كلمة السر</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="أدخل كلمة السر"
                  className="w-full px-4 py-3 pl-10 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-3.5 text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-700 text-center">
                ⚠️ {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-black rounded-2xl shadow-lg shadow-blue-500/30 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? 'جاري التحقق...' : 'دخول'}
            </button>
          </form>

          {/* Hint */}
          <div className="mt-5 pt-4 border-t border-slate-100 text-center">
            <p className="text-[10px] text-slate-400">
              © {new Date().getFullYear()} نظام إدارة الصيدلية المتكامل
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
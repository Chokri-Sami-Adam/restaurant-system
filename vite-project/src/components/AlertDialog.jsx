import { X, AlertCircle, CheckCircle2, AlertTriangle, Info } from 'lucide-react';
import { useI18n } from '../i18n/I18nProvider';

const AlertDialog = ({ isOpen, onClose, type = 'info', title, message, onConfirm = null }) => {
  if (!isOpen) return null;
  const { t } = useI18n();

  const icons = {
    error: { Icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-500/10', ring: 'ring-red-500/20' },
    success: { Icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10', ring: 'ring-emerald-500/20' },
    warning: { Icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-500/10', ring: 'ring-amber-500/20' },
    info: { Icon: Info, color: 'text-sky-400', bg: 'bg-sky-500/10', ring: 'ring-sky-500/20' },
  };

  const config = icons[type] || icons.info;
  const { Icon, color, bg, ring } = config;

  const buttonColors = {
    error: 'bg-red-600 hover:bg-red-500',
    success: 'bg-emerald-600 hover:bg-emerald-500',
    warning: 'bg-amber-600 hover:bg-amber-500',
    info: 'bg-sky-600 hover:bg-sky-500',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 lg:p-0">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md transition-opacity duration-300" onClick={onClose}></div>
      <div className="card w-full max-w-md relative z-10 shadow-2xl shadow-black/80 transform transition-all duration-300 scale-100 opacity-100 border border-white/10">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/5 bg-white/[0.02]">
          <h2 className="text-[17px] brand-font font-bold text-white tracking-wide">{title}</h2>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-500 hover:text-white rounded-xl hover:bg-white/10 transition-all outline-none"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="text-center space-y-4">
            {/* Icon */}
            <div className={`w-16 h-16 mx-auto rounded-full ${bg} flex items-center justify-center ring-1 ${ring}`}>
              <Icon className={`w-8 h-8 ${color}`} />
            </div>

            {/* Message */}
            <div>
              <p className="text-[15px] text-white font-semibold">{message}</p>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-2">
              {onConfirm && (
                <>
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 py-2.5 rounded-xl text-sm font-bold text-zinc-400 bg-white/5 hover:bg-white/10 transition-all"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    type="button"
                    onClick={() => { onConfirm(); onClose(); }}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-bold text-white ${buttonColors[type]} transition-all`}
                  >
                    {t('confirm')}
                  </button>
                </>
              )}
              {!onConfirm && (
                <button
                  type="button"
                  onClick={onClose}
                  className={`w-full py-2.5 rounded-xl text-sm font-bold text-white ${buttonColors[type]} transition-all`}
                >
                  {t('close')}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlertDialog;

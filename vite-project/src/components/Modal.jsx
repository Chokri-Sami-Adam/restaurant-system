import { X } from 'lucide-react';

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md overflow-y-auto pt-[132px]" onClick={onClose}>
      <div className="flex justify-center min-h-full pb-20">
        <div className="relative w-full max-w-lg card overflow-hidden flex flex-col shadow-2xl shadow-black/80 border border-white/10 my-auto h-fit max-h-[calc(100vh-150px)]" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between px-6 py-5 border-b border-white/5 bg-white/[0.02] flex-shrink-0">
            <h2 className="text-[17px] brand-font font-bold text-white tracking-wide">{title}</h2>
            <button onClick={onClose} className="p-1.5 text-zinc-500 hover:text-white rounded-xl hover:bg-white/10 transition-all outline-none flex-shrink-0">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="overflow-y-auto flex-1 p-6">{children}</div>
        </div>
      </div>
    </div>
  );
};
export default Modal;

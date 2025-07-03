import { createPortal } from "react-dom";

export default function LogModal({ children, onClose }) {
  return createPortal(
    <div className="fixed inset-0 flex justify-center items-center z-50 bg-black/30">
      <div className="bg-white w-full max-w-xl mx-4 p-6 rounded-lg shadow-lg relative">
        {children}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-xl"
        >
          ✖
        </button>
      </div>
    </div>,
    document.body
  );
}

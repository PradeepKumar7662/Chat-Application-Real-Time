import { useRef, useState } from "react";
import useKeyboardSound from "../hooks/useKeyboardSound";
import { useChatStore } from "../store/useChatStore";
import toast from "react-hot-toast";
import {
  ImageIcon,
  SendIcon,
  XIcon,
  FileTextIcon,
} from "lucide-react";

function MessageInput() {
  const { playRandomKeyStrokeSound } = useKeyboardSound();

  const [text, setText] = useState("");
  const [attachment, setAttachment] = useState(null);

  const fileInputRef = useRef(null);

  const { sendMessage, isSoundEnabled } = useChatStore();

  const handleSendMessage = (e) => {
    e.preventDefault();

    if (!text.trim() && !attachment) return;

    if (isSoundEnabled) {
      playRandomKeyStrokeSound();
    }

    sendMessage({
      text: text.trim(),
      image: attachment?.type === "image" ? attachment.data : null,
      pdf: attachment?.type === "pdf" ? attachment.data : null,
      pdfName: attachment?.type === "pdf" ? attachment.name : null,
    });

    setText("");
    setAttachment(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    const isImage = file.type.startsWith("image/");
    const isPdf = file.type === "application/pdf";

    if (!isImage && !isPdf) {
      toast.error("Please select an image or PDF file");
      return;
    }

    // Optional PDF size limit: 5 MB
    if (isPdf && file.size > 5 * 1024 * 1024) {
      toast.error("PDF size must be less than 5 MB");
      e.target.value = "";
      return;
    }

    // Optional image size limit: 5 MB
    if (isImage && file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5 MB");
      e.target.value = "";
      return;
    }

    const reader = new FileReader();

    reader.onloadend = () => {
      setAttachment({
        type: isImage ? "image" : "pdf",
        data: reader.result,
        name: file.name,
      });
    };

    reader.readAsDataURL(file);
  };

  const removeAttachment = () => {
    setAttachment(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xl border-t border-cyan-500/20">

      {/* ATTACHMENT PREVIEW */}
      {attachment && (
        <div className="max-w-3xl mx-auto mb-3">
          <div className="relative inline-flex items-center gap-3 p-2.5 rounded-xl bg-slate-900/80 border border-cyan-500/20">

            {/* IMAGE PREVIEW */}
            {attachment.type === "image" && (
              <img
                src={attachment.data}
                alt="Preview"
                className="w-20 h-20 object-cover rounded-lg border border-cyan-500/30"
              />
            )}

            {/* PDF PREVIEW */}
            {attachment.type === "pdf" && (
              <div className="flex items-center gap-3 pr-8">
                <div className="w-12 h-12 flex items-center justify-center rounded-lg bg-red-500/10 border border-red-500/20">
                  <FileTextIcon className="w-6 h-6 text-red-400" />
                </div>

                <div className="max-w-[180px]">
                  <p className="text-sm text-slate-200 font-medium truncate">
                    {attachment.name}
                  </p>

                  <p className="text-xs text-red-400 mt-1">
                    PDF Document
                  </p>
                </div>
              </div>
            )}

            {/* REMOVE BUTTON */}
            <button
              onClick={removeAttachment}
              type="button"
              className="
                absolute
                -top-2
                -right-2
                w-6
                h-6
                rounded-full
                bg-slate-800
                border
                border-slate-700
                flex
                items-center
                justify-center
                text-slate-300
                hover:bg-red-500
                hover:text-white
                transition-all
              "
            >
              <XIcon className="w-4 h-4" />
            </button>

          </div>
        </div>
      )}

      {/* MESSAGE FORM */}
      <form
        onSubmit={handleSendMessage}
        className="max-w-3xl mx-auto flex items-center gap-2 sm:gap-3"
      >

        {/* MESSAGE INPUT */}
        <input
          type="text"
          value={text}
          onChange={(e) => {
            setText(e.target.value);

            if (isSoundEnabled) {
              playRandomKeyStrokeSound();
            }
          }}
          className="
            flex-1
            min-w-0
            bg-slate-900/70
            border
            border-slate-700/70
            rounded-xl
            py-2.5
            px-4
            text-slate-200
            placeholder:text-slate-500
            outline-none
            focus:border-cyan-500/60
            focus:ring-2
            focus:ring-cyan-500/10
            transition-all
          "
          placeholder="Type your message..."
        />

        {/* FILE INPUT */}
        <input
          type="file"
          accept="image/*,.pdf,application/pdf"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
        />

        {/* ATTACHMENT BUTTON */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className={`
            flex
            items-center
            justify-center
            shrink-0
            w-11
            h-11
            rounded-xl
            bg-slate-900/70
            border
            border-slate-700/70
            text-slate-400
            hover:text-cyan-400
            hover:border-cyan-500/40
            hover:bg-cyan-500/10
            transition-all
            ${attachment ? "text-cyan-400 border-cyan-500/40" : ""}
          `}
          title="Attach image or PDF"
        >
          <ImageIcon className="w-5 h-5" />
        </button>

        {/* SEND BUTTON */}
        <button
          type="submit"
          disabled={!text.trim() && !attachment}
          className="
            flex
            items-center
            justify-center
            shrink-0
            w-11
            h-11
            rounded-xl
            bg-gradient-to-r
            from-cyan-500
            to-blue-600
            text-white
            hover:from-cyan-400
            hover:to-blue-500
            hover:shadow-lg
            hover:shadow-cyan-500/20
            active:scale-95
            transition-all
            disabled:opacity-40
            disabled:cursor-not-allowed
          "
        >
          <SendIcon className="w-5 h-5" />
        </button>

      </form>
    </div>
  );
}

export default MessageInput;
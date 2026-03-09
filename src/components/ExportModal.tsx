import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import type { ExportOptions } from "../types";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

interface ExportModalProps {
  open: boolean;
  onClose: () => void;
  previewElId: string;
  documentTitle: string;
}

export default function ExportModal({
  open,
  onClose,
  previewElId,
  documentTitle,
}: ExportModalProps) {
  const [opts, setOpts] = useState<ExportOptions>({
    withTheme: true,
    pageSize: "a4",
    fontSize: 14,
  });
  const [loading, setLoading] = useState(false);

  const handleExport = useCallback(async () => {
    const el = document.getElementById(previewElId);
    if (!el) return;
    setLoading(true);
    try {
      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        backgroundColor: opts.withTheme
          ? getComputedStyle(document.documentElement)
              .getPropertyValue("--bg-primary")
              .trim()
          : "#ffffff",
      });
      const imgData = canvas.toDataURL("image/png");
      const isA4 = opts.pageSize === "a4";
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: isA4 ? "a4" : "letter",
      });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const ratio = canvas.width / canvas.height;
      const imgW = pageW;
      const imgH = imgW / ratio;

      let yPos = 0;
      let remaining = imgH;
      while (remaining > 0) {
        pdf.addImage(imgData, "PNG", 0, yPos === 0 ? 0 : -yPos, imgW, imgH);
        remaining -= pageH;
        if (remaining > 0) {
          pdf.addPage();
          yPos += pageH;
        }
      }

      const filename = (documentTitle || "document").replace(
        /[^a-z0-9_\-]/gi,
        "_",
      );
      pdf.save(`${filename}.pdf`);
    } finally {
      setLoading(false);
      onClose();
    }
  }, [opts, previewElId, documentTitle, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="modal-panel"
            initial={{ scale: 0.95, y: 16 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 16 }}
            transition={{ duration: 0.18 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>Export PDF</h2>
              <button className="modal-close" onClick={onClose}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              <label className="modal-field">
                <input
                  type="checkbox"
                  checked={opts.withTheme}
                  onChange={(e) =>
                    setOpts((o) => ({ ...o, withTheme: e.target.checked }))
                  }
                />
                Export with current theme
              </label>

              <label className="modal-field-block">
                Page size
                <select
                  value={opts.pageSize}
                  onChange={(e) =>
                    setOpts((o) => ({
                      ...o,
                      pageSize: e.target.value as "a4" | "letter",
                    }))
                  }
                >
                  <option value="a4">A4</option>
                  <option value="letter">Letter</option>
                </select>
              </label>

              <label className="modal-field-block">
                Font size: {opts.fontSize}px
                <input
                  type="range"
                  min={10}
                  max={18}
                  value={opts.fontSize}
                  onChange={(e) =>
                    setOpts((o) => ({ ...o, fontSize: Number(e.target.value) }))
                  }
                />
              </label>
            </div>

            <div className="modal-footer">
              <button
                className="btn-secondary"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={handleExport}
                disabled={loading}
              >
                {loading ? "Generating…" : "Export PDF"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

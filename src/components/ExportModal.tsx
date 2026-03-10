import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { ExportOptions } from "../types";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

interface ExportModalProps {
  open: boolean;
  onClose: () => void;
  previewElId: string;
  documentTitle: string;
  onExportComplete?: () => void;
}

export default function ExportModal({
  open,
  onClose,
  previewElId,
  documentTitle,
  onExportComplete,
}: ExportModalProps) {
  const [opts, setOpts] = useState<ExportOptions>({
    withTheme: true,
    pageSize: "a4",
    fontSize: 14,
    showWatermark: true,
  });
  const [loading, setLoading] = useState(false);
  const [thumbnail, setThumbnail] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) {
      setThumbnail(null);
      return;
    }
    const el = document.getElementById(previewElId);
    if (!el) return;
    html2canvas(el, { scale: 0.4, useCORS: true }).then((canvas) => {
      setThumbnail(canvas.toDataURL("image/png"));
    });
  }, [open, previewElId]);

  const handleExport = useCallback(async () => {
    const el = document.getElementById(previewElId);
    if (!el) return;
    setLoading(true);

    const origFontSize = el.style.fontSize;
    const origHeight = el.style.height;
    const origMaxHeight = el.style.maxHeight;
    const origOverflow = el.style.overflow;

    el.style.fontSize = `${opts.fontSize}px`;
    el.style.height = "auto";
    el.style.maxHeight = "none";
    el.style.overflow = "visible";

    try {
      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        scrollY: 0,
        windowHeight: el.scrollHeight,
        height: el.scrollHeight,
        backgroundColor: opts.withTheme
          ? getComputedStyle(document.documentElement)
              .getPropertyValue("--bg-primary")
              .trim()
          : "#ffffff",
      });

      const isA4 = opts.pageSize === "a4";
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: isA4 ? "a4" : "letter",
      });

      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const contentW = pageW - margin * 2;
      const contentH = pageH - margin * 2;
      const bgColor = opts.withTheme
        ? getComputedStyle(document.documentElement)
            .getPropertyValue("--bg-primary")
            .trim()
        : "#ffffff";

      const imgW = contentW;

      const pageCanvasH = (contentH * canvas.width) / contentW;

      const fullCtx = canvas.getContext("2d", { willReadFrequently: true });

      function isBlankRow(y: number): boolean {
        if (!fullCtx || y < 0 || y >= canvas.height) return false;
        const row = fullCtx.getImageData(0, y, canvas.width, 1).data;
        const r0 = row[0],
          g0 = row[1],
          b0 = row[2];
        for (let i = 4; i < row.length; i += 4) {
          if (row[i] !== r0 || row[i + 1] !== g0 || row[i + 2] !== b0)
            return false;
        }
        return true;
      }

      function findBreakPoint(idealY: number): number {
        const searchRange = Math.round(pageCanvasH * 0.15);
        for (let offset = 0; offset < searchRange; offset++) {
          const above = idealY - offset;
          if (above > 0 && isBlankRow(above)) return above;
          const below = idealY + offset;
          if (below < canvas.height && isBlankRow(below)) return below;
        }
        return idealY;
      }

      const breakPoints: number[] = [0];
      let cursor = 0;
      while (cursor < canvas.height) {
        const ideal = cursor + pageCanvasH;
        if (ideal >= canvas.height) {
          breakPoints.push(canvas.height);
          break;
        }
        const bp = findBreakPoint(Math.round(ideal));
        breakPoints.push(bp);
        cursor = bp;
      }

      const totalPages = breakPoints.length - 1;
      for (let page = 0; page < totalPages; page++) {
        if (page > 0) pdf.addPage();

        pdf.setFillColor(bgColor);
        pdf.rect(0, 0, pageW, pageH, "F");

        const srcY = breakPoints[page];
        const srcH = breakPoints[page + 1] - srcY;

        const pageCanvas = document.createElement("canvas");
        pageCanvas.width = canvas.width;
        pageCanvas.height = Math.round(srcH);
        const ctx = pageCanvas.getContext("2d");
        if (!ctx) continue;

        ctx.drawImage(
          canvas,
          0,
          Math.round(srcY),
          canvas.width,
          Math.round(srcH),
          0,
          0,
          canvas.width,
          Math.round(srcH),
        );

        const pageImgData = pageCanvas.toDataURL("image/png");
        const sliceH = (srcH * contentW) / canvas.width;
        pdf.addImage(pageImgData, "PNG", margin, margin, imgW, sliceH);

        if (opts.showWatermark) {
          pdf.setFontSize(7);
          pdf.setTextColor(150, 150, 150);
          pdf.text("https://gulbahar.tech", pageW - 6, pageH - 4, {
            align: "right",
          });
        }
      }

      const filename = (documentTitle || "document").replace(
        /[^a-z0-9_\-]/gi,
        "_",
      );
      pdf.save(`${filename}.pdf`);
      onExportComplete?.();
    } finally {
      el.style.fontSize = origFontSize;
      el.style.height = origHeight;
      el.style.maxHeight = origMaxHeight;
      el.style.overflow = origOverflow;
      setLoading(false);
      onClose();
    }
  }, [opts, previewElId, documentTitle, onClose, onExportComplete]);

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
              {thumbnail && (
                <div className="export-thumbnail">
                  <img src={thumbnail} alt="Document preview" />
                </div>
              )}

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

              <label className="modal-field">
                <input
                  type="checkbox"
                  checked={opts.showWatermark}
                  onChange={(e) =>
                    setOpts((o) => ({ ...o, showWatermark: e.target.checked }))
                  }
                />
                Show watermark
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

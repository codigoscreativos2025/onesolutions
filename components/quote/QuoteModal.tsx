"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, FileText, PenLine, X, Download } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { SignatureCanvas } from "./SignatureCanvas";

interface QuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  visitId: number;
}

export function QuoteModal({ isOpen, onClose, visitId }: QuoteModalProps) {
  const [activeTab, setActiveTab] = useState<"quote" | "contract">("quote");
  const [signatureDataUrl, setSignatureDataUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/quote/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          visitId,
          type: activeTab,
          signatureDataUrl: activeTab === "contract" ? signatureDataUrl : undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Error generating PDF" }));
        throw new Error(err.error || "Error generating PDF");
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = activeTab === "quote" ? `cotizacion_${visitId}.pdf` : `contrato_${visitId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div
            className="absolute inset-0 bg-deep-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            className="relative w-full max-w-lg glass-panel rounded-2xl p-6 shadow-2xl"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-headline text-xl font-bold text-on-surface">
                Cotizacion
              </h2>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-container-highest transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex border-b border-outline-variant mb-6">
              <button
                onClick={() => setActiveTab("quote")}
                className={`flex-1 pb-3 text-sm font-semibold border-b-2 transition-all ${
                  activeTab === "quote"
                    ? "border-primary text-primary"
                    : "border-transparent text-on-surface-variant hover:text-on-surface"
                }`}
              >
                <FileText className="w-4 h-4 inline mr-1.5" />
                Cotizacion
              </button>
              <button
                onClick={() => setActiveTab("contract")}
                className={`flex-1 pb-3 text-sm font-semibold border-b-2 transition-all ${
                  activeTab === "contract"
                    ? "border-primary text-primary"
                    : "border-transparent text-on-surface-variant hover:text-on-surface"
                }`}
              >
                <PenLine className="w-4 h-4 inline mr-1.5" />
                Contrato
              </button>
            </div>

            <AnimatePresence mode="wait">
              {activeTab === "quote" ? (
                <motion.div
                  key="quote"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  <div className="text-center py-4">
                    <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-4">
                      <FileText className="w-8 h-8 text-primary" />
                    </div>
                    <p className="text-on-surface-variant text-sm leading-relaxed">
                      Genera una cotizacion en PDF con los datos del cliente y los
                      proyectos seleccionados en esta visita.
                    </p>
                  </div>

                  <Button
                    onClick={handleGenerate}
                    disabled={loading}
                    className="w-full h-12"
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Download className="w-4 h-4 mr-2" />
                        Generar Cotizacion PDF
                      </>
                    )}
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  key="contract"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  <div className="space-y-3">
                    <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                      Firma Digital
                    </label>
                    <SignatureCanvas
                      onSignature={setSignatureDataUrl}
                      width={360}
                      height={160}
                    />
                    <p className="text-xs text-on-surface-variant text-center">
                      Dibuja tu firma en el recuadro superior
                    </p>
                  </div>

                  <Button
                    onClick={handleGenerate}
                    disabled={loading || !signatureDataUrl}
                    className="w-full h-12"
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <PenLine className="w-4 h-4 mr-2" />
                        Generar Contrato
                      </>
                    )}
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, FileText, X, Download, PenLine, Check, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { SignatureCanvas } from "./SignatureCanvas";

interface ContractType {
  type: string;
  name: string;
  html: string;
}

interface ContractData {
  contracts: ContractType[];
  stage: string;
  allowSigning: boolean;
}

interface ContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  visitId: number;
}

interface SignatureField {
  id: string;
  label: string;
  element?: HTMLElement;
}

export function ContractModal({ isOpen, onClose, visitId }: ContractModalProps) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ContractData | null>(null);
  const [activeTab, setActiveTab] = useState("");
  const [signMode, setSignMode] = useState(false);
  const [signatures, setSignatures] = useState<Record<string, string>>({});
  const [expandedSignature, setExpandedSignature] = useState<string | null>(null);
  const [signatureFields, setSignatureFields] = useState<SignatureField[]>([]);
  const [savingSignatures, setSavingSignatures] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const contractContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && visitId) {
      fetchContracts();
    }
    return () => {
      setData(null);
      setActiveTab("");
      setSignMode(false);
      setSignatures({});
      setExpandedSignature(null);
      setSignatureFields([]);
    };
  }, [isOpen, visitId]);

  const fetchContracts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/contract/generate?visitId=${visitId}`);
      if (!res.ok) throw new Error("Error fetching contracts");
      const json: ContractData = await res.json();
      setData(json);
      if (json.contracts?.length > 0) {
        setActiveTab(json.contracts[0].type);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const parseSignatureFields = useCallback(() => {
    const container = contractContentRef.current;
    if (!container || !data?.contracts) return;

    const activeContract = data.contracts.find((c) => c.type === activeTab);
    if (!activeContract) return;

    const fields: SignatureField[] = [];
    container.querySelectorAll("[data-signature]").forEach((el) => {
      const id = el.getAttribute("data-signature") || "";
      const label = el.textContent?.trim() || id;
      fields.push({ id, label, element: el as HTMLElement });
    });
    setSignatureFields(fields);
  }, [activeTab, data]);

  useEffect(() => {
    if (!signMode) return;
    const timer = requestAnimationFrame(() => parseSignatureFields());
    return () => cancelAnimationFrame(timer);
  }, [signMode, activeTab, data, parseSignatureFields]);

  const handleSignatureChange = (fieldId: string, dataUrl: string) => {
    setSignatures((prev) => ({ ...prev, [fieldId]: dataUrl }));
  };

  const handleSaveSignatures = async () => {
    setSavingSignatures(true);
    try {
      const res = await fetch(`/api/visits/${visitId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contractSignatures: signatures,
          contractType: activeTab,
        }),
      });
      if (!res.ok) throw new Error("Error saving signatures");
    } catch (error) {
      console.error(error);
    } finally {
      setSavingSignatures(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!contentRef.current || !contractContentRef.current) return;
    setGeneratingPdf(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF } = await import("jspdf");

      const contractEl = contractContentRef.current;
      const originalHeight = contractEl.style.height;
      const originalOverflow = contractEl.style.overflow;
      const originalMaxHeight = contractEl.style.maxHeight;

      contractEl.style.height = "auto";
      contractEl.style.overflow = "visible";
      contractEl.style.maxHeight = "none";

      const canvas = await html2canvas(contractEl, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
      });

      contractEl.style.height = originalHeight;
      contractEl.style.overflow = originalOverflow;
      contractEl.style.maxHeight = originalMaxHeight;

      const imgData = canvas.toDataURL("image/png");
      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      const pdf = new jsPDF("p", "mm", "a4");
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`contrato_${visitId}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
    } finally {
      setGeneratingPdf(false);
    }
  };

  const activeContract = data?.contracts?.find((c) => c.type === activeTab);

  const canSign = data?.allowSigning ?? false;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center p-2 md:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div
            className="absolute inset-0 bg-deep-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            ref={contentRef}
            className="relative w-full max-w-4xl h-[96vh] glass-panel rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            style={{ borderColor: "#f48221" }}
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: "#f4822130" }}>
              <h2 className="font-headline text-xl font-bold text-on-surface flex items-center gap-2">
                <FileText className="w-5 h-5" style={{ color: "#f48221" }} />
                Documentos
              </h2>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-container-highest transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {loading ? (
              <div className="flex-1 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#f48221" }} />
              </div>
            ) : !data || data.contracts.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-on-surface-variant p-6">
                <FileText className="w-16 h-16 mb-4 opacity-30" />
                <p className="text-lg font-medium">No hay documentos disponibles</p>
                <p className="text-sm mt-1">Los contratos estarán disponibles cuando el proyecto esté activo.</p>
              </div>
            ) : (
              <>
                <div className="flex border-b border-outline-variant/30 px-2 shrink-0 overflow-x-auto">
                  {data.contracts.map((contract) => (
                    <button
                      key={contract.type}
                      onClick={() => {
                        setActiveTab(contract.type);
                        setSignMode(false);
                        setSignatures({});
                        setExpandedSignature(null);
                      }}
                      className={`flex-shrink-0 px-4 py-3 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
                        activeTab === contract.type
                          ? "text-primary border-primary"
                          : "border-transparent text-on-surface-variant hover:text-on-surface"
                      }`}
                      style={
                        activeTab === contract.type
                          ? { borderColor: "#f48221", color: "#f48221" }
                          : undefined
                      }
                    >
                      <FileText className="w-4 h-4 inline mr-1.5" />
                      {contract.name}
                    </button>
                  ))}
                </div>

                <div
                  ref={contractContentRef}
                  className="flex-1 overflow-y-auto p-4 md:p-8"
                  style={{ backgroundColor: "#ffffff", color: "#000000" }}
                >
                  {activeContract && (
                    <div
                      className="contract-html max-w-[210mm] mx-auto text-sm leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: activeContract.html }}
                    />
                  )}
                </div>

                {activeContract && (
                  <div className="border-t border-outline-variant/30 p-3 px-4 flex items-center justify-between gap-3 shrink-0 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      {canSign && !signMode && (
                        <Button
                          onClick={() => setSignMode(true)}
                          className="gap-2"
                          style={{ backgroundColor: "#f48221" }}
                        >
                          <PenLine className="w-4 h-4" />
                          Firmar Documento
                        </Button>
                      )}
                      {canSign && signMode && (
                        <Button
                          variant="outline"
                          onClick={() => setSignMode(false)}
                          className="gap-2"
                        >
                          <X className="w-4 h-4" />
                          Salir de Modo Firma
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        onClick={handleDownloadPdf}
                        disabled={generatingPdf}
                        className="gap-2"
                      >
                        {generatingPdf ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Download className="w-4 h-4" />
                        )}
                        Descargar PDF
                      </Button>
                    </div>

                    {signMode && signatureFields.length > 0 && (
                      <Button
                        onClick={handleSaveSignatures}
                        disabled={savingSignatures || Object.keys(signatures).length === 0}
                        className="gap-2"
                      >
                        {savingSignatures ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Check className="w-4 h-4" />
                        )}
                        Guardar Firmas
                      </Button>
                    )}
                  </div>
                )}
              </>
            )}

            {signMode && signatureFields.length > 0 && (
              <div className="border-t border-outline-variant/30 p-4 shrink-0 max-h-[40vh] overflow-y-auto">
                <h4 className="text-sm font-semibold text-on-surface mb-3 flex items-center gap-2">
                  <PenLine className="w-4 h-4" style={{ color: "#f48221" }} />
                  Campos de Firma ({signatureFields.length})
                </h4>
                <div className="space-y-3">
                  {signatureFields.map((field) => (
                    <div
                      key={field.id}
                      className="border border-outline-variant/30 rounded-xl overflow-hidden"
                    >
                      <button
                        onClick={() =>
                          setExpandedSignature(
                            expandedSignature === field.id ? null : field.id
                          )
                        }
                        className="w-full flex items-center justify-between p-3 hover:bg-surface-container-low transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          {signatures[field.id] ? (
                            <img
                              src={signatures[field.id]}
                              alt="Firma"
                              className="w-12 h-8 object-contain border border-outline-variant rounded"
                            />
                          ) : (
                            <div className="w-12 h-8 border border-dashed border-outline-variant rounded flex items-center justify-center text-xs text-on-surface-variant">
                              Sin firma
                            </div>
                          )}
                          <span className="text-sm font-medium text-on-surface">
                            {field.label || field.id}
                          </span>
                        </div>
                        {expandedSignature === field.id ? (
                          <ChevronUp className="w-4 h-4 text-on-surface-variant" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-on-surface-variant" />
                        )}
                      </button>

                      <AnimatePresence>
                        {expandedSignature === field.id && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="p-3 pt-0 border-t border-outline-variant/20">
                              <SignatureCanvas
                                onSignature={(dataUrl) =>
                                  handleSignatureChange(field.id, dataUrl)
                                }
                                width={400}
                                height={140}
                              />
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

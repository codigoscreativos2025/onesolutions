"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, FileText, X, Download, PenLine, Check, ChevronDown, ChevronUp, Pencil } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { SignatureCanvas } from "./SignatureCanvas";
import { toast } from "sonner";

interface ContractType {
  type: string;
  name: string;
  html: string;
  fields?: { key: string; label: string; type: string }[];
  data?: Record<string, string>;
}

interface ContractData {
  contracts: ContractType[];
  stage: string;
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
  const [editMode, setEditMode] = useState(false);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [regenerating, setRegenerating] = useState(false);
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
      toast.error("Error al cargar los contratos");
    } finally {
      setLoading(false);
    }
  };

  const parseSignatureFields = useCallback(() => {
    const activeContract = data?.contracts?.find((c) => c.type === activeTab);
    if (!activeContract?.fields) return;

    const sigFields = activeContract.fields
      .filter((f) => f.type === "signature")
      .map((f) => ({
        id: f.key,
        label: f.label,
        element: undefined as HTMLElement | undefined,
      }));
    setSignatureFields(sigFields);
  }, [activeTab, data]);

  useEffect(() => {
    if (!signMode) return;
    parseSignatureFields();
  }, [signMode, activeTab, data, parseSignatureFields]);

  const enterEditMode = () => {
    const contract = data?.contracts?.find((c) => c.type === activeTab);
    const initialValues: Record<string, string> = {};
    contract?.fields?.forEach((f) => {
      if (f.type !== "signature") {
        initialValues[f.key] = contract.data?.[f.key] || "";
      }
    });
    setFieldValues(initialValues);
    setEditMode(true);
    setSignMode(false);
  };

  const regenerateContract = useCallback(async (values: Record<string, string>) => {
    setRegenerating(true);
    try {
      const res = await fetch("/api/contract/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visitId, fieldValues: values }),
      });
      if (!res.ok) throw new Error("Error regenerating contract");
      const json: ContractData = await res.json();
      setData(json);
    } catch (error) {
      console.error(error);
    } finally {
      setRegenerating(false);
    }
  }, [visitId]);

  useEffect(() => {
    if (!editMode || Object.keys(fieldValues).length === 0) return;
    const timer = setTimeout(() => {
      regenerateContract(fieldValues);
    }, 600);
    return () => clearTimeout(timer);
  }, [fieldValues, editMode, regenerateContract]);

  const handleFieldChange = (key: string, value: string) => {
    setFieldValues((prev) => ({ ...prev, [key]: value }));
  };

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
      toast.success("Firmas guardadas");
    } catch (error) {
      console.error(error);
      toast.error("Error al guardar firmas");
    } finally {
      setSavingSignatures(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!contentRef.current || !contractContentRef.current || !activeContract) return;
    setGeneratingPdf(true);

    const sigFieldDefs = activeContract.fields?.filter(f => f.type === "signature") || [];
    const lineDivs = contractContentRef.current.querySelectorAll(".signature-line");
    const replacements: Array<{ element: Element; originalHTML: string }> = [];

    lineDivs.forEach((lineDiv) => {
      const block = lineDiv.closest(".signature-block");
      if (!block) return;
      const labelEl = block.querySelector(".signature-label");
      const labelText = labelEl?.textContent?.trim().toLowerCase() || "";
      const matchingField = sigFieldDefs.find(f =>
        labelText.includes(f.label.toLowerCase()) || f.label.toLowerCase().includes(labelText)
      );
      if (matchingField && signatures[matchingField.key]) {
        replacements.push({ element: lineDiv, originalHTML: lineDiv.innerHTML });
        lineDiv.innerHTML = `<img src="${signatures[matchingField.key]}" alt="Signature" style="max-width:100%;height:35px;object-fit:contain;" />`;
      }
    });

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
      replacements.forEach(r => { r.element.innerHTML = r.originalHTML; });
      setGeneratingPdf(false);
    }
  };

  const activeContract = data?.contracts?.find((c) => c.type === activeTab);

  const nonSignatureFields = activeContract?.fields?.filter((f) => f.type !== "signature") || [];

  const renderFieldInput = (field: { key: string; label: string; type: string }) => {
    const value = fieldValues[field.key] ?? "";
    const baseClass = "w-full px-3 py-2 rounded-lg bg-white border border-outline-variant focus:border-primary outline-none text-on-surface text-sm";

    if (field.type === "date") {
      return (
        <input
          type="date"
          value={value}
          onChange={(e) => handleFieldChange(field.key, e.target.value)}
          className={baseClass}
        />
      );
    }
    if (field.type === "money") {
      return (
        <input
          type="number"
          step="0.01"
          value={value}
          onChange={(e) => handleFieldChange(field.key, e.target.value)}
          className={baseClass}
        />
      );
    }
    return (
      <input
        type="text"
        value={value}
        onChange={(e) => handleFieldChange(field.key, e.target.value)}
        className={baseClass}
      />
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-2 md:p-4 pb-20"
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
            className="relative w-full max-w-4xl h-[92vh] max-h-[92vh] glass-panel rounded-2xl shadow-2xl flex flex-col overflow-hidden"
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
                    <>
                      {editMode && nonSignatureFields.length > 0 && (
                        <div className="mb-4 p-4 bg-surface-container-low rounded-xl border border-outline-variant/30">
                          <h4 className="text-sm font-semibold text-on-surface mb-3 flex items-center gap-2">
                            <Pencil className="w-4 h-4" style={{ color: "#f48221" }} />
                            Editar Campos
                          </h4>
                          <div className="space-y-3">
                            {nonSignatureFields.map((field) => (
                              <div key={field.key}>
                                <label className="block text-xs font-medium text-on-surface-variant mb-1">
                                  {field.label}
                                </label>
                                {renderFieldInput(field)}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {regenerating && (
                        <div className="flex items-center justify-center py-4">
                          <Loader2 className="w-5 h-5 animate-spin" style={{ color: "#f48221" }} />
                        </div>
                      )}
                      <div
                        className="contract-html max-w-[210mm] mx-auto text-sm leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: activeContract.html }}
                      />

                      {/* Signature canvases rendered inside scrollable area */}
                      {signMode && signatureFields.length > 0 && (
                        <div className="mt-8 pt-6 border-t-2 border-outline-variant/20">
                          <h4 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: "#f48221" }}>
                            <PenLine className="w-4 h-4" />
                            Firmas ({signatureFields.length})
                          </h4>
                          <div className="space-y-4 max-w-lg">
                            {signatureFields.map((field) => (
                              <div key={field.id} className="border border-outline-variant/30 rounded-xl overflow-hidden bg-surface-container-low">
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
                                      <img src={signatures[field.id]} alt="Firma" className="w-12 h-8 object-contain border border-outline-variant rounded" />
                                    ) : (
                                      <div className="w-12 h-8 border border-dashed border-outline-variant rounded flex items-center justify-center text-xs text-on-surface-variant">Sin firma</div>
                                    )}
                                    <span className="text-sm font-medium">{field.label || field.id}</span>
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
                                          width={360}
                                          height={120}
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
                    </>
                  )}
                </div>

                {activeContract && (
                  <div className="sticky bottom-0 z-10 border-t border-outline-variant/30 p-3 px-4 flex items-center justify-between gap-3 shrink-0 flex-wrap bg-white/95 backdrop-blur-sm">


                    <div className="flex items-center gap-2 flex-wrap">


                      <Button


                        onClick={() => { setSignMode(!signMode); setEditMode(false); }}


                        className="gap-2 text-sm"


                        style={signMode ? undefined : { backgroundColor: "#f48221" }}


                        variant={signMode ? "outline" : undefined}


                        size="sm"


                      >


                        <PenLine className="w-4 h-4" />


                        {signMode ? "Salir de Firma" : "Firmar"}


                      </Button>


                      <Button


                        variant={editMode ? undefined : "outline"}


                        onClick={() => { setEditMode(!editMode); setSignMode(false); if (!editMode) enterEditMode(); }}


                        className="gap-2 text-sm"


                        style={editMode ? { backgroundColor: "#f48221" } : undefined}


                        size="sm"


                      >


                        <Pencil className="w-4 h-4" />


                        {editMode ? "Salir Edición" : "Editar"}


                      </Button>


                      <Button


                        variant="outline"


                        onClick={handleDownloadPdf}


                        disabled={generatingPdf}


                        className="gap-2 text-sm"


                        size="sm"


                      >


                        {generatingPdf ? (


                          <Loader2 className="w-4 h-4 animate-spin" />


                        ) : (


                          <Download className="w-4 h-4" />


                        )}


                        PDF


                      </Button>


                    </div>



                    {signMode && signatureFields.length > 0 && (


                      <Button


                        onClick={handleSaveSignatures}


                        disabled={savingSignatures || Object.keys(signatures).length === 0}


                        className="gap-2 text-sm"


                        size="sm"


                      >


                        {savingSignatures ? (


                          <Loader2 className="w-4 h-4 animate-spin" />


                        ) : (


                          <Check className="w-4 h-4" />


                        )}


                        Guardar


                      </Button>


                    )}


                  </div>


                )}
              </>
            )}

          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

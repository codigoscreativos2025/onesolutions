"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, FileText, X, Download, PenLine, Check, ChevronDown, ChevronUp, Pencil, Send, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { SignatureCanvas } from "./SignatureCanvas";
import { toast } from "sonner";
import { tailwindCssString } from "@/lib/tailwind-styles";

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
  visit?: Record<string, unknown>;
}

interface ContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  visitId: number;
  inline?: boolean;
  isTraineeLead?: boolean;
}

interface SignatureField {
  id: string;
  label: string;
  element?: HTMLElement;
}

export function ContractModal({ isOpen, onClose, visitId, inline, isTraineeLead }: ContractModalProps) {
  const { data: session } = useSession();
  const role = session?.user?.role;
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ContractData | null>(null);
  const [activeTab, setActiveTab] = useState("");
  const [signMode, setSignMode] = useState(false);
  const [signatures, setSignatures] = useState<Record<string, string>>({});
  const [expandedSignature, setExpandedSignature] = useState<string | null>(null);
  const [signatureFields, setSignatureFields] = useState<SignatureField[]>([]);
  const [savingSignatures, setSavingSignatures] = useState(false);
  const [savingFields, setSavingFields] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [regenerating, setRegenerating] = useState(false);
  const [showSendEmail, setShowSendEmail] = useState(false);
  const [sendToEmail, setSendToEmail] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);
  const [showEmailWarning, setShowEmailWarning] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const contractContentRef = useRef<HTMLDivElement>(null);

  const activeContract = data?.contracts?.find((c) => c.type === activeTab);
  const nonSignatureFields = activeContract?.fields?.filter((f) => f.type !== "signature") || [];

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

  const parseSignatureFields = useCallback(() => {
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

  useEffect(() => {
    if (!contractContentRef.current || !activeContract) return;

    const sigFieldDefs = activeContract.fields?.filter(f => f.type === "signature") || [];
    const blocks = contractContentRef.current.querySelectorAll(".signature-block");
    const labelCounts: Record<string, number> = {};

    blocks.forEach((block) => {
      const labelEl = block.querySelector(".signature-label");
      const labelText = labelEl?.textContent?.trim().toLowerCase() || "";
      
      labelCounts[labelText] = (labelCounts[labelText] || 0) + 1;
      const count = labelCounts[labelText];

      const matchingFields = sigFieldDefs.filter(f =>
        labelText.includes(f.label.toLowerCase()) || f.label.toLowerCase().includes(labelText)
      );
      
      const matchingField = matchingFields[count - 1] || matchingFields[0];

      if (matchingField && signatures[matchingField.key]) {
        const lineTarget = block.querySelector(".signature-line");
        const imgTarget = block.querySelector("img");
        if (lineTarget) {
          lineTarget.outerHTML = `<img src="${signatures[matchingField.key]}" alt="Signature" style="max-width:100%;height:35px;object-fit:contain;margin-bottom:4px;" class="injected-sig" />`;
        } else if (imgTarget) {
          imgTarget.src = signatures[matchingField.key];
        }
      }
    });
  }, [signatures, activeContract]);

  useEffect(() => {
    if (activeContract && activeContract.data) {
      const existingSigs: Record<string, string> = {};
      activeContract.fields?.forEach(f => {
        if (f.type === "signature" && activeContract.data?.[f.key]) {
          existingSigs[f.key] = activeContract.data[f.key];
        }
      });
      setSignatures(existingSigs);
    }
  }, [activeContract]);

  const fetchContracts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/contract/generate?visitId=${visitId}`);
      if (!res.ok) throw new Error("Error fetching contracts");
      const json: ContractData = await res.json();
      setData(json);
      
      // Select first tab if none selected
      if (json.contracts?.length > 0 && !activeTab) {
        setActiveTab(json.contracts[0].type);
      }
      
    } catch (error) {
      console.error(error);
      toast.error("Error al cargar los contratos");
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (key: string, value: string) => {
    setFieldValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSignatureChange = (fieldId: string, dataUrl: string) => {
    setSignatures((prev) => ({ ...prev, [fieldId]: dataUrl }));
  };

  const handleSaveSignatures = async () => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
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
      fetchContracts();
    } catch (error) {
      console.error(error);
      toast.error("Error al guardar firmas");
    } finally {
      setSavingSignatures(false);
    }
  };

  const handleSaveFields = async () => {
    const invalidEmails: string[] = [];
    nonSignatureFields.forEach(f => {
      const isEmail = f.type === "email" || f.key.toLowerCase().includes("email") || f.label.toLowerCase().includes("email");
      if (isEmail && fieldValues[f.key]) {
        if (!fieldValues[f.key].toLowerCase().endsWith("@gmail.com")) {
          invalidEmails.push(f.label);
        }
      }
    });

    if (invalidEmails.length > 0) {
      setShowEmailWarning(true);
      return;
    }

    setSavingFields(true);
    try {
      const res = await fetch(`/api/visits/${visitId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contractFields: fieldValues,
          contractType: activeTab,
        }),
      });
      if (!res.ok) throw new Error("Error saving fields");
      toast.success("Campos guardados exitosamente");
    } catch (error) {
      console.error(error);
      toast.error("Error al guardar campos");
    } finally {
      setSavingFields(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!contentRef.current || !contractContentRef.current || !activeContract) return;
    setGeneratingPdf(true);

    const sigFieldDefs = activeContract.fields?.filter(f => f.type === "signature") || [];
    const lineDivs = contractContentRef.current.querySelectorAll(".signature-line");
    const replacements: Array<{ element: Element; originalHTML: string }> = [];
    const labelCounts: Record<string, number> = {};

    lineDivs.forEach((lineDiv) => {
      const block = lineDiv.closest(".signature-block");
      if (!block) return;
      const labelEl = block.querySelector(".signature-label");
      const labelText = labelEl?.textContent?.trim().toLowerCase() || "";
      
      labelCounts[labelText] = (labelCounts[labelText] || 0) + 1;
      const count = labelCounts[labelText];

      const matchingFields = sigFieldDefs.filter(f =>
        labelText.includes(f.label.toLowerCase()) || f.label.toLowerCase().includes(labelText)
      );
      
      const matchingField = matchingFields[count - 1] || matchingFields[0];

      if (matchingField && signatures[matchingField.key]) {
        replacements.push({ element: lineDiv, originalHTML: lineDiv.innerHTML });
        lineDiv.innerHTML = `<img src="${signatures[matchingField.key]}" alt="Signature" style="max-width:100%;height:35px;object-fit:contain;" />`;
      }
    });

    try {
      const html2pdf = (await import("html2pdf.js")).default;

      const contractEl = contractContentRef.current;
      const targetEl = (contractEl.querySelector('.contract-html') as HTMLElement) || contractEl;
      
      
      const styleEl = document.createElement("style");
      styleEl.innerHTML = `
        .contract-html {
          color: #000000 !important;
          padding-bottom: 40px !important;
        }
        .w9-container {
          padding: 0 !important;
        }
        .signature-box {
          margin-top: 20px !important;
        }
        .sig-line {
          margin-bottom: 20px !important;
        }
        h2, h3, p, li, table, tr, .signature-block, .highlight-box, .cancellation-box, .client-info, .customer-info, .signatures-container, .mini-col, .section-row, .flex.gap-\\[1px\\], .fence-container, .footer-bar, .orange-bar, .details-total-container {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }
        ${tailwindCssString}
      `;
      targetEl.appendChild(styleEl);

      const opt: any = {
        margin:       10,
        filename:     `contrato_${visitId}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak:    { mode: ['css', 'legacy'] }
      };

      await html2pdf().set(opt).from(targetEl).save();

      targetEl.removeChild(styleEl);
    } catch (error) {
      console.error("Error generating PDF:", error);
    } finally {
      replacements.forEach(r => { r.element.innerHTML = r.originalHTML; });
      setGeneratingPdf(false);
    }
  };

  const handleSendEmail = async () => {
    if (!sendToEmail) {
      toast.error("Ingresa un email para enviar");
      return;
    }
    if (!contentRef.current || !contractContentRef.current || !activeContract) return;
    setSendingEmail(true);

    const sigFieldDefs = activeContract.fields?.filter(f => f.type === "signature") || [];
    const lineDivs = contractContentRef.current.querySelectorAll(".signature-line");
    const replacements: Array<{ element: Element; originalHTML: string }> = [];
    const labelCounts: Record<string, number> = {};

    lineDivs.forEach((lineDiv) => {
      const block = lineDiv.closest(".signature-block");
      if (!block) return;
      const labelEl = block.querySelector(".signature-label");
      const labelText = labelEl?.textContent?.trim().toLowerCase() || "";
      
      labelCounts[labelText] = (labelCounts[labelText] || 0) + 1;
      const count = labelCounts[labelText];

      const matchingFields = sigFieldDefs.filter(f =>
        labelText.includes(f.label.toLowerCase()) || f.label.toLowerCase().includes(labelText)
      );
      
      const matchingField = matchingFields[count - 1] || matchingFields[0];

      if (matchingField && signatures[matchingField.key]) {
        replacements.push({ element: lineDiv, originalHTML: lineDiv.innerHTML });
        lineDiv.innerHTML = `<img src="${signatures[matchingField.key]}" alt="Signature" style="max-width:100%;height:35px;object-fit:contain;" />`;
      }
    });

    try {
      const html2pdf = (await import("html2pdf.js")).default;

      const contractEl = contractContentRef.current;
      const targetEl = (contractEl.querySelector('.contract-html') as HTMLElement) || contractEl;
      
      const styleEl = document.createElement("style");
      styleEl.innerHTML = `
        .contract-html {
          color: #000000 !important;
          padding-bottom: 40px !important;
        }
        .w9-container {
          padding: 0 !important;
        }
        .signature-box {
          margin-top: 10px !important;
        }
        .sig-line {
          margin-bottom: 20px !important;
        }
        h2, h3, p, li, table, tr, .signature-block, .highlight-box, .cancellation-box, .client-info, .customer-info, .signatures-container, .mini-col, .section-row, .flex.gap-\\[1px\\], .fence-container, .footer-bar, .orange-bar, .details-total-container {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }
        ${tailwindCssString}
      `;
      targetEl.appendChild(styleEl);

      const opt: any = {
        margin:       10,
        filename:     `contrato_${visitId}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak:    { mode: ['css', 'legacy'] }
      };

      const pdfBase64DataUri = await html2pdf().set(opt).from(targetEl).output('datauristring');
      const pdfBase64 = pdfBase64DataUri.split(",")[1];
      
      targetEl.removeChild(styleEl);

      const res = await fetch("/api/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: sendToEmail,
          subject: `Contrato - Visita #${visitId}`,
          html: `<p>Adjunto encontrara el contrato de la visita #${visitId}.</p>`,
          pdfBase64,
          pdfFilename: `contrato_${visitId}.pdf`,
        }),
      });

      if (res.ok) {
        toast.success("Contrato enviado por email");
        setShowSendEmail(false);
      } else {
        toast.error("Error al enviar el email");
      }
    } catch (error) {
      console.error("Error sending email:", error);
      toast.error("Error al enviar el email");
    } finally {
      replacements.forEach(r => { r.element.innerHTML = r.originalHTML; });
      setSendingEmail(false);
    }
  };

  const renderFieldInput = (field: { key: string; label: string; type: string; options?: {label: string, value: string}[] }) => {
    const value = fieldValues[field.key] ?? "";
    const baseClass = "w-full px-3 py-2 rounded-lg bg-white border border-outline-variant focus:border-primary outline-none text-on-surface text-sm";

    if (field.type === "select") {
      return (
        <select
          value={value}
          onChange={(e) => handleFieldChange(field.key, e.target.value)}
          className={baseClass}
        >
          <option value="">Seleccionar...</option>
          {field.options?.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      );
    }
    if (field.type === "checkbox") {
      return (
        <div className="flex items-center gap-2 mt-2">
          <input
            type="checkbox"
            checked={value === "true"}
            onChange={(e) => handleFieldChange(field.key, e.target.checked ? "true" : "")}
            className="w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary"
          />
          <span className="text-sm text-on-surface">Sí</span>
        </div>
      );
    }
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

  const isPanelSolar = activeContract?.name.toLowerCase().includes("panel solar") || activeContract?.type.toLowerCase().includes("panel-solar");
  const canEditOrSign = (() => {
    if (role === "SETTER" && isPanelSolar) return false;
    if (role === "CLOSER" && isTraineeLead && !isPanelSolar) return false;
    return true;
  })();

  const innerContent = (
    <>
      <div
        ref={contentRef}
        className={`relative w-full ${inline ? "h-[70vh] min-h-[500px]" : "max-w-4xl h-[80vh] max-h-[80vh] mb-16"} glass-panel rounded-2xl shadow-2xl flex flex-col overflow-hidden`}
        style={{ borderColor: "#f48221" }}
        onClick={(e) => !inline && e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b bg-surface-container-low shrink-0" style={{ borderColor: "#f4822130" }}>
          <h2 className="font-headline text-xl font-bold text-on-surface flex items-center gap-2">
            <FileText className="w-5 h-5" style={{ color: "#f48221" }} />
            Documentos
          </h2>
        {!inline && (
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-container-highest transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

            {loading ? (
              <div className="flex-1 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#f48221" }} />
              </div>
            ) : !data || data.contracts.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-on-surface-variant p-6">
                <FileText className="w-16 h-16 mb-4 opacity-30" />
                <p className="text-lg font-medium">No hay documentos disponibles</p>
                <p className="text-sm mt-1">Asegúrate de que el proyecto tenga tipos de proyecto asignados para generar documentos.</p>
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
                            {signatureFields.map((field) => {
                              const isExpanded = expandedSignature === field.id;
                              const isSigned = !!signatures[field.id];
                              
                              return (
                                <div 
                                  key={field.id} 
                                  className={`rounded-xl overflow-hidden transition-all duration-200 border-2 shadow-sm ${
                                    isExpanded ? 'border-[#f48221] shadow-md' : isSigned ? 'border-black' : 'border-[#f48221]/40'
                                  }`}
                                >
                                  <button
                                    onClick={() => setExpandedSignature(isExpanded ? null : field.id)}
                                    className={`w-full flex items-center justify-between p-4 transition-colors ${
                                      isExpanded ? 'bg-[#f48221]/5' : 'bg-white hover:bg-gray-50'
                                    }`}
                                  >
                                    <div className="flex items-center gap-3">
                                      {isSigned ? (
                                        <img 
                                          src={signatures[field.id]} 
                                          alt="Firma" 
                                          className="w-14 h-9 object-contain border border-gray-200 rounded bg-white p-1 shadow-sm" 
                                        />
                                      ) : (
                                        <div className="w-14 h-9 border border-dashed border-[#f48221] rounded flex items-center justify-center text-[10px] font-bold text-[#f48221] bg-[#f48221]/10 uppercase tracking-wider">
                                          Vacío
                                        </div>
                                      )}
                                      <span className={`text-sm font-bold uppercase tracking-wide ${isSigned ? 'text-black' : 'text-gray-700'}`}>
                                        {field.label || field.id}
                                      </span>
                                    </div>
                                    {isExpanded ? (
                                      <ChevronUp className="w-5 h-5 text-[#f48221]" />
                                    ) : (
                                      <ChevronDown className="w-5 h-5 text-gray-400" />
                                    )}
                                  </button>
                                  <AnimatePresence>
                                    {isExpanded && (
                                      <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="overflow-hidden bg-white"
                                      >
                                        <div className="p-4 pt-0 border-t border-gray-100 flex flex-col items-center">
                                          <div className="w-full max-w-[360px] bg-white rounded-lg overflow-hidden mt-3 mb-4 flex flex-col items-center">
                                            <SignatureCanvas
                                              onSignature={(dataUrl) =>
                                                handleSignatureChange(field.id, dataUrl)
                                              }
                                              width={360}
                                              height={120}
                                            />
                                          </div>
                                        </div>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {activeContract && (
                  <div className="shrink-0 p-3 bg-surface border-t border-outline-variant flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      {canEditOrSign && (
                        <>
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
                        </>
                      )}
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
                      {showSendEmail ? (
                        <div className="flex items-center gap-2">
                          <input
                            value={sendToEmail}
                            onChange={(e) => setSendToEmail(e.target.value)}
                            placeholder="Email destinatario"
                            className="px-3 py-1.5 rounded-lg bg-white border border-outline-variant focus:border-primary outline-none text-sm w-48"
                          />
                          <Button
                            onClick={handleSendEmail}
                            disabled={sendingEmail}
                            className="gap-2 text-sm"
                            size="sm"
                          >
                            {sendingEmail ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Send className="w-4 h-4" />
                            )}
                            Enviar
                          </Button>
                          <button
                            onClick={() => setShowSendEmail(false)}
                            className="p-1.5 rounded-full hover:bg-surface-container-highest transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          onClick={() => {
                            const email = activeContract?.data?.clientEmail || "";
                            setSendToEmail(email);
                            setShowSendEmail(true);
                          }}
                          className="gap-2 text-sm"
                          size="sm"
                        >
                          <Send className="w-4 h-4" />
                          Enviar por Email
                        </Button>
                      )}
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
                        Guardar Firmas
                      </Button>
                    )}
                    {editMode && nonSignatureFields.length > 0 && (
                      <Button
                        onClick={handleSaveFields}
                        disabled={savingFields || Object.keys(fieldValues).length === 0}
                        className="gap-2 text-sm"
                        size="sm"
                      >
                        {savingFields ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Check className="w-4 h-4" />
                        )}
                        Guardar Campos
                      </Button>
                    )}
                  </div>
                )}
              </>
            )}

          </div>

          {/* Email Warning Modal */}
          {showEmailWarning && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
              <div className="bg-white rounded-xl max-w-sm w-full p-6 text-center shadow-2xl relative">
                <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-gray-900">Dominio Inválido</h3>
                <p className="text-gray-600 mb-6 text-sm">
                  Los campos de correo electrónico deben terminar obligatoriamente en <strong>@gmail.com</strong> para poder guardarse.
                </p>
                <Button onClick={() => setShowEmailWarning(false)} className="w-full">
                  Entendido
                </Button>
              </div>
            </div>
          )}
    </>
  );

  if (inline) {
    if (!isOpen) return null;
    return innerContent;
  }

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
            className="w-full max-w-4xl"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            onClick={(e) => e.stopPropagation()}
          >
            {innerContent}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

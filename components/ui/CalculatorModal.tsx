"use client";

import { useState } from "react";
import { Calculator, X } from "lucide-react";
import { Modal } from "./Modal";

export function CalculatorModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [display, setDisplay] = useState("0");
  const [equation, setEquation] = useState("");
  const [isNewNumber, setIsNewNumber] = useState(true);

  const handleNumber = (num: string) => {
    if (isNewNumber) {
      setDisplay(num);
      setIsNewNumber(false);
    } else {
      setDisplay(display === "0" ? num : display + num);
    }
  };

  const handleOperator = (op: string) => {
    if (equation && !isNewNumber) {
      calculate(op);
    } else {
      setEquation(display + " " + op);
      setIsNewNumber(true);
    }
  };

  const calculate = (nextOp?: string) => {
    try {
      const safeEq = equation + " " + display;
      const evalEq = safeEq.replace(/x/g, '*').replace(/÷/g, '/');
      const result = new Function('return ' + evalEq)();
      const finalResult = Number.isInteger(result) ? result : parseFloat(result.toFixed(4));
      
      setDisplay(String(finalResult));
      if (nextOp) {
        setEquation(String(finalResult) + " " + nextOp);
      } else {
        setEquation("");
      }
      setIsNewNumber(true);
    } catch {
      setDisplay("Error");
      setEquation("");
      setIsNewNumber(true);
    }
  };

  const handleClear = () => {
    setDisplay("0");
    setEquation("");
    setIsNewNumber(true);
  };

  const handleDelete = () => {
    if (isNewNumber) return;
    if (display.length === 1) {
      setDisplay("0");
      setIsNewNumber(true);
    } else {
      setDisplay(display.slice(0, -1));
    }
  };

  const handleDecimal = () => {
    if (isNewNumber) {
      setDisplay("0.");
      setIsNewNumber(false);
    } else if (!display.includes(".")) {
      setDisplay(display + ".");
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-green-100 text-green-600 dark:hover:bg-green-900/30 transition-colors"
        title="Calculadora"
      >
        <Calculator className="w-5 h-5" />
      </button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Calculadora">
        <div className="w-full max-w-sm mx-auto p-4 bg-surface dark:bg-surface-container rounded-3xl border border-green-500/30 shadow-lg shadow-green-500/10">
          
          <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-2xl mb-4 text-right overflow-hidden border border-green-200 dark:border-green-800">
            <div className="text-sm text-green-600 dark:text-green-400 h-5 mb-1 opacity-80">{equation}</div>
            <div className="text-4xl font-bold text-green-700 dark:text-green-300 tracking-tight truncate">{display}</div>
          </div>

          <div className="grid grid-cols-4 gap-2">
            <button onClick={handleClear} className="col-span-2 p-4 rounded-xl bg-red-100 dark:bg-red-900/30 text-red-600 font-bold hover:bg-red-200 transition-colors">AC</button>
            <button onClick={handleDelete} className="p-4 rounded-xl bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 font-bold hover:bg-green-200 transition-colors">DEL</button>
            <button onClick={() => handleOperator('÷')} className="p-4 rounded-xl bg-green-200 dark:bg-green-800/50 text-green-800 dark:text-green-200 font-bold text-xl hover:bg-green-300 transition-colors">÷</button>

            <button onClick={() => handleNumber('7')} className="p-4 rounded-xl bg-surface-container-low text-on-surface font-bold text-xl hover:bg-surface-container transition-colors shadow-sm">7</button>
            <button onClick={() => handleNumber('8')} className="p-4 rounded-xl bg-surface-container-low text-on-surface font-bold text-xl hover:bg-surface-container transition-colors shadow-sm">8</button>
            <button onClick={() => handleNumber('9')} className="p-4 rounded-xl bg-surface-container-low text-on-surface font-bold text-xl hover:bg-surface-container transition-colors shadow-sm">9</button>
            <button onClick={() => handleOperator('x')} className="p-4 rounded-xl bg-green-200 dark:bg-green-800/50 text-green-800 dark:text-green-200 font-bold text-xl hover:bg-green-300 transition-colors">x</button>

            <button onClick={() => handleNumber('4')} className="p-4 rounded-xl bg-surface-container-low text-on-surface font-bold text-xl hover:bg-surface-container transition-colors shadow-sm">4</button>
            <button onClick={() => handleNumber('5')} className="p-4 rounded-xl bg-surface-container-low text-on-surface font-bold text-xl hover:bg-surface-container transition-colors shadow-sm">5</button>
            <button onClick={() => handleNumber('6')} className="p-4 rounded-xl bg-surface-container-low text-on-surface font-bold text-xl hover:bg-surface-container transition-colors shadow-sm">6</button>
            <button onClick={() => handleOperator('-')} className="p-4 rounded-xl bg-green-200 dark:bg-green-800/50 text-green-800 dark:text-green-200 font-bold text-xl hover:bg-green-300 transition-colors">-</button>

            <button onClick={() => handleNumber('1')} className="p-4 rounded-xl bg-surface-container-low text-on-surface font-bold text-xl hover:bg-surface-container transition-colors shadow-sm">1</button>
            <button onClick={() => handleNumber('2')} className="p-4 rounded-xl bg-surface-container-low text-on-surface font-bold text-xl hover:bg-surface-container transition-colors shadow-sm">2</button>
            <button onClick={() => handleNumber('3')} className="p-4 rounded-xl bg-surface-container-low text-on-surface font-bold text-xl hover:bg-surface-container transition-colors shadow-sm">3</button>
            <button onClick={() => handleOperator('+')} className="p-4 rounded-xl bg-green-200 dark:bg-green-800/50 text-green-800 dark:text-green-200 font-bold text-xl hover:bg-green-300 transition-colors">+</button>

            <button onClick={() => handleNumber('0')} className="col-span-2 p-4 rounded-xl bg-surface-container-low text-on-surface font-bold text-xl hover:bg-surface-container transition-colors shadow-sm">0</button>
            <button onClick={handleDecimal} className="p-4 rounded-xl bg-surface-container-low text-on-surface font-bold text-xl hover:bg-surface-container transition-colors shadow-sm">.</button>
            <button onClick={() => calculate()} className="p-4 rounded-xl bg-green-500 text-white font-bold text-xl hover:bg-green-600 transition-colors shadow-md shadow-green-500/20">=</button>
          </div>
        </div>
      </Modal>
    </>
  );
}
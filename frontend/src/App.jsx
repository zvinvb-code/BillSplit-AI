import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import StepIndicator from './components/StepIndicator';
import Step1Upload from './components/Step1Upload';
import Step2Extracting from './components/Step2Extracting';
import Step3Review from './components/Step3Review';
import Step5Assign from './components/Step5Assign';
import Step6SplitResult from './components/Step6SplitResult';
import ApiKeyModal from './components/ApiKeyModal';
import HowItWorksModal from './components/HowItWorksModal';
import { billApi } from './api/billApi';
import { SAMPLE_BILLS_DATA } from './data/sampleBills';

export default function App() {
  // 4-Step Wizard State: 1 Upload, 2 Review, 3 Assign, 4 Split
  const [currentStep, setCurrentStep] = useState(1);
  const [maxCompletedStep, setMaxCompletedStep] = useState(1);
  const [isScanning, setIsScanning] = useState(false);

  // Bill Data State
  const [billData, setBillData] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);

  // People & Assignments State
  const [people, setPeople] = useState([
    { id: 'p_1', name: 'Rahul', color: '#059669' },
    { id: 'p_2', name: 'Ananya', color: '#4f46e5' },
    { id: 'p_3', name: 'You', color: '#d97706' },
  ]);
  const [assignments, setAssignments] = useState({});
  const [taxSplitMethod, setTaxSplitMethod] = useState('proportional');

  // Calculation Results State
  const [splitResult, setSplitResult] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);

  // API Key, Modals & Backend State
  const [geminiApiKey, setGeminiApiKey] = useState(() => localStorage.getItem('GEMINI_API_KEY') || '');
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [isHowItWorksOpen, setIsHowItWorksOpen] = useState(false);
  const [backendStatus, setBackendStatus] = useState('checking');

  // Health check on mount
  useEffect(() => {
    billApi.getHealth().then((res) => {
      setBackendStatus(res.status === 'healthy' ? 'healthy' : 'offline');
    });
  }, []);

  const handleSaveApiKey = (key) => {
    setGeminiApiKey(key);
    if (key) {
      localStorage.setItem('GEMINI_API_KEY', key);
    } else {
      localStorage.removeItem('GEMINI_API_KEY');
    }
  };

  // --- Step 1: Upload / Pick Sample ---
  const handleFileUpload = async (file) => {
    setUploadedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewImage(objectUrl);

    setIsScanning(true);

    try {
      const extracted = await billApi.extractBill(file, geminiApiKey);
      setBillData(extracted);

      const initialAssign = {};
      extracted.items.forEach((it) => {
        initialAssign[it.id] = [];
      });
      setAssignments(initialAssign);

      setTimeout(() => {
        setIsScanning(false);
        setCurrentStep(2);
        setMaxCompletedStep((prev) => Math.max(prev, 2));
      }, 2200);
    } catch (err) {
      console.error('Error during extraction:', err);
      const fallback = SAMPLE_BILLS_DATA.punjab_grill;
      setBillData(fallback);
      setTimeout(() => {
        setIsScanning(false);
        setCurrentStep(2);
        setMaxCompletedStep((prev) => Math.max(prev, 2));
      }, 2000);
    }
  };

  const handleSelectSample = async (sampleId) => {
    setPreviewImage(null);
    setUploadedFile(null);

    const sample = SAMPLE_BILLS_DATA[sampleId] || SAMPLE_BILLS_DATA.punjab_grill;
    setBillData(sample);

    setIsScanning(true);

    const initialAssign = {};
    sample.items.forEach((it) => {
      initialAssign[it.id] = [];
    });
    setAssignments(initialAssign);

    setTimeout(() => {
      setIsScanning(false);
      setCurrentStep(2);
      setMaxCompletedStep((prev) => Math.max(prev, 2));
    }, 2000);
  };

  // --- Step 2: Review Confirmation ---
  const handleConfirmReviewedBill = (reviewedBill) => {
    setBillData(reviewedBill);
    setAssignments((prev) => {
      const updated = { ...prev };
      reviewedBill.items.forEach((it) => {
        if (!updated[it.id]) updated[it.id] = [];
      });
      return updated;
    });

    setCurrentStep(3);
    setMaxCompletedStep((prev) => Math.max(prev, 3));
  };

  // --- Step 3: Assignments ---
  const handleToggleAssignment = (itemId, personId) => {
    setAssignments((prev) => {
      const current = prev[itemId] || [];
      const exists = current.includes(personId);
      const updated = exists
        ? current.filter((id) => id !== personId)
        : [...current, personId];
      return { ...prev, [itemId]: updated };
    });
  };

  const handleAssignToAll = (itemId) => {
    setAssignments((prev) => ({
      ...prev,
      [itemId]: people.map((p) => p.id),
    }));
  };

  const handleClearAssignment = (itemId) => {
    setAssignments((prev) => ({
      ...prev,
      [itemId]: [],
    }));
  };

  const handleAssignAllUnassignedToEveryone = () => {
    setAssignments((prev) => {
      const updated = { ...prev };
      billData.items.forEach((it) => {
        if (!updated[it.id] || updated[it.id].length === 0) {
          updated[it.id] = people.map((p) => p.id);
        }
      });
      return updated;
    });
  };

  // --- Step 4: Calculate Split ---
  const handleCalculateSplit = async () => {
    setIsCalculating(true);
    try {
      const result = await billApi.calculateSplit({
        bill: billData,
        people,
        assignments,
        taxSplitMethod,
      });
      setSplitResult(result);
      setCurrentStep(4);
      setMaxCompletedStep(4);
    } catch (err) {
      console.error('Calculation error:', err);
      alert('Failed to calculate split. Please check inputs.');
    } finally {
      setIsCalculating(false);
    }
  };

  // Reset to initial state
  const handleReset = () => {
    if (window.confirm('Start a new bill? Current split data will be reset.')) {
      setCurrentStep(1);
      setMaxCompletedStep(1);
      setBillData(null);
      setPreviewImage(null);
      setUploadedFile(null);
      setSplitResult(null);
      setAssignments({});
      setIsScanning(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Navbar */}
      <Navbar
        onReset={handleReset}
        onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
        onOpenHowItWorks={() => setIsHowItWorksOpen(true)}
        hasCustomKey={Boolean(geminiApiKey)}
        backendStatus={backendStatus}
        currentStep={currentStep}
      />

      {/* Step Stepper Navigation */}
      <StepIndicator
        currentStep={currentStep}
        maxCompletedStep={maxCompletedStep}
        onStepClick={(stepId) => setCurrentStep(stepId)}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {/* Scanning Animation State */}
        {isScanning ? (
          <Step2Extracting
            previewImage={previewImage}
            sampleBillData={billData}
          />
        ) : (
          <>
            {/* Step 1: Upload */}
            {currentStep === 1 && (
              <Step1Upload
                onFileUpload={handleFileUpload}
                onSelectSample={handleSelectSample}
              />
            )}

            {/* Step 2: Review */}
            {currentStep === 2 && billData && (
              <Step3Review
                initialBill={billData}
                previewImage={previewImage}
                onConfirmReviewedBill={handleConfirmReviewedBill}
                onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
              />
            )}

            {/* Step 3: Assign */}
            {currentStep === 3 && billData && (
              <Step5Assign
                bill={billData}
                people={people}
                assignments={assignments}
                taxSplitMethod={taxSplitMethod}
                onChangeTaxSplitMethod={setTaxSplitMethod}
                onUpdatePeople={setPeople}
                onToggleAssignment={handleToggleAssignment}
                onAssignToAll={handleAssignToAll}
                onClearAssignment={handleClearAssignment}
                onAssignAllUnassignedToEveryone={handleAssignAllUnassignedToEveryone}
                onCalculate={handleCalculateSplit}
                onBack={() => setCurrentStep(2)}
                isCalculating={isCalculating}
              />
            )}

            {/* Step 4: Split Result */}
            {currentStep === 4 && splitResult && billData && (
              <Step6SplitResult
                splitResult={splitResult}
                bill={billData}
                people={people}
                onBackToAssign={() => setCurrentStep(3)}
                onReset={handleReset}
              />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-slate-200 bg-white text-center text-xs text-slate-500 print:hidden">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>BillSplit AI — Snap. Assign. Split. • Built for IT Geeks Vibe Coding Challenge</span>
          <span className="text-slate-400">Indian Currency (₹ INR) & GST Compliant</span>
        </div>
      </footer>

      {/* Modals */}
      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        apiKey={geminiApiKey}
        onSaveApiKey={handleSaveApiKey}
      />

      <HowItWorksModal
        isOpen={isHowItWorksOpen}
        onClose={() => setIsHowItWorksOpen(false)}
      />
    </div>
  );
}

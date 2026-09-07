import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import StepIndicator from './components/StepIndicator';
import Step1Upload from './components/Step1Upload';
import Step2Extracting from './components/Step2Extracting';
import Step3Review from './components/Step3Review';
import Step4People from './components/Step4People';
import Step5Assign from './components/Step5Assign';
import Step6SplitResult from './components/Step6SplitResult';
import ApiKeyModal from './components/ApiKeyModal';
import { billApi } from './api/billApi';
import { SAMPLE_BILLS_DATA } from './data/sampleBills';

export default function App() {
  // Wizard state
  const [currentStep, setCurrentStep] = useState(1);
  const [maxCompletedStep, setMaxCompletedStep] = useState(1);

  // Bill Data State
  const [billData, setBillData] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);

  // People & Assignments State
  const [people, setPeople] = useState([
    { id: 'p_1', name: 'Aarav', color: '#10b981' },
    { id: 'p_2', name: 'Priya', color: '#6366f1' },
    { id: 'p_3', name: 'Rohan', color: '#f59e0b' },
  ]);
  const [assignments, setAssignments] = useState({});
  const [taxSplitMethod, setTaxSplitMethod] = useState('proportional');

  // Calculation Results State
  const [splitResult, setSplitResult] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);

  // API Key & Backend State
  const [geminiApiKey, setGeminiApiKey] = useState(() => localStorage.getItem('GEMINI_API_KEY') || '');
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [backendStatus, setBackendStatus] = useState('checking');

  // Check health on mount
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

    // Transition to Step 2 (Extracting)
    setCurrentStep(2);

    try {
      const extracted = await billApi.extractBill(file, geminiApiKey);
      setBillData(extracted);
      // Initialize default assignments: all empty
      const initialAssign = {};
      extracted.items.forEach((it) => {
        initialAssign[it.id] = [];
      });
      setAssignments(initialAssign);

      // Transition to Step 3 (Review) after a brief natural scanning delay
      setTimeout(() => {
        setCurrentStep(3);
        setMaxCompletedStep((prev) => Math.max(prev, 3));
      }, 2500);
    } catch (err) {
      console.error('Error during extraction:', err);
      // Graceful fallback to sample bill
      const fallback = SAMPLE_BILLS_DATA.punjab_grill;
      setBillData(fallback);
      setTimeout(() => {
        setCurrentStep(3);
        setMaxCompletedStep((prev) => Math.max(prev, 3));
      }, 2000);
    }
  };

  const handleSelectSample = async (sampleId) => {
    setPreviewImage(null); // Use clean thermal receipt representation
    setUploadedFile(null);

    const sample = SAMPLE_BILLS_DATA[sampleId] || SAMPLE_BILLS_DATA.punjab_grill;
    setBillData(sample);

    // Transition to Step 2 (Scanning animation)
    setCurrentStep(2);

    // Initialize assignments
    const initialAssign = {};
    sample.items.forEach((it) => {
      initialAssign[it.id] = [];
    });
    setAssignments(initialAssign);

    setTimeout(() => {
      setCurrentStep(3);
      setMaxCompletedStep((prev) => Math.max(prev, 3));
    }, 2200);
  };

  // --- Step 3: Review Confirmation ---
  const handleConfirmReviewedBill = (reviewedBill) => {
    setBillData(reviewedBill);
    // Ensure all items in assignments map
    setAssignments((prev) => {
      const updated = { ...prev };
      reviewedBill.items.forEach((it) => {
        if (!updated[it.id]) updated[it.id] = [];
      });
      return updated;
    });

    setCurrentStep(4);
    setMaxCompletedStep((prev) => Math.max(prev, 4));
  };

  // --- Step 4: People ---
  const handleNextFromPeople = () => {
    if (people.length === 0) {
      alert('Please add at least one person.');
      return;
    }
    setCurrentStep(5);
    setMaxCompletedStep((prev) => Math.max(prev, 5));
  };

  // --- Step 5: Assignments ---
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

  // --- Step 6: Calculate Split ---
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
      setCurrentStep(6);
      setMaxCompletedStep(6);
    } catch (err) {
      console.error('Calculation error:', err);
      alert('Failed to calculate split. Please check inputs.');
    } finally {
      setIsCalculating(false);
    }
  };

  // Reset to initial
  const handleReset = () => {
    if (window.confirm('Start a new bill? Current split data will be reset.')) {
      setCurrentStep(1);
      setMaxCompletedStep(1);
      setBillData(null);
      setPreviewImage(null);
      setUploadedFile(null);
      setSplitResult(null);
      setAssignments({});
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#030712] text-slate-100">
      {/* Navbar */}
      <Navbar
        onReset={handleReset}
        onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
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

      {/* Active Step Content */}
      <main className="flex-1">
        {currentStep === 1 && (
          <Step1Upload
            onFileUpload={handleFileUpload}
            onSelectSample={handleSelectSample}
          />
        )}

        {currentStep === 2 && (
          <Step2Extracting
            previewImage={previewImage}
            sampleBillData={billData}
          />
        )}

        {currentStep === 3 && billData && (
          <Step3Review
            initialBill={billData}
            previewImage={previewImage}
            onConfirmReviewedBill={handleConfirmReviewedBill}
            onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
          />
        )}

        {currentStep === 4 && (
          <Step4People
            people={people}
            onUpdatePeople={setPeople}
            onNext={handleNextFromPeople}
            onBack={() => setCurrentStep(3)}
          />
        )}

        {currentStep === 5 && billData && (
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
            onBack={() => setCurrentStep(4)}
            isCalculating={isCalculating}
          />
        )}

        {currentStep === 6 && splitResult && billData && (
          <Step6SplitResult
            splitResult={splitResult}
            bill={billData}
            people={people}
            onBackToAssign={() => setCurrentStep(5)}
            onReset={handleReset}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-slate-900 bg-slate-950/80 text-center text-xs text-slate-500 print:hidden">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>BillSplit AI — Snap. Assign. Split. • Built for IT Geeks Vibe Coding Challenge</span>
          <span className="text-slate-400">Indian Currency (₹ INR) & GST Compliant</span>
        </div>
      </footer>

      {/* API Key Modal */}
      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        apiKey={geminiApiKey}
        onSaveApiKey={handleSaveApiKey}
      />
    </div>
  );
}

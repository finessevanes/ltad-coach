import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Box, Stepper, Step, StepLabel, Paper } from '@mui/material';
import { TestSetup } from './steps/TestSetup';
import { RecordingStep } from './steps/RecordingStep';
import { ReviewStep } from './steps/ReviewStep';
import { UploadStep } from './steps/UploadStep';
import { LegTested, TestType } from '../../types/assessment';
import { TestResult } from '../../types/balanceTest';

const steps = ['Test Setup', 'Recording', 'Review', 'Upload'];

export default function AssessmentFlow() {
  const { athleteId } = useParams<{ athleteId: string }>();
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(0);
  const [testType] = useState<TestType>('one_leg_balance');
  const [legTested, setLegTested] = useState<LegTested>('left');
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<TestResult | null>(null);

  if (!athleteId) {
    navigate('/athletes');
    return null;
  }

  const handleNext = () => {
    setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handleLegSelect = (leg: LegTested) => {
    setLegTested(leg);
  };

  const handleDeviceSelect = (deviceId: string) => {
    setSelectedDevice(deviceId);
  };

  const handleRecordingComplete = (blob: Blob, duration: number, result?: TestResult) => {
    setVideoBlob(blob);
    setVideoDuration(duration);
    setTestResult(result || null);
    handleNext();
  };

  const handleReshoot = () => {
    setVideoBlob(null);
    setCurrentStep(1); // Back to recording
  };

  const handleUploadComplete = (assessmentId: string) => {
    navigate(`/assessments/${assessmentId}`);
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <TestSetup
            athleteId={athleteId}
            legTested={legTested}
            onLegSelect={handleLegSelect}
            onContinue={handleNext}
            onBack={() => navigate('/athletes')}
          />
        );
      case 1:
        return (
          <RecordingStep
            athleteId={athleteId}
            selectedDevice={selectedDevice}
            onDeviceSelect={handleDeviceSelect}
            testType={testType}
            legTested={legTested}
            onRecordingComplete={handleRecordingComplete}
            onBack={handleBack}
          />
        );
      case 2:
        return (
          <ReviewStep
            videoBlob={videoBlob}
            onReshoot={handleReshoot}
            onContinue={handleNext}
          />
        );
      case 3:
        return (
          <UploadStep
            athleteId={athleteId}
            videoBlob={videoBlob}
            videoDuration={videoDuration}
            testType={testType}
            legTested={legTested}
            testResult={testResult}
            onComplete={handleUploadComplete}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Stepper activeStep={currentStep}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Paper>

      <Box>{renderStep()}</Box>
    </Container>
  );
}

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box } from '@mui/material';
import { RecordingStep } from './steps/RecordingStep';
import { TransitionModal } from './components/TransitionModal';
import { FinalReviewModal } from './components/FinalReviewModal';
import { DualLegUploadView } from './components/DualLegUploadView';
import { TestResult } from '../../types/balanceTest';

type TwoLegPhase = 'left-leg-testing' | 'transition-modal' | 'right-leg-testing' | 'final-review' | 'uploading';

interface LegTestData {
  blob: Blob;
  duration: number;
  result: TestResult;  // Full test result including landmark history
}

export default function AssessmentFlow() {
  const { athleteId } = useParams<{ athleteId: string }>();
  const navigate = useNavigate();

  // Phase state machine
  const [phase, setPhase] = useState<TwoLegPhase>('left-leg-testing');

  // Test data storage
  const [leftLegData, setLeftLegData] = useState<LegTestData | null>(null);
  const [rightLegData, setRightLegData] = useState<LegTestData | null>(null);

  // Modal visibility
  const [showTransitionModal, setShowTransitionModal] = useState(false);
  const [showFinalReviewModal, setShowFinalReviewModal] = useState(false);

  // Camera selection persistence
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null);

  // Navigate back if no athleteId
  if (!athleteId) {
    navigate('/athletes');
    return null;
  }

  /**
   * Left leg test complete - show transition modal
   */
  const handleLeftLegComplete = (blob: Blob, duration: number, testResult?: any) => {
    if (!testResult) return;
    setLeftLegData({ blob, duration, result: testResult });
    setShowTransitionModal(true);
    setPhase('transition-modal');
  };

  /**
   * User clicks "Continue to Right Leg" in modal
   */
  const handleContinueToRightLeg = () => {
    setShowTransitionModal(false);
    setPhase('right-leg-testing');
  };

  /**
   * User clicks "Reshoot Left Leg" in modal
   */
  const handleReshootLeftLeg = () => {
    setShowTransitionModal(false);
    setLeftLegData(null); // Clear left leg data
    setPhase('left-leg-testing'); // Return to first phase
  };

  /**
   * Right leg test complete - show final review modal
   */
  const handleRightLegComplete = (blob: Blob, duration: number, testResult?: any) => {
    if (!testResult) return;
    setRightLegData({ blob, duration, result: testResult });
    setShowFinalReviewModal(true);
    setPhase('final-review');
  };

  /**
   * User clicks "Upload & Continue" in final review modal
   */
  const handleContinueToUpload = () => {
    setShowFinalReviewModal(false);
    setPhase('uploading');
  };

  /**
   * User clicks "Reshoot Left" in final review modal
   */
  const handleReshootLeftFromFinal = () => {
    setShowFinalReviewModal(false);
    setLeftLegData(null);
    setRightLegData(null); // Clear both since we're reshuffling
    setPhase('left-leg-testing');
  };

  /**
   * User clicks "Reshoot Right" in final review modal
   */
  const handleReshootRightFromFinal = () => {
    setShowFinalReviewModal(false);
    setRightLegData(null); // Clear right leg only, keep left
    setPhase('right-leg-testing');
  };

  /**
   * Upload complete - navigate to results
   */
  const handleUploadComplete = (assessmentId: string) => {
    navigate(`/assessments/${assessmentId}`);
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Phase 1: Left Leg Testing (raise left foot, stand on right) */}
      {phase === 'left-leg-testing' && (
        <RecordingStep
          athleteId={athleteId}
          selectedDevice={selectedCameraId}
          onDeviceSelect={setSelectedCameraId}
          testType="one_leg_balance"
          legTested="left"
          autoStart={false}
          instructionText="RAISE LEFT FOOT (Stand on right leg)"
          onRecordingComplete={handleLeftLegComplete}
          onBack={() => navigate(`/athletes/${athleteId}`)}
        />
      )}

      {/* Phase 2: Transition Modal */}
      {/* First test raises LEFT foot, so RIGHT leg was tested */}
      <TransitionModal
        open={showTransitionModal}
        leftLegResult={leftLegData?.result || null}
        completedLeg="right"
        onContinue={handleContinueToRightLeg}
        onReshootLeft={handleReshootLeftLeg}
      />

      {/* Phase 3: Right Leg Testing (raise right foot, stand on left) */}
      {phase === 'right-leg-testing' && (
        <RecordingStep
          athleteId={athleteId}
          selectedDevice={selectedCameraId}
          onDeviceSelect={setSelectedCameraId}
          testType="one_leg_balance"
          legTested="right"
          autoStart={true}
          instructionText="RAISE RIGHT FOOT (Stand on left leg)"
          onRecordingComplete={handleRightLegComplete}
          onBack={() => navigate(`/athletes/${athleteId}`)}
        />
      )}

      {/* Phase 3.5: Final Review Modal */}
      <FinalReviewModal
        open={showFinalReviewModal}
        leftLegResult={leftLegData?.result || null}
        rightLegResult={rightLegData?.result || null}
        onContinueToUpload={handleContinueToUpload}
        onReshootLeft={handleReshootLeftFromFinal}
        onReshootRight={handleReshootRightFromFinal}
      />

      {/* Phase 4: Upload Both Videos */}
      {phase === 'uploading' && leftLegData && rightLegData && (
        <DualLegUploadView
          athleteId={athleteId}
          leftLegData={leftLegData}
          rightLegData={rightLegData}
          onComplete={handleUploadComplete}
        />
      )}
    </Box>
  );
}

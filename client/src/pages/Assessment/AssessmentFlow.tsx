import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box } from '@mui/material';
import { RecordingStep } from './steps/RecordingStep';
import { TransitionModal } from './components/TransitionModal';
import { TwoLegUploadStep } from './components/TwoLegUploadStep';
import { TestResult } from '../../types/balanceTest';

type TwoLegPhase = 'left-leg-testing' | 'transition-modal' | 'right-leg-testing' | 'uploading';

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
   * Right leg test complete - proceed to upload
   */
  const handleRightLegComplete = (blob: Blob, duration: number, testResult?: any) => {
    if (!testResult) return;
    setRightLegData({ blob, duration, result: testResult });
    setPhase('uploading');
  };

  /**
   * Upload complete - navigate to results
   */
  const handleUploadComplete = (assessmentId: string) => {
    navigate(`/assessments/${assessmentId}`);
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50' }}>
      {/* Phase 1: Left Leg Testing */}
      {phase === 'left-leg-testing' && (
        <RecordingStep
          athleteId={athleteId}
          selectedDevice={null}
          onDeviceSelect={() => {}}
          testType="one_leg_balance"
          legTested="left"
          autoStart={false}
          onRecordingComplete={handleLeftLegComplete}
          onBack={() => navigate(`/athletes/${athleteId}`)}
        />
      )}

      {/* Phase 2: Transition Modal */}
      <TransitionModal
        open={showTransitionModal}
        leftLegResult={leftLegData?.result || null}
        onContinue={handleContinueToRightLeg}
        onReshootLeft={handleReshootLeftLeg}
      />

      {/* Phase 3: Right Leg Testing */}
      {phase === 'right-leg-testing' && (
        <RecordingStep
          athleteId={athleteId}
          selectedDevice={null}
          onDeviceSelect={() => {}}
          testType="one_leg_balance"
          legTested="right"
          autoStart={true}
          instructionText="Testing RIGHT leg"
          onRecordingComplete={handleRightLegComplete}
          onBack={() => navigate(`/athletes/${athleteId}`)}
        />
      )}

      {/* Phase 4: Upload Both Videos */}
      {phase === 'uploading' && leftLegData && rightLegData && (
        <TwoLegUploadStep
          athleteId={athleteId}
          leftLegData={leftLegData}
          rightLegData={rightLegData}
          onComplete={handleUploadComplete}
        />
      )}
    </Box>
  );
}

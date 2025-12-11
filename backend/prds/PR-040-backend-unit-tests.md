---
id: BE-040
depends_on: [BE-014, BE-015, BE-016, BE-017, BE-021, BE-027]
blocks: []
---

# BE-040: Backend Unit Tests (pytest)

## Scope

**In Scope:**
- Unit tests for CV metric calculations
- Tests for scoring logic
- Tests for failure detection
- Tests for agent prompts (basic validation)
- Pytest configuration

**Out of Scope:**
- E2E tests (BE-039)
- Integration tests with Firebase
- Load/performance testing

## Technical Decisions

- **Framework**: pytest
- **Coverage**: pytest-cov
- **Mocking**: unittest.mock
- **Test Location**: `backend/tests/`
- **Pattern**: Arrange-Act-Assert

## Acceptance Criteria

- [ ] pytest configured
- [ ] Tests for MediaPipe metric calculations
- [ ] Tests for scoring service
- [ ] Tests for failure detection
- [ ] Tests for agent orchestrator routing
- [ ] Coverage >80% for core business logic
- [ ] Tests run in CI

## Files to Create

- `backend/pytest.ini`
- `backend/tests/__init__.py`
- `backend/tests/conftest.py`
- `backend/tests/test_mediapipe_service.py`
- `backend/tests/test_scoring_service.py`
- `backend/tests/test_failure_detection.py`
- `backend/tests/test_agent_orchestrator.py`
- `backend/tests/fixtures/test_video.mp4`
- `backend/tests/fixtures/test_landmarks.json`

## Implementation Notes

### Install Dependencies

```bash
cd backend
source venv/bin/activate
pip install pytest pytest-cov pytest-mock
```

Add to `requirements.txt`:
```
pytest==7.4.3
pytest-cov==4.1.0
pytest-mock==3.12.0
```

### backend/pytest.ini

```ini
[pytest]
testpaths = tests
python_files = test_*.py
python_classes = Test*
python_functions = test_*
addopts =
    -v
    --cov=app
    --cov-report=html
    --cov-report=term-missing
    --cov-fail-under=80
markers =
    unit: Unit tests
    integration: Integration tests
    slow: Slow running tests
```

### backend/tests/conftest.py

```python
import pytest
import json
from pathlib import Path

@pytest.fixture
def test_landmarks_data():
    """Load test landmark data from fixtures"""
    fixtures_path = Path(__file__).parent / 'fixtures' / 'test_landmarks.json'
    with open(fixtures_path) as f:
        return json.load(f)

@pytest.fixture
def mock_video_path():
    """Path to test video file"""
    return str(Path(__file__).parent / 'fixtures' / 'test_video.mp4')

@pytest.fixture
def sample_metrics():
    """Sample metrics for testing"""
    return {
        'durationSeconds': 18.5,
        'swayStdX': 0.045,
        'swayStdY': 0.032,
        'swayPathLength': 152.0,
        'swayVelocity': 8.2,
        'armExcursionLeft': 0.12,
        'armExcursionRight': 0.15,
        'armAsymmetryRatio': 0.8,
        'correctionsCount': 3,
    }
```

### backend/tests/test_mediapipe_service.py

```python
import pytest
import numpy as np
from app.services.mediapipe_service import MediaPipeService

@pytest.fixture
def mediapipe_service():
    return MediaPipeService()

class TestSwayMetrics:
    def test_calculate_sway_metrics(self, mediapipe_service, test_landmarks_data):
        """Test sway metrics calculation from landmarks"""
        result = mediapipe_service.calculate_sway_metrics(
            test_landmarks_data['frames'],
            duration=18.5
        )

        assert 'swayStdX' in result
        assert 'swayStdY' in result
        assert 'swayPathLength' in result
        assert 'swayVelocity' in result

        # Verify metrics are reasonable
        assert 0 < result['swayStdX'] < 1.0
        assert 0 < result['swayPathLength'] < 500
        assert result['swayVelocity'] > 0

    def test_low_pass_filter(self, mediapipe_service):
        """Test low-pass filter reduces noise"""
        # Create noisy signal
        signal = np.sin(np.linspace(0, 4*np.pi, 100))
        noise = np.random.normal(0, 0.1, 100)
        noisy_signal = signal + noise

        # Apply filter
        filtered = mediapipe_service.apply_lowpass_filter(noisy_signal)

        # Filtered should be smoother (lower std of differences)
        noisy_diff_std = np.std(np.diff(noisy_signal))
        filtered_diff_std = np.std(np.diff(filtered))

        assert filtered_diff_std < noisy_diff_std

class TestArmMetrics:
    def test_calculate_arm_metrics(self, mediapipe_service, test_landmarks_data):
        """Test arm excursion calculation"""
        result = mediapipe_service.calculate_arm_metrics(
            test_landmarks_data['frames']
        )

        assert 'armExcursionLeft' in result
        assert 'armExcursionRight' in result
        assert 'armAsymmetryRatio' in result
        assert 'correctionsCount' in result

        # Verify ranges
        assert result['armExcursionLeft'] >= 0
        assert result['armAsymmetryRatio'] > 0

    def test_corrections_count(self, mediapipe_service):
        """Test threshold crossing detection"""
        # Create signal with known crossings
        positions = [0.5, 0.5, 0.8, 0.9, 0.5, 0.5, 0.2, 0.1, 0.5, 0.5]

        corrections = mediapipe_service._count_threshold_crossings(
            positions,
            threshold_std=0.5
        )

        # Should detect 2 corrections (up and down)
        assert corrections >= 1

class TestStabilityScore:
    def test_stability_score_calculation(self, mediapipe_service, sample_metrics):
        """Test composite stability score"""
        sway_metrics = {
            'swayStdX': sample_metrics['swayStdX'],
            'swayStdY': sample_metrics['swayStdY'],
            'swayPathLength': sample_metrics['swayPathLength'],
            'swayVelocity': sample_metrics['swayVelocity'],
        }

        arm_metrics = {
            'armExcursionLeft': sample_metrics['armExcursionLeft'],
            'armExcursionRight': sample_metrics['armExcursionRight'],
            'correctionsCount': sample_metrics['correctionsCount'],
            'armAsymmetryRatio': sample_metrics['armAsymmetryRatio'],
        }

        score = mediapipe_service.calculate_stability_score(
            sway_metrics,
            arm_metrics,
            duration=18.5
        )

        # Verify score is in valid range
        assert 0 <= score <= 100

    def test_perfect_balance_high_score(self, mediapipe_service):
        """Perfect balance should yield high score"""
        sway_metrics = {
            'swayVelocity': 1.0,  # Very low sway
        }
        arm_metrics = {
            'armExcursionLeft': 0.01,
            'armExcursionRight': 0.01,
            'correctionsCount': 0,
        }

        score = mediapipe_service.calculate_stability_score(
            sway_metrics,
            arm_metrics,
            duration=20.0  # Full duration
        )

        assert score > 80

    def test_poor_balance_low_score(self, mediapipe_service):
        """Poor balance should yield low score"""
        sway_metrics = {
            'swayVelocity': 25.0,  # High sway
        }
        arm_metrics = {
            'armExcursionLeft': 0.5,
            'armExcursionRight': 0.5,
            'correctionsCount': 10,
        }

        score = mediapipe_service.calculate_stability_score(
            sway_metrics,
            arm_metrics,
            duration=5.0  # Short duration
        )

        assert score < 40
```

### backend/tests/test_scoring_service.py

```python
import pytest
from app.services.scoring import ScoringService

@pytest.fixture
def scoring_service(mocker):
    # Mock database queries
    mocker.patch('app.services.database.db.get', return_value={
        'testType': 'one_leg_balance',
        'ageGroup': '10-11',
        'expectedScore': 4,
        'scoringTiers': {
            'score1': {'min': 1, 'max': 9, 'label': 'Beginning'},
            'score2': {'min': 10, 'max': 14, 'label': 'Developing'},
            'score3': {'min': 15, 'max': 19, 'label': 'Competent'},
            'score4': {'min': 20, 'max': 24, 'label': 'Proficient'},
            'score5': {'min': 25, 'max': None, 'label': 'Advanced'},
        }
    })
    return ScoringService()

class TestDurationScore:
    def test_score_1_beginning(self, scoring_service):
        """Test score 1 (Beginning)"""
        result = scoring_service.calculate_duration_score(duration=5.0, age=11)

        assert result['score'] == 1
        assert result['label'] == 'Beginning'
        assert result['expectationStatus'] == 'below'

    def test_score_2_developing(self, scoring_service):
        """Test score 2 (Developing)"""
        result = scoring_service.calculate_duration_score(duration=12.0, age=11)

        assert result['score'] == 2
        assert result['label'] == 'Developing'

    def test_score_3_competent(self, scoring_service):
        """Test score 3 (Competent)"""
        result = scoring_service.calculate_duration_score(duration=17.0, age=11)

        assert result['score'] == 3
        assert result['label'] == 'Competent'

    def test_score_4_proficient(self, scoring_service):
        """Test score 4 (Proficient) - meets expectation for age 10-11"""
        result = scoring_service.calculate_duration_score(duration=22.0, age=11)

        assert result['score'] == 4
        assert result['label'] == 'Proficient'
        assert result['expectationStatus'] == 'meets'

    def test_score_5_advanced(self, scoring_service):
        """Test score 5 (Advanced)"""
        result = scoring_service.calculate_duration_score(duration=26.0, age=11)

        assert result['score'] == 5
        assert result['label'] == 'Advanced'
        assert result['expectationStatus'] == 'above'

    def test_edge_cases(self, scoring_service):
        """Test boundary values"""
        # Exactly 15 seconds should be score 3
        result = scoring_service.calculate_duration_score(duration=15.0, age=11)
        assert result['score'] == 3

        # Exactly 25 seconds should be score 5
        result = scoring_service.calculate_duration_score(duration=25.0, age=11)
        assert result['score'] == 5

class TestPercentile:
    def test_percentile_mapping(self, scoring_service):
        """Test percentile calculation"""
        # Score 1 should be low percentile
        p1 = scoring_service.calculate_percentile(score=1, duration=5.0)
        assert p1 < 25

        # Score 5 should be high percentile
        p5 = scoring_service.calculate_percentile(score=5, duration=30.0)
        assert p5 > 85

class TestTeamRank:
    def test_team_ranking(self, scoring_service, mocker):
        """Test team-relative ranking"""
        # Mock athletes and assessments
        mocker.patch('app.services.database.db.query', side_effect=[
            # Athletes query
            [
                {'id': 'athlete-1'},
                {'id': 'athlete-2'},
                {'id': 'athlete-3'},
            ],
            # Assessments for athlete-1
            [{'metrics': {'stabilityScore': 85}}],
            # Assessments for athlete-2
            [{'metrics': {'stabilityScore': 70}}],
            # Assessments for athlete-3
            [{'metrics': {'stabilityScore': 60}}],
        ])

        result = scoring_service.calculate_team_rank(
            stability_score=75,
            coach_id='coach-1'
        )

        assert result['rank'] == 2  # 2nd best of 4
        assert result['totalAthletes'] == 4
```

### backend/tests/test_failure_detection.py

```python
import pytest
from app.services.mediapipe_service import MediaPipeService
from app.models.assessment import FailureReason

@pytest.fixture
def mediapipe_service():
    return MediaPipeService()

class TestFailureDetection:
    def test_foot_touchdown_detection(self, mediapipe_service):
        """Test foot touchdown failure"""
        # Create frames with foot lowering
        frames = []
        for i in range(30):
            y_pos = 0.3 + (i * 0.02)  # Foot gradually lowers
            frame = {
                'timestamp': i / 30.0,
                'landmarks': self._create_landmarks(raised_foot_y=y_pos)
            }
            frames.append(frame)

        result = mediapipe_service.detect_failure(
            frames,
            standing_leg='right',
            test_duration=20.0
        )

        assert result['failureReason'] == FailureReason.FOOT_TOUCHDOWN
        assert result['duration'] < 20.0

    def test_hands_left_hips_detection(self, mediapipe_service):
        """Test hands leaving hips failure"""
        frames = []
        for i in range(30):
            wrist_offset = 0 if i < 15 else 0.15  # Hands leave hips at frame 15
            frame = {
                'timestamp': i / 30.0,
                'landmarks': self._create_landmarks(wrist_offset=wrist_offset)
            }
            frames.append(frame)

        result = mediapipe_service.detect_failure(
            frames,
            standing_leg='left',
            test_duration=20.0
        )

        assert result['failureReason'] == FailureReason.HANDS_LEFT_HIPS

    def test_support_foot_moved_detection(self, mediapipe_service):
        """Test support foot movement failure"""
        frames = []
        for i in range(30):
            ankle_x = 0.5 + (i * 0.01)  # Foot gradually moves
            frame = {
                'timestamp': i / 30.0,
                'landmarks': self._create_landmarks(standing_ankle_x=ankle_x)
            }
            frames.append(frame)

        result = mediapipe_service.detect_failure(
            frames,
            standing_leg='left',
            test_duration=20.0
        )

        assert result['failureReason'] == FailureReason.SUPPORT_FOOT_MOVED

    def test_time_complete_success(self, mediapipe_service):
        """Test successful completion"""
        # Create perfect frames
        frames = []
        for i in range(600):  # 20 seconds at 30 FPS
            frame = {
                'timestamp': i / 30.0,
                'landmarks': self._create_landmarks()
            }
            frames.append(frame)

        result = mediapipe_service.detect_failure(
            frames,
            standing_leg='left',
            test_duration=20.0
        )

        assert result['failureReason'] == FailureReason.TIME_COMPLETE
        assert result['duration'] == 20.0

    @staticmethod
    def _create_landmarks(raised_foot_y=0.2, wrist_offset=0, standing_ankle_x=0.5):
        """Helper to create test landmark data"""
        landmarks = [{'x': 0.5, 'y': 0.5, 'z': 0, 'visibility': 0.9} for _ in range(33)]

        # Set specific landmarks for testing
        landmarks[27] = {'x': standing_ankle_x, 'y': 0.9, 'z': 0, 'visibility': 0.9}  # Left ankle
        landmarks[28] = {'x': 0.6, 'y': raised_foot_y, 'z': 0, 'visibility': 0.9}  # Right ankle
        landmarks[15] = {'x': 0.4 + wrist_offset, 'y': 0.6, 'z': 0, 'visibility': 0.9}  # Left wrist
        landmarks[16] = {'x': 0.6 + wrist_offset, 'y': 0.6, 'z': 0, 'visibility': 0.9}  # Right wrist
        landmarks[23] = {'x': 0.45, 'y': 0.6, 'z': 0, 'visibility': 0.9}  # Left hip
        landmarks[24] = {'x': 0.55, 'y': 0.6, 'z': 0, 'visibility': 0.9}  # Right hip

        return landmarks
```

### backend/tests/test_agent_orchestrator.py

```python
import pytest
from app.services.agent_orchestrator import AgentOrchestrator
from app.models.agent import AgentRequest, AgentRequestType

@pytest.fixture
def orchestrator():
    return AgentOrchestrator()

class TestAgentRouting:
    def test_routes_to_assessment_agent(self, orchestrator):
        """Test routing to assessment agent"""
        request = AgentRequest(
            requestType=AgentRequestType.NEW_ASSESSMENT,
            currentMetrics={'durationSeconds': 18.5}
        )

        response = orchestrator.process_request(request)

        assert response.agentUsed == 'assessment'

    def test_routes_to_progress_agent(self, orchestrator):
        """Test routing to progress agent"""
        request = AgentRequest(
            requestType=AgentRequestType.GENERATE_REPORT,
            historicalAssessments=[{'id': '1'}]
        )

        response = orchestrator.process_request(request)

        assert response.agentUsed == 'progress'

    def test_invalid_request_type_raises_error(self, orchestrator):
        """Test invalid request type"""
        request = AgentRequest(requestType='invalid')

        with pytest.raises(ValueError, match='Unknown request type'):
            orchestrator.process_request(request)
```

### Run Tests

```bash
cd backend
source venv/bin/activate

# Run all tests
pytest

# Run with coverage
pytest --cov

# Run specific test file
pytest tests/test_scoring_service.py

# Run with markers
pytest -m unit
```

## Estimated Complexity

**Size**: L (Large - ~4-5 hours)

## Notes

- Focus on business logic, not framework code
- Mock external dependencies (Firebase, Anthropic API)
- Use fixtures for common test data
- Test edge cases and error scenarios
- Coverage helps identify untested code paths

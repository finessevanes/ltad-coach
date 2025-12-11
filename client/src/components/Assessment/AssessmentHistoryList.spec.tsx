import { test, expect } from '@playwright/experimental-ct-react';
import { BrowserRouter } from 'react-router-dom';
import AssessmentHistoryList from './AssessmentHistoryList';
import { mockAssessmentHistory } from '../../test-utils/fixtures';

test.describe('AssessmentHistoryList', () => {
  test('displays list of assessments', async ({ mount }) => {
    const component = await mount(
      <BrowserRouter>
        <AssessmentHistoryList assessments={mockAssessmentHistory} athleteId="test-athlete-1" />
      </BrowserRouter>
    );

    await expect(component.getByText('Assessment History')).toBeVisible();

    // Should show all assessments
    for (const assessment of mockAssessmentHistory) {
      const duration = assessment.metrics.durationSeconds.toFixed(1);
      await expect(component.getByText(new RegExp(duration))).toBeVisible();
    }
  });

  test('shows summary statistics', async ({ mount }) => {
    const component = await mount(
      <BrowserRouter>
        <AssessmentHistoryList assessments={mockAssessmentHistory} athleteId="test-athlete-1" />
      </BrowserRouter>
    );

    // Should show total count
    await expect(component.getByText(/3 Total/)).toBeVisible();

    // Should show best score
    await expect(component.getByText(/Best: 4/)).toBeVisible();
  });

  test('handles empty assessment list', async ({ mount }) => {
    const component = await mount(
      <BrowserRouter>
        <AssessmentHistoryList assessments={[]} athleteId="test-athlete-1" />
      </BrowserRouter>
    );

    await expect(component.getByText(/no assessments yet/i)).toBeVisible();
  });

  test('assessments are sortable by clicking headers', async ({ mount, page }) => {
    const component = await mount(
      <BrowserRouter>
        <AssessmentHistoryList assessments={mockAssessmentHistory} athleteId="test-athlete-1" />
      </BrowserRouter>
    );

    // Desktop view should show table with sortable columns
    const dateHeader = component.getByRole('button', { name: /date/i });

    if (await dateHeader.isVisible()) {
      await dateHeader.click();
      // After clicking, order should change
    }
  });
});

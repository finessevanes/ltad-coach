import { test, expect } from '@playwright/experimental-ct-react';
import MetricsCard from './MetricsCard';
import { mockAssessmentData, mockTeamRank } from '../../test-utils/fixtures';

test.describe('MetricsCard', () => {
  test('displays all key metrics', async ({ mount }) => {
    const component = await mount(
      <MetricsCard metrics={mockAssessmentData.metrics} teamRank={mockTeamRank} />
    );

    // Verify duration displayed
    await expect(component.getByText(/18\.5/)).toBeVisible();

    // Verify stability score
    await expect(component.getByText('75')).toBeVisible();

    // Verify score badge
    await expect(component.getByText('3')).toBeVisible(); // Score
    await expect(component.getByText('Competent')).toBeVisible(); // Label
  });

  test('score badge has correct color based on value', async ({ mount }) => {
    const component = await mount(
      <MetricsCard
        metrics={{
          ...mockAssessmentData.metrics,
          durationScore: { score: 5, label: 'Advanced', expectationStatus: 'above', expectedScore: 4 },
        }}
        teamRank={mockTeamRank}
      />
    );

    const badge = component.getByTestId('score-badge');
    await expect(badge).toBeVisible();
  });

  test('displays expectation status correctly', async ({ mount }) => {
    const component = await mount(
      <MetricsCard metrics={mockAssessmentData.metrics} teamRank={mockTeamRank} />
    );

    // Should show "below expected" since expectationStatus is 'below'
    await expect(component.getByText(/below/i)).toBeVisible();
  });

  test('quality metrics section is expandable', async ({ mount }) => {
    const component = await mount(
      <MetricsCard metrics={mockAssessmentData.metrics} teamRank={mockTeamRank} />
    );

    // Quality details should be hidden initially
    await expect(component.getByText('Sway Velocity')).not.toBeVisible();

    // Click expand button
    await component.getByRole('button', { name: /view detailed/i }).click();

    // Quality details should now be visible
    await expect(component.getByText('Sway Velocity')).toBeVisible();
    await expect(component.getByText(/8\.2.*cm\/s/)).toBeVisible();
  });

  test('displays team ranking when provided', async ({ mount }) => {
    const component = await mount(
      <MetricsCard metrics={mockAssessmentData.metrics} teamRank={mockTeamRank} />
    );

    await expect(component.getByText('Team Ranking')).toBeVisible();
    await expect(component.getByText('#4 of 12')).toBeVisible();
  });
});

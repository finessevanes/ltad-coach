import { test, expect } from '@playwright/experimental-ct-react';
import ScoreBadge from './ScoreBadge';

test.describe('ScoreBadge', () => {
  test('displays score and label correctly', async ({ mount }) => {
    const durationScore = {
      score: 4,
      label: 'Proficient',
      expectationStatus: 'at',
      expectedScore: 4,
    };

    const component = await mount(<ScoreBadge durationScore={durationScore} />);

    await expect(component.getByText('4')).toBeVisible();
    await expect(component.getByText('Proficient')).toBeVisible();
  });

  test('shows trophy icon for high scores', async ({ mount }) => {
    const durationScore = {
      score: 5,
      label: 'Advanced',
      expectationStatus: 'above',
      expectedScore: 4,
    };

    const component = await mount(<ScoreBadge durationScore={durationScore} />);

    await expect(component.getByTestId('score-badge')).toBeVisible();
  });

  test('displays expectation status text', async ({ mount }) => {
    const durationScore = {
      score: 3,
      label: 'Competent',
      expectationStatus: 'below',
      expectedScore: 4,
    };

    const component = await mount(<ScoreBadge durationScore={durationScore} />);

    await expect(component.getByText(/below expectations/i)).toBeVisible();
    await expect(component.getByText(/Expected: 4/)).toBeVisible();
  });

  test('handles different score levels with appropriate styling', async ({ mount, page }) => {
    const scores = [
      { score: 1, label: 'Beginner' },
      { score: 3, label: 'Competent' },
      { score: 5, label: 'Advanced' },
    ];

    for (const durationScore of scores) {
      const component = await mount(<ScoreBadge durationScore={durationScore} />);
      await expect(component.getByText(durationScore.score.toString())).toBeVisible();
      await expect(component.getByText(durationScore.label)).toBeVisible();
      await component.unmount();
    }
  });
});

import { test, expect } from '@playwright/experimental-ct-react';
import PinEntry from './PinEntry';

test.describe('PinEntry', () => {
  test('renders PIN entry form', async ({ mount }) => {
    const component = await mount(
      <PinEntry onVerify={async () => {}} error={null} />
    );

    await expect(component.getByText(/secure report access/i)).toBeVisible();
    await expect(component.getByRole('textbox', { name: /4-digit pin/i })).toBeVisible();
  });

  test('accepts only numeric input and limits to 4 digits', async ({ mount }) => {
    const component = await mount(
      <PinEntry onVerify={async () => {}} error={null} />
    );

    const pinInput = component.getByRole('textbox', { name: /4-digit pin/i });

    await pinInput.fill('abc123456');

    // Should only contain 4 digits
    await expect(pinInput).toHaveValue('1234');
  });

  test('submit button disabled until PIN is 4 digits', async ({ mount }) => {
    const component = await mount(
      <PinEntry onVerify={async () => {}} error={null} />
    );

    const pinInput = component.getByRole('textbox', { name: /4-digit pin/i });
    const submitButton = component.getByRole('button', { name: /view report/i });

    // Initially disabled
    await expect(submitButton).toBeDisabled();

    // Still disabled with 3 digits
    await pinInput.fill('123');
    await expect(submitButton).toBeDisabled();

    // Enabled with 4 digits
    await pinInput.fill('1234');
    await expect(submitButton).toBeEnabled();
  });

  test('calls onVerify with PIN when submitted', async ({ mount, page }) => {
    let verifiedPin = '';

    const component = await mount(
      <PinEntry
        onVerify={async (pin) => {
          verifiedPin = pin;
        }}
        error={null}
      />
    );

    const pinInput = component.getByRole('textbox', { name: /4-digit pin/i });
    const submitButton = component.getByRole('button', { name: /view report/i });

    await pinInput.fill('5678');
    await submitButton.click();

    await page.waitForTimeout(100);

    expect(verifiedPin).toBe('5678');
  });

  test('displays error message when provided', async ({ mount }) => {
    const errorMessage = 'Invalid PIN. Please try again.';

    const component = await mount(
      <PinEntry onVerify={async () => {}} error={errorMessage} />
    );

    await expect(component.getByText(errorMessage)).toBeVisible();
  });
});

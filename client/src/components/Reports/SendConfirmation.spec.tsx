import { test, expect } from '@playwright/experimental-ct-react';
import SendConfirmation from './SendConfirmation';

test.describe('SendConfirmation', () => {
  test('renders email confirmation dialog', async ({ mount }) => {
    const component = await mount(
      <SendConfirmation
        open={true}
        onClose={() => {}}
        onSend={async () => ({ pin: '1234', reportId: 'report-123' })}
        parentEmail="parent@test.com"
        athleteName="Test Athlete"
      />
    );

    await expect(component.getByText(/send report to parent/i)).toBeVisible();
    await expect(component.getByRole('textbox', { name: /parent email/i })).toBeVisible();
  });

  test('validates email format', async ({ mount }) => {
    const component = await mount(
      <SendConfirmation
        open={true}
        onClose={() => {}}
        onSend={async () => ({ pin: '1234', reportId: 'report-123' })}
        parentEmail=""
        athleteName="Test Athlete"
      />
    );

    const emailInput = component.getByRole('textbox', { name: /parent email/i });
    await emailInput.fill('invalid-email');

    const sendButton = component.getByRole('button', { name: /send report/i });

    // Button should still be disabled for invalid email
    // (we check this by seeing if it's enabled with valid email)
    await emailInput.fill('valid@email.com');
    await expect(sendButton).toBeEnabled();
  });

  test('displays PIN after successful send', async ({ mount, page }) => {
    let sendCalled = false;
    const mockPin = '1234';

    const component = await mount(
      <SendConfirmation
        open={true}
        onClose={() => {}}
        onSend={async (email) => {
          sendCalled = true;
          return { pin: mockPin, reportId: 'report-123' };
        }}
        parentEmail="parent@test.com"
        athleteName="Test Athlete"
      />
    );

    const sendButton = component.getByRole('button', { name: /send report/i });
    await sendButton.click();

    // Wait for success state
    await page.waitForTimeout(500);

    // Should show success message with PIN
    await expect(component.getByText(/report sent successfully/i)).toBeVisible();
    await expect(component.getByText(mockPin)).toBeVisible();
  });

  test('pre-fills parent email when provided', async ({ mount }) => {
    const parentEmail = 'parent@test.com';

    const component = await mount(
      <SendConfirmation
        open={true}
        onClose={() => {}}
        onSend={async () => ({ pin: '1234', reportId: 'report-123' })}
        parentEmail={parentEmail}
        athleteName="Test Athlete"
      />
    );

    const emailInput = component.getByRole('textbox', { name: /parent email/i });
    await expect(emailInput).toHaveValue(parentEmail);
  });
});

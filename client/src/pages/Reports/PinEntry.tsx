import { useState, useRef, KeyboardEvent, ClipboardEvent } from 'react';
import { Box, TextField } from '@mui/material';

interface PinEntryProps {
  onSubmit: (pin: string) => void;
  disabled?: boolean;
}

export function PinEntry({ onSubmit, disabled }: PinEntryProps) {
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (index: number, value: string) => {
    // Only accept digits
    if (value && !/^\d$/.test(value)) return;

    const newDigits = [...digits];
    newDigits[index] = value;
    setDigits(newDigits);

    // Move to next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all digits entered
    if (newDigits.every((d) => d) && value) {
      onSubmit(newDigits.join(''));
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    // Move to previous on backspace
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '');

    if (pastedData.length === 6) {
      const newDigits = pastedData.split('');
      setDigits(newDigits);
      onSubmit(pastedData);
    }
  };

  return (
    <Box display="flex" justifyContent="center" gap={1}>
      {digits.map((digit, index) => (
        <TextField
          key={index}
          inputRef={(el) => (inputRefs.current[index] = el)}
          value={digit}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e as any)}
          onPaste={handlePaste}
          disabled={disabled}
          inputProps={{
            maxLength: 1,
            style: {
              textAlign: 'center',
              fontSize: '24px',
              fontWeight: 'bold',
              width: '40px',
              padding: '12px 0',
            },
            inputMode: 'numeric',
          }}
          variant="outlined"
        />
      ))}
    </Box>
  );
}

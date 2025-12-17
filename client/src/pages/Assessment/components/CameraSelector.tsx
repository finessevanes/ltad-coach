import { FormControl, InputLabel, Select, MenuItem } from '@mui/material';

interface CameraDevice {
  deviceId: string;
  label: string;
}

interface CameraSelectorProps {
  devices: CameraDevice[];
  selectedDevice: string | null;
  onSelect: (deviceId: string) => void;
  disabled?: boolean;
}

export const CameraSelector: React.FC<CameraSelectorProps> = ({
  devices,
  selectedDevice,
  onSelect,
  disabled = false,
}) => {
  return (
    <FormControl fullWidth disabled={disabled}>
      <InputLabel>Camera Source</InputLabel>
      <Select
        value={selectedDevice || ''}
        label="Camera Source"
        onChange={(e) => onSelect(e.target.value)}
        sx={{
          bgcolor: 'white',
        }}
      >
        {devices.map((device) => (
          <MenuItem key={device.deviceId} value={device.deviceId}>
            {device.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

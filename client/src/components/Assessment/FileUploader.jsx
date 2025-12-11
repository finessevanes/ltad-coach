import { useCallback, useState } from 'react';
import { Box, Typography, Button, Alert } from '@mui/material';
import { CloudUpload, VideoFile } from '@mui/icons-material';

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
const ACCEPTED_FORMATS = ['.mp4', '.mov', '.avi', '.m4v', '.webm'];

const FileUploader = ({ onFileSelect }) => {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  const validateFile = (file) => {
    setError(null);

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      setError(`File size must be less than 100MB. Your file is ${(file.size / 1024 / 1024).toFixed(2)}MB`);
      return false;
    }

    // Check file type
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
    if (!ACCEPTED_FORMATS.includes(fileExtension)) {
      setError(`Invalid file format. Please upload one of: ${ACCEPTED_FORMATS.join(', ')}`);
      return false;
    }

    return true;
  };

  const handleFile = (file) => {
    if (validateFile(file)) {
      setSelectedFile(file);
      onFileSelect(file);
    }
  };

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        sx={{
          border: '2px dashed',
          borderColor: dragActive ? 'primary.main' : 'divider',
          borderRadius: 2,
          p: 4,
          textAlign: 'center',
          backgroundColor: dragActive ? 'action.hover' : 'background.paper',
          cursor: 'pointer',
          transition: 'all 0.2s',
          '&:hover': {
            borderColor: 'primary.main',
            backgroundColor: 'action.hover',
          },
        }}
      >
        <input
          type="file"
          id="file-upload"
          accept={ACCEPTED_FORMATS.join(',')}
          onChange={handleChange}
          style={{ display: 'none' }}
        />

        {selectedFile ? (
          <>
            <VideoFile sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              {selectedFile.name}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Size: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
            </Typography>
            <Button
              variant="outlined"
              size="small"
              onClick={() => {
                setSelectedFile(null);
                onFileSelect(null);
              }}
              sx={{ mt: 2 }}
            >
              Remove File
            </Button>
          </>
        ) : (
          <>
            <CloudUpload sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Drop video file here
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              or
            </Typography>
            <label htmlFor="file-upload">
              <Button variant="contained" component="span">
                Choose File
              </Button>
            </label>
            <Typography variant="caption" display="block" sx={{ mt: 2 }} color="text.secondary">
              Accepted formats: {ACCEPTED_FORMATS.join(', ')}
            </Typography>
            <Typography variant="caption" display="block" color="text.secondary">
              Maximum file size: 100MB
            </Typography>
          </>
        )}
      </Box>
    </Box>
  );
};

export default FileUploader;

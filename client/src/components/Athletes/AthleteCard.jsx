import { Card, CardContent, CardActionArea, Typography, Chip, Box } from '@mui/material';
import { PersonOutline } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { generateRoute } from '../../utils/routes';

const AthleteCard = ({ athlete }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(generateRoute.athleteProfile(athlete.id));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'pending':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <Card sx={{ mb: 2 }}>
      <CardActionArea onClick={handleClick}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box display="flex" alignItems="center" gap={2}>
              <PersonOutline color="primary" fontSize="large" />
              <Box>
                <Typography variant="h6">{athlete.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Age: {athlete.age} | Gender: {athlete.gender}
                </Typography>
                {athlete.parent_email && (
                  <Typography variant="body2" color="text.secondary">
                    Parent: {athlete.parent_email}
                  </Typography>
                )}
              </Box>
            </Box>
            <Chip
              label={athlete.consent_status || 'pending'}
              color={getStatusColor(athlete.consent_status)}
              size="small"
            />
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
};

export default AthleteCard;

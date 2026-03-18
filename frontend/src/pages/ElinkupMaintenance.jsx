import React from 'react';
import { Box, Typography, Button, Container } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import LaunchIcon from '@mui/icons-material/Launch';

const ElinkupMaintenance = () => {
    const navigate = useNavigate();

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100vh',
                bgcolor: '#0f1012',
                color: 'white',
                textAlign: 'center',
                padding: 3
            }}
        >
            <Container maxWidth="sm">
                <RocketLaunchIcon sx={{ fontSize: 100, color: '#4caf50', mb: 2 }} />
                <Typography variant="h3" gutterBottom sx={{ fontWeight: 'bold' }}>
                    E-LinkUp is Live!
                </Typography>
                <Typography variant="h6" sx={{ mb: 4, color: 'rgba(255,255,255,0.7)' }}>
                    E-LinkUp has been officially deployed. You can now access it online!
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                    <Button
                        variant="contained"
                        onClick={() => window.open('https://e-linkup.onrender.com/', '_blank')}
                        startIcon={<LaunchIcon />}
                        sx={{
                            bgcolor: '#4caf50',
                            '&:hover': { bgcolor: '#45a049' },
                            padding: '10px 30px',
                            borderRadius: '25px'
                        }}
                    >
                        Visit E-LinkUp
                    </Button>
                    <Button
                        variant="outlined"
                        onClick={() => navigate('/home')}
                        sx={{
                            color: 'white',
                            borderColor: 'white',
                            '&:hover': { borderColor: 'rgba(255,255,255,0.7)', bgcolor: 'rgba(255,255,255,0.1)' },
                            padding: '10px 30px',
                            borderRadius: '25px'
                        }}
                    >
                        Back to Home
                    </Button>
                </Box>
            </Container>
        </Box>
    );
};

export default ElinkupMaintenance;

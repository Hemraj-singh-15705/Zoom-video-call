import React from 'react';
import { Box, Typography, Button, Container } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import EngineeringIcon from '@mui/icons-material/Engineering';

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
                <EngineeringIcon sx={{ fontSize: 100, color: '#ff4d4d', mb: 2 }} />
                <Typography variant="h3" gutterBottom sx={{ fontWeight: 'bold' }}>
                    Under Maintenance
                </Typography>
                <Typography variant="h6" sx={{ mb: 4, color: 'rgba(255,255,255,0.7)' }}>
                    E-LinkUp is currently only available locally. We will deploy it soon!
                </Typography>
                <Button
                    variant="contained"
                    onClick={() => navigate('/home')}
                    sx={{
                        bgcolor: '#ff4d4d',
                        '&:hover': { bgcolor: '#e60000' },
                        padding: '10px 30px',
                        borderRadius: '25px'
                    }}
                >
                    Back to Home
                </Button>
            </Container>
        </Box>
    );
};

export default ElinkupMaintenance;

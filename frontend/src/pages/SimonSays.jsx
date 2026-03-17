import React, { useState, useEffect, useCallback } from 'react';
import { Button, Typography, Container, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import withAuth from '../utils/withAuth';
import './SimonSays.css'; // We'll create this file next

const SimonSays = () => {
    const navigate = useNavigate();
    const [gameState, setGameState] = useState('instructions'); // 'instructions', 'playing', 'gameOver'
    const [sequence, setSequence] = useState([]);
    const [userSequence, setUserSequence] = useState([]);
    const [isFlashing, setIsFlashing] = useState(false);
    const [activeColor, setActiveColor] = useState(null);
    const [level, setLevel] = useState(0);

    const colors = ['red', 'green', 'purple', 'yellow'];

    const startGame = () => {
        setGameState('playing');
        setSequence([]);
        setUserSequence([]);
        setLevel(0);
        addNewColor([]);
    };

    const addNewColor = (currentSequence) => {
        const nextColor = colors[Math.floor(Math.random() * colors.length)];
        const newSequence = [...currentSequence, nextColor];
        setSequence(newSequence);
        playSequence(newSequence);
    };

    const playSequence = (seq) => {
        setIsFlashing(true);
        seq.forEach((color, index) => {
            setTimeout(() => {
                setActiveColor(color);
                setTimeout(() => setActiveColor(null), 500);
                if (index === seq.length - 1) {
                    setTimeout(() => setIsFlashing(false), 600);
                }
            }, (index + 1) * 800);
        });
    };

    const handleColorClick = (color) => {
        if (isFlashing || gameState !== 'playing') return;

        const newUserSequence = [...userSequence, color];
        setUserSequence(newUserSequence);

        // Check if correct
        const currentIndex = newUserSequence.length - 1;
        if (newUserSequence[currentIndex] !== sequence[currentIndex]) {
            setGameState('gameOver');
            return;
        }

        if (newUserSequence.length === sequence.length) {
            setLevel(level + 1);
            setUserSequence([]);
            setTimeout(() => addNewColor(sequence), 1000);
        }
    };

    return (
        <Container maxWidth="sm" style={{ textAlign: 'center', marginTop: '50px' }}>
            {gameState === 'instructions' && (
                <Box>
                    <Typography variant="h3" gutterBottom>Simon Says</Typography>
                    <Typography variant="h6" paragraph>
                        Welcome to Simon Says! Here's how to play:
                    </Typography>
                    <Box textAlign="left" mb={4}>
                        <Typography>1. Watch the sequence of colors flash.</Typography>
                        <Typography>2. Repeat the sequence by clicking the colors in the same order.</Typography>
                        <Typography>3. Each correct sequence adds a new color to the chain.</Typography>
                        <Typography>4. If you miss a color, the game ends.</Typography>
                    </Box>
                    <Button variant="contained" size="large" onClick={startGame}>Start Game</Button>
                    <Button variant="text" onClick={() => navigate('/home')} style={{ display: 'block', margin: '20px auto' }}>Back to Home</Button>
                </Box>
            )}

            {gameState === 'playing' && (
                <Box>
                    <Typography variant="h4">Level: {level}</Typography>
                    <div className="simon-board">
                        {colors.map(color => (
                            <div
                                key={color}
                                className={`simon-btn ${color} ${activeColor === color ? 'active' : ''}`}
                                onClick={() => handleColorClick(color)}
                            />
                        ))}
                    </div>
                </Box>
            )}

            {gameState === 'gameOver' && (
                <Box>
                    <Typography variant="h3" color="error">Game Over!</Typography>
                    <Typography variant="h5">Final Level: {level}</Typography>
                    <Button variant="contained" size="large" onClick={startGame} style={{ marginTop: '20px' }}>Try Again</Button>
                    <Button variant="outlined" size="large" onClick={() => navigate('/home')} style={{ marginTop: '20px', marginLeft: '10px' }}>Back to Home</Button>
                </Box>
            )}
        </Container>
    );
};

export default withAuth(SimonSays);

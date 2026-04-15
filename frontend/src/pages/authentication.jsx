import * as React from 'react';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import TextField from '@mui/material/TextField';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import ToggleButton from '@mui/material/ToggleButton';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { AuthContext } from '../contexts/AuthContext';
import { toast } from 'react-toastify';

const defaultTheme = createTheme({
    palette: {
        primary: {
            main: '#4F46E5', // Indigo-600
            dark: '#4338CA',
            contrastText: '#fff',
        },
        secondary: {
            main: '#10B981', // Emerald
        },
        background: {
            default: '#F3F4F6',
            paper: '#FFFFFF',
        },
    },
    typography: {
        fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
        h4: {
            fontWeight: 700,
            color: '#1F2937',
        },
        subtitle1: {
            color: '#6B7280',
        }
    },
    shape: {
        borderRadius: 12,
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    textTransform: 'none',
                    fontWeight: 600,
                    padding: '12px 24px',
                    boxShadow: 'none',
                    '&:hover': {
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
                    },
                },
            },
        },
        MuiTextField: {
            styleOverrides: {
                root: {
                    '& .MuiOutlinedInput-root': {
                        borderRadius: 12,
                        backgroundColor: '#F9FAFB',
                        transition: 'all 0.2s',
                        '&:hover': {
                            backgroundColor: '#FFFFFF',
                        },
                        '&.Mui-focused': {
                            backgroundColor: '#FFFFFF',
                            boxShadow: '0 0 0 4px rgba(79, 70, 229, 0.1)',
                        }
                    },
                },
            },
        },
    },
});

export default function Authentication() {

    const [username, setUsername] = React.useState("");
    const [password, setPassword] = React.useState("");
    const [name, setName] = React.useState("");
    const [error, setError] = React.useState("");
    const [loading, setLoading] = React.useState(false);
    const [formState, setFormState] = React.useState(0);

    const { handleRegister, handleLogin } = React.useContext(AuthContext);

    let handleAuth = async () => {
        setLoading(true);
        try {
            if (formState === 0) {
                await handleLogin(username, password)
                toast.success("Login Successful!")
            }
            if (formState === 1) {
                let result = await handleRegister(name, username, password);
                console.log(result);
                setUsername("");
                toast.success(result || "Registered Successfully!")
                setError("")
                setFormState(0)
                setPassword("")
            }
        } catch (err) {
            console.log(err);
            let message = (err.response && err.response.data && err.response.data.message) || "Something went wrong. Is the server running?";
            setError(message);
        } finally {
            setLoading(false);
        }
    }

    const handleFormStateChange = (event, newValue) => {
        if (newValue !== null) {
            setFormState(newValue);
            setError("");
        }
    };

    return (
        <ThemeProvider theme={defaultTheme}>
            <Grid container component="main" sx={{ height: '100vh', backgroundColor: 'background.default' }}>
                <CssBaseline />
                <Grid
                    item
                    xs={false}
                    sm={4}
                    md={7}
                    sx={{
                        backgroundImage: 'url(https://picsum.photos/1920/1080?random)',
                        backgroundRepeat: 'no-repeat',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        color: 'white',
                        p: 4,
                        position: 'relative',
                        '&::before': {
                            content: '""',
                            position: 'absolute',
                            top: 0,
                            right: 0,
                            bottom: 0,
                            left: 0,
                            backgroundColor: 'rgba(0, 0, 0, 0.5)', 
                            zIndex: 1,
                        }
                    }}
                >
                    <Box sx={{ textAlign: 'center', maxWidth: 600, display: { xs: 'none', sm: 'block' }, position: 'relative', zIndex: 2 }}>
                        <Typography variant="h3" sx={{ fontWeight: 800, mb: 2, textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>
                            Welcome to Zoom Clone
                        </Typography>
                        <Typography variant="h6" sx={{ opacity: 0.9, lineHeight: 1.6, textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}>
                            Connect with your team from anywhere. Experience high-quality video meetings with seamless collaboration.
                        </Typography>
                    </Box>
                </Grid>
                <Grid item xs={12} sm={8} md={5} component={Paper} elevation={0} square sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', bgcolor: 'background.paper', borderLeft: '1px solid #E5E7EB' }}>
                    <Box
                        sx={{
                            my: 8,
                            mx: { xs: 4, md: 8 },
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                        }}
                    >
                        <Avatar sx={{ m: 1, bgcolor: 'primary.main', width: 56, height: 56, mb: 3, boxShadow: '0 4px 14px 0 rgba(79, 70, 229, 0.39)' }}>
                            <LockOutlinedIcon fontSize="large" />
                        </Avatar>

                        <Typography component="h1" variant="h4" gutterBottom>
                            {formState === 0 ? 'Sign In' : 'Create Account'}
                        </Typography>
                        <Typography variant="subtitle1" sx={{ mb: 4, textAlign: 'center' }}>
                            {formState === 0 ? 'Welcome back! Please enter your details.' : 'Join us to start hosting amazing video meetings.'}
                        </Typography>

                        <ToggleButtonGroup
                            value={formState}
                            exclusive
                            onChange={handleFormStateChange}
                            aria-label="auth form state"
                            sx={{ mb: 4, width: '100%', '& .MuiToggleButton-root': { flex: 1, py: 1.5, fontWeight: 600, border: '1px solid #E5E7EB', color: '#6B7280' }, '& .Mui-selected': { bgcolor: 'primary.main !important', color: 'white !important', border: '1px solid #4F46E5 !important' } }}
                        >
                            <ToggleButton value={0} aria-label="sign in">
                                Sign In
                            </ToggleButton>
                            <ToggleButton value={1} aria-label="sign up">
                                Sign Up
                            </ToggleButton>
                        </ToggleButtonGroup>

                        <Box component="form" noValidate sx={{ mt: 1, width: '100%' }}>
                            {formState === 1 && (
                                <TextField
                                    margin="normal"
                                    required
                                    fullWidth
                                    id="name"
                                    label="Full Name"
                                    name="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="John Doe"
                                    autoFocus
                                />
                            )}

                            <TextField
                                margin="normal"
                                required
                                fullWidth
                                id="username"
                                label="Username"
                                name="username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="johndoe123"
                                autoFocus={formState === 0}
                            />
                            <TextField
                                margin="normal"
                                required
                                fullWidth
                                name="password"
                                label="Password"
                                type="password"
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                            />

                            {error && (
                                <Typography variant="body2" sx={{ color: 'error.main', mt: 1, textAlign: 'center', backgroundColor: '#FEE2E2', padding: '8px', borderRadius: '8px' }}>
                                    {error}
                                </Typography>
                            )}

                            <Button
                                type="button"
                                fullWidth
                                variant="contained"
                                size="large"
                                sx={{ mt: 4, mb: 2, height: 50, fontSize: '1.1rem' }}
                                onClick={handleAuth}
                                disabled={loading}
                            >
                                {loading ? <CircularProgress size={24} color="inherit" /> : (formState === 0 ? "Sign In" : "Sign Up")}
                            </Button>
                        </Box>
                    </Box>
                </Grid>
            </Grid>
        </ThemeProvider>
    );
}
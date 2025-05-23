"use client";
import React from 'react';
import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  IconButton,
  InputAdornment,
  TextField,
  Typography,
  Paper,
  CircularProgress,
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import StarIcon from '@mui/icons-material/Star';
import { authService } from '../services/auth';
import { useRouter } from 'next/navigation';
import { BG_COLOR, PRIMARY_COLOR, SECONDARY_COLOR, TERTIARY_COLOR, QUATERNARY_COLOR, ICON_COLOR } from './colors';

export default function LoginCard() {
  const router = useRouter();
  const [showPassword, setShowPassword] = React.useState(false);
  const [remember, setRemember] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [formData, setFormData] = React.useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = React.useState({
    email: '',
    password: '',
    general: '',
  });

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string) => {
    // Password must be at least 8 characters long and contain at least one number
    return password.length >= 8 && /\d/.test(password);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    setErrors(prev => ({
      ...prev,
      [name]: ''
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let hasErrors = false;
    const newErrors = { email: '', password: '', general: '' };

    // Validate email
    if (!formData.email) {
      newErrors.email = 'Email is required';
      hasErrors = true;
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
      hasErrors = true;
    }

    // Validate password
    if (!formData.password) {
      newErrors.password = 'Password is required';
      hasErrors = true;
    } else if (!validatePassword(formData.password)) {
      newErrors.password = 'Password must be at least 8 characters long and contain at least one number';
      hasErrors = true;
    }

    setErrors(newErrors);

    if (!hasErrors) {
      setIsLoading(true);
      try {
        const response = await authService.login(formData);
        if (response.success) {
          // Store token based on 'Remember me'
          if (response.token) {
            if (remember) {
              localStorage.setItem('authToken', response.token);
              sessionStorage.removeItem('authToken');
            } else {
              sessionStorage.setItem('authToken', response.token);
              localStorage.removeItem('authToken');
            }
          }
          // Redirect to homepage after successful login
          router.push('/homepage');
        } else {
          setErrors(prev => ({
            ...prev,
            general: response.error || 'Login failed. Please try again.'
          }));
        }
      } catch {
        setErrors(prev => ({
          ...prev,
          general: 'An unexpected error occurred. Please try again.'
        }));
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleClickShowPassword = () => setShowPassword((show) => !show);
  const handleMouseDownPassword = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: BG_COLOR,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Paper
        elevation={0}
        component="form"
        onSubmit={handleSubmit}
        sx={{
          p: { xs: 3, sm: 6 },
          width: 420,
          borderRadius: 4,
          bgcolor: 'white',
          boxShadow: '0 2px 16px 0 rgba(0,0,0,0.04)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {/* Logo */}
        <StarIcon sx={{ color: ICON_COLOR, fontSize: 40, mt: 4, mb: 2 }} />
        {/* Heading */}
        <Typography variant="h3" fontWeight={400} align="center" gutterBottom sx={{ color: ICON_COLOR, mt: 2 }}>
          Welcome !
        </Typography>
        <Typography variant="h6" align="center" sx={{ color: ICON_COLOR, mb: 6, fontWeight: 300 }}>
          Please enter your details
        </Typography>

        {errors.general && (
          <Typography 
            color="error" 
            variant="body2" 
            sx={{ 
              mb: 2, 
              textAlign: 'center',
              bgcolor: TERTIARY_COLOR,
              color: 'white',
              p: 1,
              borderRadius: 1
            }}
          >
            {errors.general}
          </Typography>
        )}

        {/* Email Field */}
        <TextField
          fullWidth
          label="Email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleInputChange}
          error={!!errors.email}
          helperText={errors.email}
          sx={{
            mb: 3,
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
              '& fieldset': {
                borderColor: 'rgba(0, 0, 0, 0.1)',
              },
              '&:hover fieldset': {
                borderColor: ICON_COLOR,
              },
              '&.Mui-focused fieldset': {
                borderColor: ICON_COLOR,
              },
              '& .MuiInputBase-input': {
                color: ICON_COLOR,
              },
            },
            '& .MuiInputLabel-root': {
              color: ICON_COLOR,
              '&.Mui-focused': {
                color: ICON_COLOR,
              },
            },
            '& .MuiFormHelperText-root': {
              color: ICON_COLOR,
            },
          }}
        />

        {/* Password Field */}
        <TextField
          fullWidth
          label="Password"
          name="password"
          type={showPassword ? 'text' : 'password'}
          value={formData.password}
          onChange={handleInputChange}
          error={!!errors.password}
          helperText={errors.password}
          sx={{
            mb: 2,
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
              '& fieldset': {
                borderColor: 'rgba(0, 0, 0, 0.1)',
              },
              '&:hover fieldset': {
                borderColor: ICON_COLOR,
              },
              '&.Mui-focused fieldset': {
                borderColor: ICON_COLOR,
              },
              '& .MuiInputBase-input': {
                color: ICON_COLOR,
              },
            },
            '& .MuiInputLabel-root': {
              color: ICON_COLOR,
              '&.Mui-focused': {
                color: ICON_COLOR,
              },
            },
            '& .MuiFormHelperText-root': {
              color: ICON_COLOR,
            },
          }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-label="toggle password visibility"
                  onClick={handleClickShowPassword}
                  onMouseDown={handleMouseDownPassword}
                  edge="end"
                  sx={{ color: ICON_COLOR }}
                >
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        {/* Remember me */}
        <Box sx={{ display: 'flex', width: '100%', alignItems: 'center', mb: 1, mt: 1, justifyContent: 'space-between' }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                sx={{ 
                  p: 0.5, 
                  color: ICON_COLOR, 
                  '&.Mui-checked': { 
                    color: ICON_COLOR 
                  } 
                }}
              />
            }
            label={<Typography variant="body2" sx={{ color: ICON_COLOR, fontWeight: 300, display: 'flex', alignItems: 'center', height: '100%' }}>Remember me</Typography>}
            sx={{ alignItems: 'center' }}
          />
          <Typography
            component="a"
            href="#"
            variant="body2"
            sx={{ 
              color: ICON_COLOR, 
              textDecoration: 'underline', 
              cursor: 'pointer', 
              fontWeight: 300,
              '&:hover': {
                opacity: 0.8,
              }
            }}
          >
            Forgot Password?
          </Typography>
        </Box>

        {/* Log In Button */}
        <Button
          type="submit"
          fullWidth
          size="large"
          disabled={isLoading}
          sx={{
            fontWeight: 500,
            fontSize: '1.1rem',
            py: 1.5,
            borderRadius: 2,
            textTransform: 'none',
            boxShadow: 'none',
            position: 'relative',
            background: `linear-gradient(135deg, ${PRIMARY_COLOR} 0%, ${SECONDARY_COLOR} 100%)`,
            color: 'white',
            mt: 7,
            mb: 2,
            '&:hover': {
              background: `linear-gradient(135deg, ${SECONDARY_COLOR} 0%, ${PRIMARY_COLOR} 100%)`,
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            },
            '&:disabled': {
              background: `linear-gradient(135deg, ${TERTIARY_COLOR} 0%, ${QUATERNARY_COLOR} 100%)`,
              color: 'rgba(255,255,255,0.7)',
            }
          }}
        >
          {isLoading ? (
            <>
              <CircularProgress
                size={24}
                sx={{
                  color: 'white',
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  marginTop: '-12px',
                  marginLeft: '-12px',
                }}
              />
              <span style={{ opacity: 0 }}>Login</span>
            </>
          ) : (
            'Login'
          )}
        </Button>
      </Paper>
    </Box>
  );
} 
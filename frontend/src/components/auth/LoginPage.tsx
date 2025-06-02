import { GoogleSignInButton, LoadingSpinner } from "@/components/common";
import { useAuthContext } from "@/contexts";
import {
  Analytics as AnalyticsIcon,
  BugReport as BugIcon,
  Lightbulb as IdeaIcon,
  Speed as SpeedIcon,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Card,
  CardContent,
  Container,
  Fade,
  Typography,
  useTheme,
} from "@mui/material";
import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const LoginPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, isLoading, isLoggingIn, error, login } =
    useAuthContext();

  // Get the intended destination from location state
  const from = (location.state as any)?.from?.pathname || "/";

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate, from]);

  // Show loading spinner while checking authentication
  if (isLoading) {
    return <LoadingSpinner />;
  }

  // Don't render if already authenticated (will redirect)
  if (isAuthenticated) {
    return null;
  }

  const handleGoogleSignIn = (response: any) => {
    // If we have a credential, use it, otherwise fall back to redirect flow
    // With OneTap removed, we should almost always use the redirect flow
    if (response?.credential) {
      login(response.credential);
    } else {
      // Default to redirect flow
      login();
    }
  };

  const handleGoogleError = (error: any) => {
    console.error("Google Sign-In error:", error);
    // Fall back to redirect flow on error
    login();
  };

  const features = [
    {
      icon: <BugIcon />,
      title: "Bug Tracking",
      description: "Track and manage bugs efficiently",
    },
    {
      icon: <IdeaIcon />,
      title: "Idea Management",
      description: "Manage and organize your ideas",
    },
    {
      icon: <AnalyticsIcon />,
      title: "Analytics",
      description: "Insights into your projects",
    },
    {
      icon: <SpeedIcon />,
      title: "Fast & Modern",
      description: "Built for speed and productivity",
    },
  ];

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: `
          radial-gradient(circle at 20% 80%, ${theme.palette.primary.main}20 0%, transparent 50%), 
          radial-gradient(circle at 80% 20%, ${theme.palette.secondary.main}20 0%, transparent 50%),
          linear-gradient(135deg, ${theme.palette.background.default} 0%, #f1f5f9 100%)
        `,
        px: 2,
        position: "relative",
        "&::before": {
          content: '""',
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `
            radial-gradient(circle at 10% 20%, ${theme.palette.primary.main}08 0%, transparent 50%), 
            radial-gradient(circle at 90% 80%, ${theme.palette.secondary.main}08 0%, transparent 50%)
          `,
          pointerEvents: "none",
          zIndex: -1,
        },
      }}
    >
      <Container maxWidth="lg">
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" },
            gap: { xs: 4, lg: 8 },
            alignItems: "center",
            minHeight: { lg: "80vh" },
            maxWidth: "xl",
          }}
        >
          {/* Left Side - Hero Content */}
          <Fade in timeout={800}>
            <Box sx={{ textAlign: { xs: "center", lg: "left" } }}>
              <Typography
                variant="h1"
                component="h1"
                gutterBottom
                sx={{
                  fontWeight: 800,
                  background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                  backgroundClip: "text",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  fontSize: {
                    xs: "2.5rem",
                    sm: "3rem",
                    md: "3.5rem",
                    lg: "4rem",
                  },
                  letterSpacing: "-0.025em",
                  lineHeight: 1.1,
                  mb: 3,
                }}
              >
                🔗 Nexus
              </Typography>

              <Typography
                variant="h5"
                color="text.secondary"
                sx={{
                  fontWeight: 400,
                  fontSize: { xs: "1.125rem", sm: "1.25rem", md: "1.5rem" },
                  lineHeight: 1.4,
                  mb: 4,
                  maxWidth: { lg: "90%" },
                }}
              >
                An easy way to track bugs, manage ideas, and analyze your
                projects with beautiful insights.
              </Typography>

              {/* Feature Grid */}
              <Box
                sx={{
                  display: { xs: "none", lg: "grid" },
                  gridTemplateColumns: "repeat(2, 1fr)",
                  gap: 3,
                  mt: 6,
                }}
              >
                {features.map((feature, index) => (
                  <Fade in timeout={1000 + index * 200} key={feature.title}>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                        p: 2,
                        borderRadius: 3,
                        transition: "all 0.3s ease-in-out",
                        "&:hover": {
                          backgroundColor: "rgba(255, 255, 255, 0.5)",
                        },
                      }}
                    >
                      <Box
                        sx={{
                          p: 1,
                          borderRadius: 2,
                          background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                          color: "white",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          minWidth: 40,
                          height: 40,
                        }}
                      >
                        {feature.icon}
                      </Box>
                      <Box>
                        <Typography
                          variant="subtitle1"
                          sx={{ fontWeight: 600, mb: 0.5 }}
                        >
                          {feature.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {feature.description}
                        </Typography>
                      </Box>
                    </Box>
                  </Fade>
                ))}
              </Box>
            </Box>
          </Fade>

          {/* Right Side - Login Card */}
          <Fade in timeout={1200}>
            <Card
              elevation={0}
              sx={{
                borderRadius: 4,
                overflow: "hidden",
                background: "rgba(255, 255, 255, 0.9)",
                backdropFilter: "blur(20px)",
                border: `1px solid ${theme.palette.divider}`,
                boxShadow: "0 20px 40px rgba(0, 0, 0, 0.1)",
                maxWidth: { xs: "100%", sm: 480 },
                mx: "auto",
              }}
            >
              <CardContent
                sx={{
                  p: { xs: 4, sm: 5, md: 6 },
                  textAlign: "center",
                }}
              >
                {/* Card Header */}
                <Box sx={{ mb: 4 }}>
                  <Typography
                    variant="h3"
                    component="h2"
                    gutterBottom
                    sx={{
                      fontWeight: 700,
                      color: theme.palette.text.primary,
                      fontSize: { xs: "1.75rem", sm: "2rem", md: "2.25rem" },
                      mb: 2,
                    }}
                  >
                    Welcome Back
                  </Typography>
                  <Typography
                    variant="body1"
                    color="text.secondary"
                    sx={{
                      fontSize: { xs: "1rem", sm: "1.125rem" },
                      lineHeight: 1.6,
                    }}
                  >
                    Sign in to access your projects and start tracking bugs and
                    ideas
                  </Typography>
                </Box>

                {/* Error Alert */}
                {!!error && (
                  <Alert
                    severity="error"
                    sx={{
                      mb: 3,
                      textAlign: "left",
                      borderRadius: 3,
                      border: "none",
                      boxShadow: "0 4px 20px rgba(239, 68, 68, 0.15)",
                    }}
                  >
                    Authentication failed. Please try again.
                  </Alert>
                )}

                {/* Google Sign In Button */}
                <Box sx={{ mb: 4 }}>
                  <GoogleSignInButton
                    onSuccess={handleGoogleSignIn}
                    onError={handleGoogleError}
                    disabled={isLoggingIn}
                  />
                </Box>
              </CardContent>
            </Card>
          </Fade>
        </Box>
      </Container>
    </Box>
  );
};

export default LoginPage;

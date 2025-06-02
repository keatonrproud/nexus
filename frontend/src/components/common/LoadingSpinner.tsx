import { Box, CircularProgress, Typography, useTheme } from "@mui/material";

interface LoadingSpinnerProps {
  message?: string;
  size?: number;
  fullScreen?: boolean;
  showLogo?: boolean;
  minimal?: boolean;
}

export const LoadingSpinner = ({
  message = "Loading...",
  size = 40,
  fullScreen = false,
  showLogo = false,
  minimal = false,
}: LoadingSpinnerProps) => {
  const theme = useTheme();

  if (fullScreen) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: `
            radial-gradient(circle at 20% 80%, ${theme.palette.primary.main}20 0%, transparent 50%), 
            radial-gradient(circle at 80% 20%, ${theme.palette.secondary.main}20 0%, transparent 50%),
            linear-gradient(135deg, ${theme.palette.background.default} 0%, #f1f5f9 100%)
          `,
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
        {!minimal && (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 3,
              p: 3,
            }}
          >
            {showLogo && (
              <Typography
                variant="h2"
                component="h1"
                sx={{
                  fontWeight: 800,
                  background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                  backgroundClip: "text",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  fontSize: { xs: "2.5rem", sm: "3rem", md: "3.5rem" },
                  letterSpacing: "-0.025em",
                  mb: 3,
                }}
              >
                🔗 Nexus
              </Typography>
            )}
            <CircularProgress size={size} />
            {message && (
              <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
                {message}
              </Typography>
            )}
          </Box>
        )}
      </Box>
    );
  }

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight="200px"
      gap={2}
    >
      <CircularProgress size={size} />
      {message && (
        <Typography variant="body2" color="text.secondary">
          {message}
        </Typography>
      )}
    </Box>
  );
};

import { useAuthContext } from "@/contexts";
import LogoutIcon from "@mui/icons-material/Logout";
import {
  AppBar,
  Box,
  Container,
  Divider,
  IconButton,
  Toolbar,
  Typography,
  useTheme,
} from "@mui/material";
import { type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { UserAvatar } from "./UserAvatar";

interface LayoutProps {
  children: ReactNode;
  title?: string;
  maxWidth?: "xs" | "sm" | "md" | "lg" | "xl" | false;
}

export const Layout = ({
  children,
  title = "🔗 Nexus",
  maxWidth = "xl",
}: LayoutProps) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user, logout } = useAuthContext();

  const handleLogout = () => {
    logout();
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        background: `
          radial-gradient(circle at 20% 80%, ${theme.palette.primary.main}15 0%, transparent 50%), 
          radial-gradient(circle at 80% 20%, ${theme.palette.secondary.main}15 0%, transparent 50%),
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
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          background: "rgba(255, 255, 255, 0.85)",
          backdropFilter: "blur(20px)",
          borderBottom: `1px solid ${theme.palette.divider}`,
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
        }}
      >
        <Toolbar
          sx={{
            px: { xs: 2, sm: 3, md: 4 },
            py: 1,
            justifyContent: "space-between",
          }}
        >
          {/* Logo/Title */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              cursor: "pointer",
              transition: "transform 0.2s ease-in-out",
              "&:hover": {
                // No transform animation
              },
            }}
            onClick={() => navigate("/")}
          >
            <Typography
              variant="h5"
              component="div"
              sx={{
                fontWeight: 800,
                background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                fontSize: { xs: "1.25rem", sm: "1.5rem", md: "1.75rem" },
                letterSpacing: "-0.025em",
              }}
            >
              {title}
            </Typography>
          </Box>

          {/* User Menu */}
          {user && (
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                }}
              >
                <UserAvatar
                  user={user}
                  size={32}
                  sx={{
                    border: `1px solid ${theme.palette.divider}`,
                  }}
                />
                <Typography
                  variant="body1"
                  sx={{
                    fontWeight: 500,
                    display: { xs: "none", sm: "block" },
                  }}
                >
                  {user.name || "Keaton Proud"}
                </Typography>
              </Box>
              <Box
                sx={{
                  height: "20px",
                  mx: 1.5,
                  display: { xs: "none", sm: "block" },
                }}
              >
                <Divider orientation="vertical" />
              </Box>
              <IconButton
                size="small"
                onClick={handleLogout}
                sx={{
                  color: theme.palette.text.disabled,
                  "&:hover": {
                    color: theme.palette.primary.main,
                  },
                }}
              >
                <LogoutIcon fontSize="small" />
              </IconButton>
            </Box>
          )}
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Container
        component="main"
        maxWidth={maxWidth}
        sx={{
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
          py: { xs: 2, sm: 3, md: 4 },
          px: { xs: 2, sm: 3, md: 4, lg: 5 },
          width: "100%",
          position: "relative",
        }}
      >
        {children}
      </Container>
    </Box>
  );
};

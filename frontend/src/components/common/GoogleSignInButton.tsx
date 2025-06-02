import { Box, CircularProgress } from "@mui/material";
import React, { useEffect, useRef, useState } from "react";

interface GoogleSignInButtonProps {
  onSuccess?: (response: any) => void;
  onError?: (error: any) => void;
  disabled?: boolean;
  size?: "small" | "medium" | "large";
  variant?: "filled_blue" | "outline" | "filled_black"; // outline = white background, pill-shaped
}

interface GoogleSignInConfig {
  clientId: string;
}

// Declare Google Identity Services types
declare global {
  interface Window {
    google: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          renderButton: (element: HTMLElement, config: any) => void;
          prompt: (promptMoment?: any) => void;
          disableAutoSelect: () => void;
          cancel: () => void;
        };
      };
    };
  }
}

export const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  onSuccess,
  onError,
  disabled = false,
  size = "large",
  variant = "outline",
}) => {
  const [config, setConfig] = useState<GoogleSignInConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const buttonRef = useRef<HTMLDivElement>(null);

  // Load Google Identity Services script
  useEffect(() => {
    const loadGoogleScript = () => {
      if (window.google) {
        setScriptLoaded(true);
        return;
      }

      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = () => setScriptLoaded(true);
      script.onerror = () => {
        console.error("Failed to load Google Identity Services");
        onError?.(new Error("Failed to load Google authentication"));
      };
      document.head.appendChild(script);
    };

    loadGoogleScript();
  }, [onError]);

  // Fetch Google Sign-In configuration from backend
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await fetch("/api/auth/google/signin-config");
        if (!response.ok) {
          throw new Error("Failed to fetch Google Sign-In configuration");
        }
        const data = await response.json();
        if (data.success && data.config) {
          setConfig(data.config);
        } else {
          throw new Error("Invalid configuration response");
        }
      } catch (err) {
        console.error("Failed to fetch Google Sign-In config:", err);
        onError?.(err);
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
  }, [onError]);

  // Initialize Google Sign-In when script and config are ready
  useEffect(() => {
    if (!scriptLoaded || !config || !buttonRef.current || disabled) return;

    const handleCredentialResponse = async (response: any) => {
      try {
        console.log("Google credential received:", response);
        // Always use the onSuccess callback to handle the credential
        if (onSuccess) {
          onSuccess(response);
        } else {
          console.warn("No onSuccess handler provided for Google sign-in");
        }
      } catch (error) {
        console.error("Authentication error:", error);
        onError?.(error);
      }
    };

    // Initialize Google Identity Services
    window.google.accounts.id.initialize({
      client_id: config.clientId,
      callback: handleCredentialResponse,
      auto_select: false,
      cancel_on_tap_outside: true,
    });

    // Render the authentic Google Sign-In button
    window.google.accounts.id.renderButton(buttonRef.current, {
      theme: "outline",
      size: size,
      type: "standard",
      shape: "pill",
      logo_alignment: "left",
      width: size === "large" ? 240 : 200,
      text: "signin_with",
    });

    return () => {
      // Cleanup - just in case
      try {
        window.google.accounts.id.cancel();
      } catch (error) {
        console.log("Error during cleanup:", error);
      }
    };
  }, [scriptLoaded, config, disabled, size, variant, onSuccess, onError]);

  // Show loading state
  if (loading || !scriptLoaded) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: 60,
        }}
      >
        <CircularProgress size={24} />
      </Box>
    );
  }

  // Render container for Google's authentic button
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: size === "small" ? 50 : size === "medium" ? 60 : 70,
        opacity: disabled ? 0.6 : 1,
        pointerEvents: disabled ? "none" : "auto",
        outline: "none !important",
        py: 1,
        "& > div": {
          transform: size === "large" ? "scale(1.1)" : "scale(1)",
          outline: "none !important",
          transition: "transform 0.2s ease-in-out",
          "&:hover": {
            transform: size === "large" ? "scale(1.12)" : "scale(1.02)",
          },
          "& *": {
            outline: "none !important",
          },
        },
      }}
    >
      <div ref={buttonRef} />
    </Box>
  );
};

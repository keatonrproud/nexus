import type {
  CreateProjectRequest,
  Project,
  UpdateProjectRequest,
} from "@/types";
import { HelpOutline } from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Link,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Stack,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import React, { useEffect, useRef, useState } from "react";

interface ProjectFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateProjectRequest | UpdateProjectRequest) => void;
  project?: Project;
  isLoading?: boolean;
  error?: string;
}

interface FormData {
  name: string;
  url: string;
  emoji: string;
  goatcounter_site_code: string;
  goatcounter_api_token: string;
}

interface FormErrors {
  name?: string;
  url?: string;
  emoji?: string;
  goatcounter_site_code?: string;
  goatcounter_api_token?: string;
}

export const ProjectForm: React.FC<ProjectFormProps> = ({
  open,
  onClose,
  onSubmit,
  project,
  isLoading = false,
  error,
}) => {
  const theme = useTheme();
  const nameInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    url: "",
    emoji: "",
    goatcounter_site_code: "",
    goatcounter_api_token: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [helpDialogOpen, setHelpDialogOpen] = useState(false);

  const isEditing = Boolean(project);

  // Reset form when dialog opens/closes or project changes
  useEffect(() => {
    if (open) {
      if (project) {
        setFormData({
          name: project.name,
          url: project.url,
          emoji: project.emoji || "",
          goatcounter_site_code: project.goatcounter_site_code || "",
          goatcounter_api_token: project.goatcounter_api_token || "",
        });
      } else {
        setFormData({
          name: "",
          url: "",
          emoji: "",
          goatcounter_site_code: "",
          goatcounter_api_token: "",
        });
      }
      setErrors({});
      setTouched({});

      // Focus the name input after a short delay to ensure dialog is fully rendered
      setTimeout(() => {
        nameInputRef.current?.focus();
      }, 100);
    }
  }, [open, project]);

  // URL validation function
  const isValidUrl = (url: string): boolean => {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === "http:" || urlObj.protocol === "https:";
    } catch {
      return false;
    }
  };

  // Emoji validation function
  const isValidEmoji = (text: string): boolean => {
    // Unicode ranges for emojis
    const emojiRegex =
      /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F900}-\u{1F9FF}]|[\u{1F018}-\u{1F270}]|[\u{238C}-\u{2454}]|[\u{20D0}-\u{20FF}]/u;

    if (!text.trim()) return false;

    // Check if the text contains emoji characters
    const hasEmoji = emojiRegex.test(text);

    // Also check if it's a short string (typical for emojis)
    const isShort = text.trim().length <= 10;

    return hasEmoji && isShort;
  };

  // Validate form fields
  const validateField = (
    name: keyof FormData,
    value: string,
  ): string | undefined => {
    switch (name) {
      case "name":
        if (!value.trim()) {
          return "Project name is required";
        }
        if (value.trim().length < 2) {
          return "Project name must be at least 2 characters";
        }
        if (value.trim().length > 100) {
          return "Project name must be less than 100 characters";
        }
        break;

      case "url":
        if (!value.trim()) {
          return "Project URL is required";
        }
        if (!isValidUrl(value.trim())) {
          return "Please enter a valid URL (including http:// or https://)";
        }
        break;

      case "emoji":
        if (!value.trim()) {
          return "Emoji is required";
        }
        if (!isValidEmoji(value.trim())) {
          return "Please enter a valid emoji";
        }
        if (value.trim().length > 10) {
          return "Emoji must be less than 10 characters";
        }
        break;

      case "goatcounter_site_code":
        if (value.trim() && value.trim().length > 255) {
          return "GoatCounter site code must be less than 255 characters";
        }
        break;

      case "goatcounter_api_token":
        if (value.trim() && value.trim().length > 500) {
          return "GoatCounter API token must be less than 500 characters";
        }
        break;
    }
    return undefined;
  };

  // Form validation
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = "Project name is required";
    } else if (formData.name.trim().length > 100) {
      newErrors.name = "Project name must be less than 100 characters";
    }

    // URL validation
    if (!formData.url.trim()) {
      newErrors.url = "Project URL is required";
    } else if (!isValidUrl(formData.url.trim())) {
      newErrors.url = "Please enter a valid URL";
    }

    // Emoji validation (now required)
    if (!formData.emoji.trim()) {
      newErrors.emoji = "Emoji is required";
    } else if (!isValidEmoji(formData.emoji.trim())) {
      newErrors.emoji = "Please enter a valid emoji";
    } else if (formData.emoji.trim().length > 10) {
      newErrors.emoji = "Emoji must be less than 10 characters";
    }

    // GoatCounter site code validation (optional)
    if (
      formData.goatcounter_site_code.trim() &&
      formData.goatcounter_site_code.trim().length > 255
    ) {
      newErrors.goatcounter_site_code =
        "GoatCounter site code must be less than 255 characters";
    }

    // GoatCounter API token validation (optional)
    if (
      formData.goatcounter_api_token.trim() &&
      formData.goatcounter_api_token.trim().length > 500
    ) {
      newErrors.goatcounter_api_token =
        "GoatCounter API token must be less than 500 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange =
    (field: keyof FormData) => (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      setFormData((prev) => ({ ...prev, [field]: value }));

      // Clear error when user starts typing
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: undefined }));
      }
    };

  const handleBlur = (field: keyof FormData) => () => {
    setTouched((prev) => ({ ...prev, [field]: true }));

    // Validate field on blur
    const error = validateField(field, formData[field]);
    setErrors((prev) => ({ ...prev, [field]: error }));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    // Mark all fields as touched
    setTouched({
      name: true,
      url: true,
      emoji: true,
      goatcounter_site_code: true,
      goatcounter_api_token: true,
    });

    if (!validateForm()) {
      return;
    }

    // Prepare submission data
    const submissionData = {
      name: formData.name.trim(),
      url: formData.url.trim(),
      emoji: formData.emoji.trim(),
      ...(formData.goatcounter_site_code.trim() && {
        goatcounter_site_code: formData.goatcounter_site_code.trim(),
      }),
      ...(formData.goatcounter_api_token.trim() && {
        goatcounter_api_token: formData.goatcounter_api_token.trim(),
      }),
    };

    onSubmit(submissionData);
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  const handleDialogClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const GoatCounterHelpDialog = () => (
    <Dialog
      open={helpDialogOpen}
      onClose={() => setHelpDialogOpen(false)}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          mx: { xs: 1, sm: 2 },
          width: { xs: "calc(100% - 16px)", sm: "100%" },
          maxWidth: { xs: "calc(100% - 16px)", sm: "700px" },
        },
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box display="flex" alignItems="center" gap={1}>
          <HelpOutline color="primary" />
          <Typography variant="h6" component="span">
            Setting up GoatCounter Analytics
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={3}>
          <Typography variant="body1" color="text.secondary">
            GoatCounter is a privacy-friendly web analytics platform. Follow
            these steps to set it up for your project:
          </Typography>

          <Box>
            <Typography
              variant="h6"
              gutterBottom
              sx={{ display: "flex", alignItems: "center", gap: 1 }}
            >
              Step 1: Create a GoatCounter Account
            </Typography>
            <List dense>
              <ListItem sx={{ pl: { xs: 1, sm: 4 } }}>
                <ListItemIcon sx={{ minWidth: 24 }}>
                  <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                    1.
                  </Typography>
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box>
                      Visit{" "}
                      <Link
                        href="https://www.goatcounter.com/signup"
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 0.5,
                        }}
                      >
                        goatcounter.com/signup
                      </Link>
                    </Box>
                  }
                />
              </ListItem>
              <ListItem sx={{ pl: { xs: 1, sm: 4 } }}>
                <ListItemIcon sx={{ minWidth: 24 }}>
                  <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                    2.
                  </Typography>
                </ListItemIcon>
                <ListItemText primary="Choose a site code for your project" />
              </ListItem>
              <ListItem sx={{ pl: { xs: 1, sm: 4 } }}>
                <ListItemIcon sx={{ minWidth: 24 }}>
                  <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                    3.
                  </Typography>
                </ListItemIcon>
                <ListItemText primary="Complete the signup process" />
              </ListItem>
            </List>
          </Box>

          <Box>
            <Typography
              variant="h6"
              gutterBottom
              sx={{ display: "flex", alignItems: "center", gap: 1 }}
            >
              Step 2: Get Your Site Code
            </Typography>
            <List dense>
              <ListItem sx={{ pl: { xs: 1, sm: 4 } }}>
                <ListItemIcon sx={{ minWidth: 24 }}>
                  <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                    1.
                  </Typography>
                </ListItemIcon>
                <ListItemText primary="Your site code is what you chose in the sign up process, and comes before '.goatcounter.com' in the dashboard URL" />
              </ListItem>
              <ListItem sx={{ pl: { xs: 1, sm: 4 } }}>
                <ListItemIcon sx={{ minWidth: 24 }}>
                  <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                    2.
                  </Typography>
                </ListItemIcon>
                <ListItemText primary="Add the site code to your project's configuration" />
              </ListItem>
            </List>
          </Box>

          <Box>
            <Typography
              variant="h6"
              gutterBottom
              sx={{ display: "flex", alignItems: "center", gap: 1 }}
            >
              Step 3: Get Your API Token
            </Typography>
            <List dense>
              <ListItem sx={{ pl: { xs: 1, sm: 4 } }}>
                <ListItemIcon sx={{ minWidth: 24 }}>
                  <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                    1.
                  </Typography>
                </ListItemIcon>
                <ListItemText primary="In the GoatCounter dashboard, go to User (in the header) → API" />
              </ListItem>
              <ListItem sx={{ pl: { xs: 1, sm: 4 } }}>
                <ListItemIcon sx={{ minWidth: 24 }}>
                  <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                    2.
                  </Typography>
                </ListItemIcon>
                <ListItemText primary="Create a new API token with 'Record Pageviews' and 'Read Statistics' permissions" />
              </ListItem>
              <ListItem sx={{ pl: { xs: 1, sm: 4 } }}>
                <ListItemIcon sx={{ minWidth: 24 }}>
                  <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                    3.
                  </Typography>
                </ListItemIcon>
                <ListItemText primary="Add the API token to your project's configuration" />
              </ListItem>
            </List>
          </Box>

          <Box sx={{ bgcolor: "grey.50", p: 2, borderRadius: 1 }}>
            <Typography
              variant="subtitle2"
              gutterBottom
              sx={{ fontWeight: "bold" }}
            >
              Why provide these details?
            </Typography>
            <Typography variant="body2" color="text.secondary">
              The site code and API token allow us to automatically show you
              your GoatCounter analytics directly in your Nexus dashboards.
            </Typography>
          </Box>

          <Box>
            <Typography
              variant="subtitle2"
              gutterBottom
              sx={{ fontWeight: "bold" }}
            >
              Need more help?
            </Typography>
            <Typography variant="body2">
              The{" "}
              <Link
                href="https://www.goatcounter.com/help"
                target="_blank"
                rel="noopener noreferrer"
                sx={{ display: "inline-flex", alignItems: "center", gap: 0.5 }}
              >
                GoatCounter documentation
              </Link>{" "}
              has more detailed setup instructions.
            </Typography>
          </Box>
        </Stack>
      </DialogContent>
    </Dialog>
  );

  return (
    <>
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            mx: { xs: 1, sm: 2 },
            width: { xs: "calc(100% - 16px)", sm: "100%" },
            maxWidth: { xs: "calc(100% - 16px)", sm: "600px" },
          },
        }}
        onClick={handleDialogClick}
      >
        <form onSubmit={handleSubmit} onClick={handleDialogClick}>
          <DialogContent
            sx={{
              pt: { xs: 2, sm: 3 },
              pb: { xs: 1, sm: 2 },
              px: { xs: 2, sm: 3 },
            }}
          >
            <Stack spacing={3}>
              {error && (
                <Alert
                  severity="error"
                  sx={{
                    background: "rgba(255, 255, 255, 0.9)",
                    backdropFilter: "blur(10px)",
                  }}
                >
                  {error}
                </Alert>
              )}

              <TextField
                ref={nameInputRef}
                label="Name"
                value={formData.name}
                onChange={handleInputChange("name")}
                onBlur={handleBlur("name")}
                error={touched.name && Boolean(errors.name)}
                helperText={touched.name && errors.name}
                fullWidth
                required
                disabled={isLoading}
                placeholder="Enter a short name for your project"
              />

              <TextField
                label="URL"
                value={formData.url}
                onChange={handleInputChange("url")}
                onBlur={handleBlur("url")}
                error={touched.url && Boolean(errors.url)}
                helperText={touched.url && errors.url}
                fullWidth
                required
                disabled={isLoading}
                placeholder="https://example.com"
              />

              <TextField
                label="Emoji"
                value={formData.emoji}
                onChange={handleInputChange("emoji")}
                onBlur={handleBlur("emoji")}
                error={touched.emoji && Boolean(errors.emoji)}
                helperText={
                  touched.emoji && errors.emoji
                    ? errors.emoji
                    : "Enter an emoji to represent your project"
                }
                fullWidth
                required
                disabled={isLoading}
                placeholder="🚀"
              />

              <TextField
                label="GoatCounter Site Code (Optional)"
                value={formData.goatcounter_site_code}
                onChange={handleInputChange("goatcounter_site_code")}
                onBlur={handleBlur("goatcounter_site_code")}
                error={
                  touched.goatcounter_site_code &&
                  Boolean(errors.goatcounter_site_code)
                }
                helperText={
                  touched.goatcounter_site_code && errors.goatcounter_site_code
                    ? errors.goatcounter_site_code
                    : 'Optional: Site code for GoatCounter analytics (e.g., "mysite" for mysite.goatcounter.com)'
                }
                fullWidth
                disabled={isLoading}
                placeholder="Enter GoatCounter site code for analytics"
              />

              <TextField
                label="GoatCounter API Token (Optional)"
                value={formData.goatcounter_api_token}
                onChange={handleInputChange("goatcounter_api_token")}
                onBlur={handleBlur("goatcounter_api_token")}
                error={
                  touched.goatcounter_api_token &&
                  Boolean(errors.goatcounter_api_token)
                }
                helperText={
                  touched.goatcounter_api_token && errors.goatcounter_api_token
                    ? errors.goatcounter_api_token
                    : "Optional: API token for GoatCounter analytics (get from Settings → API in your GoatCounter dashboard)"
                }
                fullWidth
                disabled={isLoading}
                placeholder="Enter GoatCounter API token"
              />
            </Stack>
          </DialogContent>

          <DialogActions
            sx={{
              px: { xs: 2, sm: 3 },
              pb: { xs: 2, sm: 3 },
              pt: 1,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Button
              onClick={() => setHelpDialogOpen(true)}
              startIcon={<HelpOutline />}
              variant="text"
              size="small"
              sx={{
                textTransform: "none",
                color: theme.palette.grey[500],
                "&:hover": {
                  backgroundColor: "transparent",
                  color: theme.palette.grey[800],
                  boxShadow: "none",
                },
              }}
            >
              Help with GoatCounter
            </Button>

            <Button
              type="submit"
              variant="contained"
              loading={isLoading}
              sx={{
                minWidth: 120,
                border: 1,
                color: "black",
                borderColor: theme.palette.grey[200],
                textTransform: "none",
                fontWeight: 600,
                boxShadow: "none",
                "&:hover": {
                  boxShadow: "none",
                  borderColor: theme.palette.primary.main,
                  backgroundColor: `${theme.palette.primary.main}15`,
                  borderWidth: 1,
                  color: "black",
                },
              }}
            >
              {isEditing ? "Update Project" : "Create Project"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <GoatCounterHelpDialog />
    </>
  );
};

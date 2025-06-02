import { Avatar, type AvatarProps } from "@mui/material";
import { useEffect, useState } from "react";

interface UserAvatarProps extends Omit<AvatarProps, "src" | "children"> {
  user: {
    name?: string;
    email?: string;
    profile_picture_url?: string;
  };
  size?: number;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  user,
  size = 40,
  sx,
  ...props
}) => {
  const [imageError, setImageError] = useState(false);

  const handleImageError = () => {
    setImageError(true);
  };

  // Reset image error when user changes
  useEffect(() => {
    setImageError(false);
  }, [user]);

  // Get user initials for fallback
  const getUserInitials = () => {
    if (user?.name) {
      const names = user.name.split(" ");
      if (names.length >= 2) {
        return `${names[0].charAt(0)}${names[names.length - 1].charAt(0)}`.toUpperCase();
      }
      return user.name.charAt(0).toUpperCase();
    }
    return user?.email?.charAt(0).toUpperCase() || "?";
  };

  return (
    <Avatar
      alt={user.name || user.email || "User"}
      src={
        !imageError && user.profile_picture_url
          ? user.profile_picture_url
          : undefined
      }
      onError={handleImageError}
      sx={{
        width: size,
        height: size,
        fontSize: size * 0.4, // Scale font size with avatar size
        ...sx,
      }}
      {...props}
    >
      {getUserInitials()}
    </Avatar>
  );
};

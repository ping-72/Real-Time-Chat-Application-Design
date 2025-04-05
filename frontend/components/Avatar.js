// components/Avatar.js
import { useState } from "react";

export default function Avatar({
  src,
  alt = "User",
  size = "md",
  status,
  className = "",
  onClick,
}) {
  const [error, setError] = useState(false);

  // Handle image load error
  const handleError = () => {
    setError(true);
  };

  // Get initials from name (up to 2 characters)
  const getInitials = () => {
    if (!alt || typeof alt !== "string") return "?";

    const names = alt.split(" ").filter(Boolean);
    if (names.length === 0) return "?";

    if (names.length === 1) {
      return names[0].charAt(0).toUpperCase();
    }

    return (
      names[0].charAt(0) + names[names.length - 1].charAt(0)
    ).toUpperCase();
  };

  // Get avatar container size
  const getSize = () => {
    switch (size) {
      case "xs":
        return "w-6 h-6 text-xs";
      case "sm":
        return "w-8 h-8 text-sm";
      case "md":
        return "w-10 h-10 text-base";
      case "lg":
        return "w-12 h-12 text-lg";
      case "xl":
        return "w-16 h-16 text-xl";
      case "2xl":
        return "w-20 h-20 text-2xl";
      default:
        return "w-10 h-10 text-base";
    }
  };

  // Get status indicator size
  const getStatusSize = () => {
    switch (size) {
      case "xs":
      case "sm":
        return "w-2.5 h-2.5";
      case "md":
        return "w-3 h-3";
      case "lg":
      case "xl":
        return "w-3.5 h-3.5";
      case "2xl":
        return "w-4 h-4";
      default:
        return "w-3 h-3";
    }
  };

  // Get status color
  const getStatusColor = () => {
    if (!status) return "";

    switch (status.toLowerCase()) {
      case "available":
      case "online":
        return "bg-green-500";
      case "busy":
      case "do not disturb":
        return "bg-red-500";
      case "away":
        return "bg-yellow-500";
      case "offline":
        return "bg-gray-400 dark:bg-gray-600";
      default:
        return "bg-gray-400 dark:bg-gray-600";
    }
  };

  // Get random background color based on initials
  const getRandomColor = () => {
    const colors = [
      "bg-blue-500",
      "bg-green-500",
      "bg-purple-500",
      "bg-yellow-500",
      "bg-pink-500",
      "bg-indigo-500",
      "bg-red-500",
      "bg-teal-500",
    ];

    // Use the initials to determine a consistent color
    const initials = getInitials();
    const charCodeSum = initials
      .split("")
      .reduce((sum, char) => sum + char.charCodeAt(0), 0);
    const colorIndex = charCodeSum % colors.length;

    return colors[colorIndex];
  };

  return (
    <div
      className={`relative inline-flex rounded-full ${getSize()} ${className}`}
      onClick={onClick}
    >
      {/* Avatar image or fallback */}
      {src && !error ? (
        <img
          src={src}
          alt={alt}
          onError={handleError}
          className="rounded-full w-full h-full object-cover"
        />
      ) : (
        <div
          className={`flex items-center justify-center w-full h-full rounded-full text-white ${getRandomColor()}`}
        >
          {getInitials()}
        </div>
      )}

      {/* Status indicator */}
      {status && (
        <span
          className={`absolute bottom-0 right-0 block rounded-full ring-2 ring-white dark:ring-gray-800 ${getStatusSize()} ${getStatusColor()}`}
        ></span>
      )}
    </div>
  );
}

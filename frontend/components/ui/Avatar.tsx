"use client";

type AvatarProps = {
  className?: string;
  name: string;
};

const palette = [
  "avatar-palette-teal",
  "avatar-palette-blue",
  "avatar-palette-amber",
  "avatar-palette-rose",
];

const getInitials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

const getPalette = (name: string) => {
  const total = Array.from(name).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return palette[total % palette.length];
};

export default function Avatar({ className = "", name }: AvatarProps) {
  const paletteClassName = getPalette(name);

  return (
    <span
      className={`${paletteClassName} text-contrast flex items-center justify-center rounded-full font-semibold ${className}`}
      aria-hidden="true"
    >
      {getInitials(name) || "U"}
    </span>
  );
}

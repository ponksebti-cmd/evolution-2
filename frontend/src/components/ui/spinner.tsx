import React from "react";

interface SpinnerProps {
  size?: number;
  className?: string;
}

export default function Spinner({ size = 36, className = "" }: SpinnerProps) {
  const stroke = Math.max(2, Math.floor(size / 10));
  return (
    <div
      className={`inline-block ${className}`}
      style={{ width: size, height: size }}
      role="status"
      aria-label="Loading"
    >
      <svg
        className="animate-spin"
        viewBox="0 0 50 50"
        style={{ width: size, height: size }}
      >
        <circle
          cx="25"
          cy="25"
          r="20"
          fill="none"
          stroke="#000"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeOpacity={0.15}
        />
        <path
          d="M25 5 a 20 20 0 0 1 0 40"
          fill="none"
          stroke="#000"
          strokeWidth={stroke}
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

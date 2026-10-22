import React from "react";
export function Icon({ name }) {
  const paths = {
    music: (
      <>
        <path d="M9 18V5l11-2v13M9 8l11-2" />
        <ellipse cx="6" cy="18" rx="3" ry="2" />
        <ellipse cx="17" cy="16" rx="3" ry="2" />
      </>
    ),
    play: <path d="M8 4l13 8-13 8Z" />,
    home: (
      <>
        <path d="M3 11l9-8 9 8M6 9v12h12V9" />
      </>
    ),
    help: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M9.5 9a2.5 2.5 0 0 1 5 0c0 2-2.5 2-2.5 4M12 16v.5" />
      </>
    ),
    settings: (
      <>
        <path d="M9 4V2h6v2l3 2 2 1-3 5 3 5-2 1-3 2v2H9v-2l-3-2-2-1 3-5-3-5 2-1Z" />
        <circle cx="12" cy="12" r="3" />
      </>
    ),
    sound: (
      <>
        <path d="M3 9h4l5-4v14l-5-4H3ZM16 8c3 2 3 6 0 8M19 5c5 4 5 10 0 14" />
      </>
    ),
    mute: (
      <>
        <path d="M3 9h4l5-4v14l-5-4H3ZM17 9l5 6M22 9l-5 6" />
      </>
    ),
  };
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}

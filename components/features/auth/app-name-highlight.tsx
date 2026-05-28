type Props = {
  children: string;
};

export function AppNameHighlight({ children }: Props) {
  return (
    <span className="relative inline-block pb-1">
      {children}
      <svg
        className="pointer-events-none absolute bottom-0 left-[-3%] h-[7px] w-[106%] text-pink md:h-2"
        viewBox="0 0 200 14"
        preserveAspectRatio="none"
        aria-hidden
      >
        <path
          d="M2 11 C 55 7, 105 10, 145 8 C 170 7, 188 9, 198 8 L 198 14 L 2 14 Z"
          fill="currentColor"
        />
      </svg>
    </span>
  );
}

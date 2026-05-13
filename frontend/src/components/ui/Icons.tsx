import type { ReactElement, SVGProps } from 'react';

export type IconName =
  | 'alert'
  | 'arrowRight'
  | 'bookings'
  | 'building'
  | 'calendar'
  | 'check'
  | 'chevronDown'
  | 'clock'
  | 'close'
  | 'dashboard'
  | 'desk'
  | 'floor'
  | 'grid'
  | 'logout'
  | 'map'
  | 'menu'
  | 'plus'
  | 'shield'
  | 'spark'
  | 'trash'
  | 'users';

interface IconProps extends SVGProps<SVGSVGElement> {
  name: IconName;
}

const paths: Record<IconName, ReactElement> = {
  alert: (
    <>
      <path d="M12 8v5" />
      <path d="M12 17h.01" />
      <path d="M10.3 3.9 2.6 17.2A2 2 0 0 0 4.3 20h15.4a2 2 0 0 0 1.7-2.8L13.7 3.9a2 2 0 0 0-3.4 0Z" />
    </>
  ),
  arrowRight: (
    <>
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </>
  ),
  bookings: (
    <>
      <path d="M7 3v3" />
      <path d="M17 3v3" />
      <path d="M4.5 8.5h15" />
      <path d="M6 5h12a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" />
      <path d="m8 14 2.2 2.1L16 10.8" />
    </>
  ),
  building: (
    <>
      <path d="M4 21V5.8A1.8 1.8 0 0 1 5.8 4h8.4A1.8 1.8 0 0 1 16 5.8V21" />
      <path d="M16 9h2.2A1.8 1.8 0 0 1 20 10.8V21" />
      <path d="M8 8h4" />
      <path d="M8 12h4" />
      <path d="M8 16h4" />
      <path d="M2.5 21h19" />
    </>
  ),
  calendar: (
    <>
      <path d="M7 3v3" />
      <path d="M17 3v3" />
      <path d="M4.5 8.5h15" />
      <path d="M6 5h12a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" />
    </>
  ),
  check: (
    <>
      <path d="m5 12 4.2 4L19 6.8" />
    </>
  ),
  chevronDown: (
    <>
      <path d="m6 9 6 6 6-6" />
    </>
  ),
  clock: (
    <>
      <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z" />
      <path d="M12 7.5v5l3.2 1.8" />
    </>
  ),
  close: (
    <>
      <path d="M6 6l12 12" />
      <path d="M18 6 6 18" />
    </>
  ),
  dashboard: (
    <>
      <path d="M4 13.5V18a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4.5" />
      <path d="M5 12a7 7 0 0 1 14 0" />
      <path d="m12 12 3.5-3.5" />
      <path d="M8 12h.01" />
      <path d="M16 12h.01" />
    </>
  ),
  desk: (
    <>
      <path d="M4 9h16" />
      <path d="M6 9v10" />
      <path d="M18 9v10" />
      <path d="M8 19h8" />
      <path d="M7 5h10a2 2 0 0 1 2 2v2H5V7a2 2 0 0 1 2-2Z" />
    </>
  ),
  floor: (
    <>
      <path d="M4 6.5 12 3l8 3.5-8 3.5-8-3.5Z" />
      <path d="m4 12 8 3.5 8-3.5" />
      <path d="m4 17.5 8 3.5 8-3.5" />
    </>
  ),
  grid: (
    <>
      <path d="M4 4h6v6H4z" />
      <path d="M14 4h6v6h-6z" />
      <path d="M4 14h6v6H4z" />
      <path d="M14 14h6v6h-6z" />
    </>
  ),
  logout: (
    <>
      <path d="M10 6H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h4" />
      <path d="M14 16l4-4-4-4" />
      <path d="M18 12H9" />
    </>
  ),
  map: (
    <>
      <path d="m8 18-4 2V6l4-2 8 2 4-2v14l-4 2-8-2Z" />
      <path d="M8 4v14" />
      <path d="M16 6v14" />
    </>
  ),
  menu: (
    <>
      <path d="M4 7h16" />
      <path d="M4 12h16" />
      <path d="M4 17h16" />
    </>
  ),
  plus: (
    <>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3 5 6v5.4c0 4.5 2.9 7.4 7 9.1 4.1-1.7 7-4.6 7-9.1V6l-7-3Z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  spark: (
    <>
      <path d="M12 3l1.5 5.2L19 10l-5.5 1.8L12 17l-1.5-5.2L5 10l5.5-1.8L12 3Z" />
      <path d="M19 15l.7 2.3L22 18l-2.3.7L19 21l-.7-2.3L16 18l2.3-.7L19 15Z" />
    </>
  ),
  trash: (
    <>
      <path d="M4 7h16" />
      <path d="M9 7V5.4A1.4 1.4 0 0 1 10.4 4h3.2A1.4 1.4 0 0 1 15 5.4V7" />
      <path d="m7 7 .8 13h8.4L17 7" />
      <path d="M10 11v5" />
      <path d="M14 11v5" />
    </>
  ),
  users: (
    <>
      <path d="M16 20v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 18.5V20" />
      <path d="M10 12a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" />
      <path d="M20 20v-1.3a3 3 0 0 0-2.5-3" />
      <path d="M16 5.2a3 3 0 0 1 0 5.6" />
    </>
  ),
};

export function Icon({ name, className = 'h-4 w-4', ...props }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.85}
      viewBox="0 0 24 24"
      {...props}
    >
      {paths[name]}
    </svg>
  );
}

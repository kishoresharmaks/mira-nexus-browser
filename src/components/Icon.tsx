import type { ReactNode } from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

export type IconName =
  | 'chevronLeft'
  | 'chevronRight'
  | 'chevronDown'
  | 'arrowRight'
  | 'arrowUpRight'
  | 'refresh'
  | 'close'
  | 'more'
  | 'lock'
  | 'unlock'
  | 'globe'
  | 'search'
  | 'home'
  | 'clock'
  | 'trash'
  | 'shield'
  | 'mask'
  | 'moon'
  | 'sun'
  | 'copy'
  | 'share'
  | 'external'
  | 'pin'
  | 'pinFilled'
  | 'check'
  | 'plus'
  | 'wifiOff'
  | 'tabs'
  | 'trail'
  | 'sparkle'
  | 'edit'
  | 'archive'
  | 'message'
  | 'settings'
  | 'book'
  | 'volume'
  | 'play'
  | 'pause'
  | 'mic'
  | 'qr'
  | 'bookmark'
  | 'folder'
  | 'download'
  | 'note'
  | 'grid'
  | 'image'
  | 'newspaper'
  | 'video'
  | 'compass'
  | 'calculator'
  | 'timer'
  | 'clipboard'
  | 'code'
  | 'fileText';

function content(name: IconName, color: string): ReactNode {
  switch (name) {
    case 'chevronLeft':
      return <Path d="m15 18-6-6 6-6" />;
    case 'chevronRight':
      return <Path d="m9 18 6-6-6-6" />;
    case 'chevronDown':
      return <Path d="m6 9 6 6 6-6" />;
    case 'arrowRight':
      return (
        <>
          <Path d="M4 12h15" />
          <Path d="m13 6 6 6-6 6" />
        </>
      );
    case 'arrowUpRight':
      return (
        <>
          <Path d="M7 17 17 7" />
          <Path d="M8 7h9v9" />
        </>
      );
    case 'refresh':
      return (
        <>
          <Path d="M20 11.5a8.5 8.5 0 1 0-2.5 6" />
          <Path d="M20 4.5v7h-7" />
        </>
      );
    case 'close':
      return (
        <>
          <Path d="m6 6 12 12" />
          <Path d="M18 6 6 18" />
        </>
      );
    case 'more':
      return (
        <>
          <Circle cx="5" cy="12" r="1.6" fill={color} stroke="none" />
          <Circle cx="12" cy="12" r="1.6" fill={color} stroke="none" />
          <Circle cx="19" cy="12" r="1.6" fill={color} stroke="none" />
        </>
      );
    case 'lock':
      return (
        <>
          <Rect x="4.5" y="10" width="15" height="10.5" rx="3" />
          <Path d="M8 10V7.8a4 4 0 0 1 8 0V10" />
          <Circle cx="12" cy="15.2" r="1.1" fill={color} stroke="none" />
        </>
      );
    case 'unlock':
      return (
        <>
          <Rect x="4.5" y="10" width="15" height="10.5" rx="3" />
          <Path d="M8 10V7.8a4 4 0 0 1 7.5-2" />
          <Circle cx="12" cy="15.2" r="1.1" fill={color} stroke="none" />
        </>
      );
    case 'globe':
      return (
        <>
          <Circle cx="12" cy="12" r="8.5" />
          <Path d="M3.5 12h17" />
          <Path d="M12 3.5c2.3 2.3 3.5 5.2 3.5 8.5s-1.2 6.2-3.5 8.5c-2.3-2.3-3.5-5.2-3.5-8.5S9.7 5.8 12 3.5Z" />
        </>
      );
    case 'search':
      return (
        <>
          <Circle cx="10.8" cy="10.8" r="6.8" />
          <Path d="m16 16 4.2 4.2" />
        </>
      );
    case 'home':
      return (
        <>
          <Path d="M3.5 10.2 12 3.5l8.5 6.7" />
          <Path d="M5.5 9.2V19a1.5 1.5 0 0 0 1.5 1.5h10a1.5 1.5 0 0 0 1.5-1.5V9.2" />
          <Path d="M9.5 20.5v-5h5v5" />
        </>
      );
    case 'clock':
      return (
        <>
          <Circle cx="12" cy="12" r="8.5" />
          <Path d="M12 7.5V12l3 1.8" />
        </>
      );
    case 'trash':
      return (
        <>
          <Path d="M4 7h16" />
          <Path d="M9 7V4.5h6V7" />
          <Path d="M6.5 7l.8 12a2 2 0 0 0 2 1.9h5.4a2 2 0 0 0 2-1.9L17.5 7" />
          <Path d="M10 11v5.5" />
          <Path d="M14 11v5.5" />
        </>
      );
    case 'shield':
      return (
        <>
          <Path d="M12 3.2 4.8 6v5.4c0 4.3 3 7.7 7.2 9.2 4.2-1.5 7.2-4.9 7.2-9.2V6L12 3.2Z" />
          <Path d="m9 12 2 2 4-4" />
        </>
      );
    case 'mask':
      return (
        <>
          <Path d="M3.6 9.8a2.5 2.5 0 0 1 2.5-2.5h11.8a2.5 2.5 0 0 1 2.5 2.5v.3a4.3 4.3 0 0 1-3.2 4.2l-2.2.6a2.8 2.8 0 0 1-1.4-.1l-1.2-.4a1.6 1.6 0 0 0-1 0l-1.2.4a2.8 2.8 0 0 1-1.4.1l-2.2-.6a4.3 4.3 0 0 1-3.2-4.2v-.3Z" />
          <Circle cx="8.9" cy="10.6" r="0.95" fill={color} stroke="none" />
          <Circle cx="15.1" cy="10.6" r="0.95" fill={color} stroke="none" />
        </>
      );
    case 'moon':
      return <Path d="M20 14.2A8.5 8.5 0 0 1 9.8 4a8.5 8.5 0 1 0 10.2 10.2Z" />;
    case 'sun':
      return (
        <>
          <Circle cx="12" cy="12" r="4" />
          <Path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M18.7 5.3l-1.4 1.4M6.7 17.3l-1.4 1.4" />
        </>
      );
    case 'copy':
      return (
        <>
          <Rect x="8.5" y="8.5" width="11" height="11" rx="2.5" />
          <Path d="M15.5 5.5a2 2 0 0 0-2-2h-7a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2" />
        </>
      );
    case 'share':
      return (
        <>
          <Path d="M12 15V3" />
          <Path d="m8 7 4-4 4 4" />
          <Path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" />
        </>
      );
    case 'external':
      return (
        <>
          <Path d="M13 5h6v6" />
          <Path d="M19 5 10 14" />
          <Path d="M17 13v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h5" />
        </>
      );
    case 'pin':
      return (
        <Path d="M6.5 4.8A1.8 1.8 0 0 1 8.3 3h7.4a1.8 1.8 0 0 1 1.8 1.8V21l-5.5-3.8L6.5 21V4.8Z" />
      );
    case 'pinFilled':
      return (
        <Path
          d="M6.5 4.8A1.8 1.8 0 0 1 8.3 3h7.4a1.8 1.8 0 0 1 1.8 1.8V21l-5.5-3.8L6.5 21V4.8Z"
          fill={color}
        />
      );
    case 'check':
      return <Path d="m4.5 12.5 5 5 10-11" />;
    case 'plus':
      return (
        <>
          <Path d="M12 5v14" />
          <Path d="M5 12h14" />
        </>
      );
    case 'wifiOff':
      return (
        <>
          <Path d="m3 3 18 18" />
          <Path d="M8.5 15.6a5 5 0 0 1 7 0" />
          <Path d="M5 12a10 10 0 0 1 3.3-2.2" />
          <Path d="M15.7 9.8A10 10 0 0 1 19 12" />
          <Path d="M2.5 8.5A15 15 0 0 1 6.8 6.2" />
          <Path d="M17.2 6.2a15 15 0 0 1 4.3 2.3" />
          <Circle cx="12" cy="19" r="0.9" fill={color} stroke="none" />
        </>
      );
    case 'tabs':
      return (
        <>
          <Rect x="8.5" y="3.5" width="12" height="13.5" rx="3" />
          <Rect x="3.5" y="7" width="12" height="13.5" rx="3" />
        </>
      );
    case 'trail':
      return (
        <>
          <Path d="M4.5 18.5c4.2 0 3.1-6 7.5-6s3.3-6 7.5-8" />
          <Circle cx="4.5" cy="18.5" r="1.6" fill={color} stroke="none" />
          <Circle cx="12" cy="12.5" r="1.6" fill={color} stroke="none" />
          <Circle cx="19.5" cy="4.5" r="1.6" fill={color} stroke="none" />
        </>
      );
    case 'sparkle':
      return (
        <>
          <Path d="M12 3.5c.6 4.7 3.8 7.9 8.5 8.5-4.7.6-7.9 3.8-8.5 8.5-.6-4.7-3.8-7.9-8.5-8.5 4.7-.6 7.9-3.8 8.5-8.5Z" />
          <Path d="M18.5 17.2c.2 1.4 1.1 2.3 2.5 2.5-1.4.2-2.3 1.1-2.5 2.5-.2-1.4-1.1-2.3-2.5-2.5 1.4-.2 2.3-1.1 2.5-2.5Z" />
        </>
      );
    case 'edit':
      return (
        <>
          <Path d="M4 20h4L18.5 9.5a2.1 2.1 0 0 0-3-3L5 17v3Z" />
          <Path d="m13.5 6.5 3 3" />
        </>
      );
    case 'archive':
      return (
        <>
          <Rect x="3.5" y="4.5" width="17" height="5" rx="1.5" />
          <Path d="M5 9.5V19a1.5 1.5 0 0 0 1.5 1.5h11A1.5 1.5 0 0 0 19 19V9.5" />
          <Path d="M10 13.5h4" />
        </>
      );
    case 'message':
      return (
        <Path d="M20.5 11.8c0 3.9-3.8 7-8.5 7-1 0-2-.14-2.9-.4L4.5 20l1.3-3.5c-1.4-1.2-2.3-2.9-2.3-4.7 0-3.9 3.8-7 8.5-7s8.5 3.1 8.5 7Z" />
      );
    case 'settings':
      return (
        <>
          <Path d="M4 7h9.5" />
          <Circle cx="17" cy="7" r="2.2" />
          <Path d="M20 17h-9.5" />
          <Circle cx="7" cy="17" r="2.2" />
        </>
      );
    case 'book':
      return (
        <>
          <Path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
          <Path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
        </>
      );
    case 'volume':
      return (
        <>
          <Path d="M11 5 6 9H2v6h4l5 4V5Z" />
          <Path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
          <Path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
        </>
      );
    case 'play':
      return <Path d="m6 4 14 8-14 8V4Z" fill={color} />;
    case 'pause':
      return (
        <>
          <Rect x="6" y="4" width="4" height="16" rx="1" fill={color} />
          <Rect x="14" y="4" width="4" height="16" rx="1" fill={color} />
        </>
      );
    case 'mic':
      return (
        <>
          <Path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
          <Path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <Path d="M12 19v3" />
        </>
      );
    case 'qr':
      return (
        <>
          <Rect width="5" height="5" x="3" y="3" rx="1" />
          <Rect width="5" height="5" x="16" y="3" rx="1" />
          <Rect width="5" height="5" x="3" y="16" rx="1" />
          <Path d="M21 16h-3a2 2 0 0 0-2 2v3" />
          <Path d="M21 21v.01" />
          <Path d="M12 7v3a2 2 0 0 1-2 2H7" />
          <Path d="M12 12v6" />
        </>
      );
    case 'bookmark':
      return <Path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />;
    case 'folder':
      return (
        <Path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
      );
    case 'download':
      return (
        <>
          <Path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <Path d="m7 10 5 5 5-5" />
          <Path d="M12 15V3" />
        </>
      );
    case 'note':
      return (
        <>
          <Path d="M16 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <Path d="M14 2v6h6" />
          <Path d="M8 13h8" />
          <Path d="M8 17h6" />
        </>
      );
    case 'grid':
      return (
        <>
          <Rect width="7" height="7" x="3" y="3" rx="1.5" />
          <Rect width="7" height="7" x="14" y="3" rx="1.5" />
          <Rect width="7" height="7" x="14" y="14" rx="1.5" />
          <Rect width="7" height="7" x="3" y="14" rx="1.5" />
        </>
      );
    case 'image':
      return (
        <>
          <Rect width="18" height="18" x="3" y="3" rx="2" />
          <Circle cx="9" cy="9" r="2" />
          <Path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
        </>
      );
    case 'newspaper':
      return (
        <>
          <Path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
          <Path d="M18 14h-8" />
          <Path d="M15 18h-5" />
        </>
      );
    case 'video':
      return (
        <>
          <Path d="m22 8-6 4 6 4V8Z" />
          <Rect width="14" height="12" x="2" y="6" rx="2" />
        </>
      );
    case 'compass':
      return (
        <>
          <Circle cx="12" cy="12" r="10" />
          <Path d="m16.24 7.76-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z" />
        </>
      );
    case 'calculator':
      return (
        <>
          <Rect width="16" height="20" x="4" y="2" rx="2" />
          <Path d="M8 6h8" />
          <Path d="M16 14v4" />
          <Path d="M16 10h.01" />
          <Path d="M12 10h.01" />
          <Path d="M8 10h.01" />
          <Path d="M12 14h.01" />
          <Path d="M8 14h.01" />
          <Path d="M12 18h.01" />
          <Path d="M8 18h.01" />
        </>
      );
    case 'timer':
      return (
        <>
          <Circle cx="12" cy="14" r="8" />
          <Path d="M12 2v4" />
          <Path d="M12 14l3-3" />
        </>
      );
    case 'clipboard':
      return (
        <>
          <Rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
          <Path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
        </>
      );
    case 'code':
      return (
        <>
          <Path d="m16 18 6-6-6-6" />
          <Path d="m8 6-6 6 6 6" />
        </>
      );
    case 'fileText':
      return (
        <>
          <Path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
          <Path d="M14 2v4a2 2 0 0 0 2 2h4" />
          <Path d="M10 9H8" />
          <Path d="M16 13H8" />
          <Path d="M16 17H8" />
        </>
      );
    default:
      return null;
  }
}

export function Icon({
  name,
  size = 22,
  color = '#191610',
  strokeWidth = 1.8,
}: {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
}) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {content(name, color)}
    </Svg>
  );
}

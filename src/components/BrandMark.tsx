import Svg, { Circle } from 'react-native-svg';

export function BrandMark({
  size = 24,
  color = '#191610',
  accent = '#FF5A2B',
  strokeWidth = 1.7,
}: {
  size?: number;
  color?: string;
  accent?: string;
  strokeWidth?: number;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle
        cx="12"
        cy="12"
        r="8.4"
        stroke={color}
        strokeWidth={strokeWidth}
      />
      <Circle cx="17.94" cy="6.06" r="2.2" fill={accent} />
    </Svg>
  );
}

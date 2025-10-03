import Svg, { G, Path, Polygon } from 'react-native-svg';

export default function LogoIcon({ size = 64 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" role="img" accessibilityRole="image">
      <Polygon points="50,6 86,27 86,73 50,94 14,73 14,27" fill="#00B894" />
      <G stroke="#FFFFFF" strokeWidth={7} strokeLinecap="round" strokeLinejoin="round">
        <Path d="M38 30 L38 70" />
        <Path d="M38 50 L64 30" />
        <Path d="M38 50 L64 70" />
      </G>
    </Svg>
  );
}

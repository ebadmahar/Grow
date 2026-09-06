import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { Colors } from '../../theme';

interface GrovMarkProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export const GrovMark: React.FC<GrovMarkProps> = ({
  size = 24,
  color = Colors.lime,
  strokeWidth = 2,
}) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 21V13"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <Path
        d="M12 17C12 17 7 15 6.5 10C6.5 10 9.5 8.5 12 17Z"
        fill={color}
      />
      <Path
        d="M12 13C12 13 17 11 17.5 6C17.5 6 14.5 4.5 12 13Z"
        fill={color}
        opacity={0.55}
      />
    </Svg>
  );
};

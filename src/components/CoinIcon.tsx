import { FontAwesome5 } from '@expo/vector-icons';
import React from 'react';
import { StyleProp, TextStyle } from 'react-native';

interface CoinIconProps {
  size?: number;
  color?: string;
  style?: StyleProp<TextStyle>;
}

/**
 * Universal CoinIcon component representing app coins currency.
 */
export default function CoinIcon({
  size = 14,
  color = '#FFD700',
  style,
}: CoinIconProps) {
  return <FontAwesome5 name="coins" size={size} color={color} style={style} />;
}

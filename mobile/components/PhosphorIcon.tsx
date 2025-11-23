import { FunctionComponent } from 'react';
import * as Icon from '@expo/vector-icons/Phosphor';
import { Text } from 'react-native';

type IconName = keyof typeof Icon;

interface Props {
  name: IconName;
  size?: number;
  color?: string;
}

export const PhosphorIcon: FunctionComponent<Props> = ({ name, size = 20, color = '#fff' }) => {
  const Component = Icon[name] as any;
  if (!Component) return <Text style={{ color }}>•</Text>;
  return <Component name={name as any} size={size} color={color} />;
};

import { Image } from 'expo-image';

const logoSource = require('../../../../assets/images/logo-syak.png');

type Props = { width: number; height: number };

export function SyakLogo({ width, height }: Props) {
  return <Image source={logoSource} style={{ width, height }} contentFit="contain" />;
}

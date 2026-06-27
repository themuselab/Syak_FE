import { useLocalSearchParams } from 'expo-router';

import { ShopDetailScreen } from '@/screens/shop-detail/ShopDetailScreen';

export default function ShopDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ShopDetailScreen shopId={id} />;
}

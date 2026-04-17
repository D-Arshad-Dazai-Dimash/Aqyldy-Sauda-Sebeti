import { useSafeAreaInsets } from 'react-native-safe-area-context';

const HEADER_SAFE_GAP = 12;
const CONTENT_GAP_FROM_HEADER = 42;

export function useHeaderLayout() {
  const insets = useSafeAreaInsets();
  const topPadding = insets.top + HEADER_SAFE_GAP;
  const contentTopOffset = topPadding + CONTENT_GAP_FROM_HEADER;

  return {
    topPadding,
    contentTopOffset,
  };
}

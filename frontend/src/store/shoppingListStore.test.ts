import AsyncStorage from '@react-native-async-storage/async-storage';
import { useShoppingListStore } from './shoppingListStore';

describe('shoppingListStore', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    useShoppingListStore.setState({ items: [], loaded: false, loading: false });
    await AsyncStorage.removeItem('shopping:list:v1');
  });

  it('adds item and merges duplicates by product and store', async () => {
    await useShoppingListStore.getState().addItem({
      productId: 'p1',
      title: 'Milk',
      price: 500,
      storeId: 's1',
      quantity: 1,
    });
    await useShoppingListStore.getState().addItem({
      productId: 'p1',
      title: 'Milk',
      price: 500,
      storeId: 's1',
      quantity: 2,
    });

    const items = useShoppingListStore.getState().items;
    expect(items).toHaveLength(1);
    expect(items[0].quantity).toBe(3);
  });

  it('toggles checked state', async () => {
    await useShoppingListStore.getState().addItem({ productId: 'p1', title: 'Bread', price: 300 });
    const id = useShoppingListStore.getState().items[0].id;

    await useShoppingListStore.getState().toggleChecked(id);
    expect(useShoppingListStore.getState().items[0].checked).toBe(true);
  });

  it('clears only purchased items', async () => {
    await useShoppingListStore.getState().addItem({ productId: 'p1', title: 'A', price: 1 });
    await useShoppingListStore.getState().addItem({ productId: 'p2', title: 'B', price: 2 });

    const [firstId] = useShoppingListStore.getState().items.map((i) => i.id);
    await useShoppingListStore.getState().toggleChecked(firstId);
    await useShoppingListStore.getState().clearPurchased();

    expect(useShoppingListStore.getState().items).toHaveLength(1);
    expect(useShoppingListStore.getState().items[0].checked).toBe(false);
  });
});

// ─── In-store Mode: incrementCollected ─────────────────────────────────────────

describe('shoppingListStore — incrementCollected (In-store Mode)', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    useShoppingListStore.setState({ items: [], loaded: false, loading: false });
    await AsyncStorage.removeItem('shopping:list:v1');
  });

  it('new item initialises collectedQuantity to 0', async () => {
    await useShoppingListStore.getState().addItem({
      productId: 'eggs',
      title: 'Жұмыртқа',
      price: 200,
      quantity: 10,
    });

    const item = useShoppingListStore.getState().items[0];
    expect(item.collectedQuantity).toBe(0);
    expect(item.checked).toBe(false);
  });

  it('increments collectedQuantity without marking checked when below required', async () => {
    await useShoppingListStore.getState().addItem({
      productId: 'eggs',
      title: 'Жұмыртқа',
      price: 200,
      quantity: 10,
    });
    const { id } = useShoppingListStore.getState().items[0];

    await useShoppingListStore.getState().incrementCollected(id);
    await useShoppingListStore.getState().incrementCollected(id);

    const item = useShoppingListStore.getState().items.find((i) => i.id === id)!;
    expect(item.collectedQuantity).toBe(2);
    expect(item.checked).toBe(false);
  });

  it('auto-marks checked when collectedQuantity reaches quantity', async () => {
    await useShoppingListStore.getState().addItem({
      productId: 'eggs',
      title: 'Жұмыртқа',
      price: 200,
      quantity: 3,
    });
    const { id } = useShoppingListStore.getState().items[0];

    await useShoppingListStore.getState().incrementCollected(id);
    await useShoppingListStore.getState().incrementCollected(id);

    // not yet done
    expect(useShoppingListStore.getState().items.find((i) => i.id === id)!.checked).toBe(false);

    await useShoppingListStore.getState().incrementCollected(id);

    const item = useShoppingListStore.getState().items.find((i) => i.id === id)!;
    expect(item.collectedQuantity).toBe(3);
    expect(item.checked).toBe(true);
  });

  it('auto-marks checked for single-unit item on first scan', async () => {
    await useShoppingListStore.getState().addItem({
      productId: 'milk',
      title: 'Сүт',
      price: 350,
      quantity: 1,
    });
    const { id } = useShoppingListStore.getState().items[0];

    await useShoppingListStore.getState().incrementCollected(id);

    const item = useShoppingListStore.getState().items.find((i) => i.id === id)!;
    expect(item.collectedQuantity).toBe(1);
    expect(item.checked).toBe(true);
  });

  it('does nothing when id does not exist', async () => {
    await useShoppingListStore.getState().addItem({
      productId: 'milk',
      title: 'Сүт',
      price: 350,
    });

    // Should not throw
    await expect(
      useShoppingListStore.getState().incrementCollected('nonexistent-id'),
    ).resolves.toBeUndefined();

    expect(useShoppingListStore.getState().items[0].collectedQuantity).toBe(0);
  });

  it('persists collectedQuantity to AsyncStorage', async () => {
    await useShoppingListStore.getState().addItem({
      productId: 'rice',
      title: 'Күріш',
      price: 600,
      quantity: 2,
    });
    const { id } = useShoppingListStore.getState().items[0];

    await useShoppingListStore.getState().incrementCollected(id);

    const raw = await AsyncStorage.getItem('shopping:list:v1');
    const parsed = JSON.parse(raw!);
    expect(parsed[0].collectedQuantity).toBe(1);
  });

  it('does not overwrite checked=true if already manually checked', async () => {
    await useShoppingListStore.getState().addItem({
      productId: 'bread',
      title: 'Нан',
      price: 150,
      quantity: 5,
    });
    const { id } = useShoppingListStore.getState().items[0];

    // Manually mark as checked
    await useShoppingListStore.getState().toggleChecked(id);
    expect(useShoppingListStore.getState().items.find((i) => i.id === id)!.checked).toBe(true);

    // incrementCollected should not flip it back to false
    await useShoppingListStore.getState().incrementCollected(id);
    expect(useShoppingListStore.getState().items.find((i) => i.id === id)!.checked).toBe(true);
  });

  it('tracks collected independently for two different items', async () => {
    await useShoppingListStore.getState().addItem({
      productId: 'a',
      title: 'A',
      price: 100,
      quantity: 2,
    });
    await useShoppingListStore.getState().addItem({
      productId: 'b',
      title: 'B',
      price: 200,
      quantity: 2,
    });

    const ids = useShoppingListStore.getState().items.map((i) => i.id);

    await useShoppingListStore.getState().incrementCollected(ids[0]);

    const stateA = useShoppingListStore.getState().items.find((i) => i.id === ids[0])!;
    const stateB = useShoppingListStore.getState().items.find((i) => i.id === ids[1])!;

    expect(stateA.collectedQuantity).toBe(1);
    expect(stateB.collectedQuantity).toBe(0);
  });
});

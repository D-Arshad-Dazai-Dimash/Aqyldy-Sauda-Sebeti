import { checkout, cancelOrder } from './orders';
import { api } from './client';

jest.mock('./client', () => ({
  api: {
    post: jest.fn(),
    patch: jest.fn(),
  },
}));

describe('orders api', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('sends checkout payload with payment method fields', async () => {
    (api.post as jest.Mock).mockResolvedValue({ data: { id: 'order-1' } });

    await checkout({
      storeId: 'store-1',
      paymentMethod: 'CARD',
      cardLast4: '1234',
      cardBrand: 'Visa',
      comment: 'leave at door',
    });

    expect(api.post).toHaveBeenCalledWith('/api/orders/checkout', {
      storeId: 'store-1',
      paymentMethod: 'CARD',
      cardLast4: '1234',
      cardBrand: 'Visa',
      comment: 'leave at door',
    });
  });

  it('uses PATCH cancel endpoint', async () => {
    (api.patch as jest.Mock).mockResolvedValue({ data: { id: 'order-1', status: 'CANCELLED' } });

    await cancelOrder('order-1');

    expect(api.patch).toHaveBeenCalledWith('/api/orders/order-1/cancel');
  });
});

const mockPost = jest.fn();

jest.mock('axios', () => ({
  __esModule: true,
  default: {
    create: jest.fn(() => ({
      interceptors: { request: { use: jest.fn() } },
      post: mockPost,
      get: jest.fn(),
    })),
  },
}));

describe('ai chat api', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('sends location payload to chat endpoint when provided', async () => {
    mockPost.mockResolvedValueOnce({
      data: {
        reply: 'ok',
        suggested_products: [],
        ingredient_checklist: [],
        store_suggestions: [],
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { sendChatMessage } = require('./ai');

    await sendChatMessage('плов', [], undefined, {
      latitude: 51.12,
      longitude: 71.43,
      radiusMeters: 7000,
    });

    expect(mockPost).toHaveBeenCalledWith('/api/ai/chat', {
      message: 'плов',
      conversation_history: [],
      user_id: undefined,
      user_latitude: 51.12,
      user_longitude: 71.43,
      radius_meters: 7000,
    });
  });

  it('uses default radius when location is omitted', async () => {
    mockPost.mockResolvedValueOnce({
      data: {
        reply: 'ok',
        suggested_products: [],
        ingredient_checklist: [],
        store_suggestions: [],
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { sendChatMessage } = require('./ai');

    await sendChatMessage('milk', []);

    expect(mockPost).toHaveBeenCalledWith('/api/ai/chat', {
      message: 'milk',
      conversation_history: [],
      user_id: undefined,
      user_latitude: undefined,
      user_longitude: undefined,
      radius_meters: 5000,
    });
  });
});

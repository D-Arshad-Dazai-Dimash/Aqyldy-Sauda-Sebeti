/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import App from '../App';

jest.mock('../src/app/navigation', () => 'RootNavigation');
jest.mock('../src/store/authStore', () => ({
  useAuthStore: (selector: any) => selector({
    bootstrap: jest.fn(),
  }),
}));
jest.mock('../src/store/favoritesStore', () => ({
  useFavoritesStore: (selector: any) => selector({
    load: jest.fn(),
  }),
}));

test('renders correctly', async () => {
  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(<App />);
  });
});

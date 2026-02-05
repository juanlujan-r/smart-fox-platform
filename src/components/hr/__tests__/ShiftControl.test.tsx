import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ShiftControl from '../ShiftControl';

// mock supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: { getUser: async () => ({ data: { user: { id: 'user-1' } } }) },
    from: () => ({ insert: async () => ({ data: [], error: null }), select: () => ({ eq: () => ({ order: () => ({ limit: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) }) }) }) }),
  },
}));

test('renders and records Entrada', async () => {
  render(<ShiftControl />);

  const entradaBtn = await screen.findByText('Entrada');
  fireEvent.click(entradaBtn);

  await waitFor(() => expect(screen.getByText(/recorded/i)).toBeInTheDocument());
});

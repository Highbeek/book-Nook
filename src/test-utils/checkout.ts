import { screen, type userEvent } from '@testing-library/react-native';

export async function fillValidCheckoutForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('Name on card'), 'Ada Lovelace');
  await user.type(screen.getByLabelText('Email'), 'ada@example.com');
  await user.type(screen.getByLabelText('Card number'), '4242424242424242');
  await user.type(screen.getByLabelText('Expiry (MM/YY)'), '1230');
  await user.type(screen.getByLabelText('CVC'), '123');
}

import { render, screen, userEvent } from '@testing-library/react-native';

import { fillValidCheckoutForm } from '@/test-utils/checkout';
import { deferred } from '@/test-utils/deferred';

import { CheckoutForm } from '../CheckoutForm';
import { PaymentError, type PaymentReceipt } from '../paymentService';

const receipt: PaymentReceipt = {
  reference: 'BN_TEST',
  amount: 7_500_00,
  last4: '4242',
  paidAt: '2026-11-12T10:00:00.000Z',
};

describe('<CheckoutForm />', () => {
  it('shows the amount on the pay button', async () => {
    await render(<CheckoutForm amount={7_500_00} onSuccess={jest.fn()} pay={jest.fn()} />);
    expect(screen.getByRole('button', { name: 'Pay ₦7,500' })).toBeOnTheScreen();
  });

  it('opens a numeric keyboard and ignores non-digits in the card fields', async () => {
    const user = userEvent.setup();
    await render(<CheckoutForm amount={100} onSuccess={jest.fn()} pay={jest.fn()} />);

    for (const label of ['Card number', 'Expiry (MM/YY)', 'CVC']) {
      expect(screen.getByLabelText(label)).toHaveProp('inputMode', 'numeric');
    }

    await user.type(screen.getByLabelText('Card number'), '4242abcd4242');
    expect(screen.getByLabelText('Card number')).toHaveDisplayValue('4242 4242');
  });

  it('formats card number and expiry as the user types', async () => {
    const user = userEvent.setup();
    await render(<CheckoutForm amount={100} onSuccess={jest.fn()} pay={jest.fn()} />);

    await user.type(screen.getByLabelText('Card number'), '4242424242424242');
    await user.type(screen.getByLabelText('Expiry (MM/YY)'), '1230');

    expect(screen.getByLabelText('Card number')).toHaveDisplayValue('4242 4242 4242 4242');
    expect(screen.getByLabelText('Expiry (MM/YY)')).toHaveDisplayValue('12/30');
  });

  it('shows validation errors and does not charge when the form is invalid', async () => {
    const user = userEvent.setup();
    const pay = jest.fn();
    await render(<CheckoutForm amount={7_500_00} onSuccess={jest.fn()} pay={pay} />);

    await user.press(screen.getByRole('button', { name: 'Pay ₦7,500' }));

    expect(screen.getByText('Enter the name on the card.')).toBeOnTheScreen();
    expect(screen.getByText('Enter your card number.')).toBeOnTheScreen();
    expect(screen.getByText('Enter the 3 or 4 digit security code.')).toBeOnTheScreen();
    expect(pay).not.toHaveBeenCalled();
  });

  it('validates a field as the user types, leaving untouched fields alone', async () => {
    const user = userEvent.setup();
    await render(<CheckoutForm amount={100} onSuccess={jest.fn()} pay={jest.fn()} />);

    await user.type(screen.getByLabelText('Email'), 'ada@');
    expect(screen.getByText('Enter a valid email address.')).toBeOnTheScreen();
    expect(screen.queryByText('Enter the name on the card.')).not.toBeOnTheScreen();

    await user.type(screen.getByLabelText('Email'), 'example.com');
    expect(screen.queryByText('Enter a valid email address.')).not.toBeOnTheScreen();
  });

  it('clears an error live once the user fixes the field', async () => {
    const user = userEvent.setup();
    await render(<CheckoutForm amount={100} onSuccess={jest.fn()} pay={jest.fn()} />);
    await user.press(screen.getByRole('button', { name: /^Pay/ }));
    expect(screen.getByText('Enter the name on the card.')).toBeOnTheScreen();

    await user.type(screen.getByLabelText('Name on card'), 'Ada');

    expect(screen.queryByText('Enter the name on the card.')).not.toBeOnTheScreen();
  });

  it('charges once with the right payload, shows progress, then reports success', async () => {
    const user = userEvent.setup();
    const payment = deferred<PaymentReceipt>();
    const pay = jest.fn().mockReturnValue(payment.promise);
    const onSuccess = jest.fn();
    await render(<CheckoutForm amount={7_500_00} onSuccess={onSuccess} pay={pay} />);
    await fillValidCheckoutForm(user);

    await user.press(screen.getByRole('button', { name: 'Pay ₦7,500' }));

    const busyButton = screen.getByTestId('pay-button');
    expect(busyButton).toBeDisabled();
    expect(busyButton).toBeBusy();

    await user.press(busyButton);
    expect(pay).toHaveBeenCalledTimes(1);
    expect(pay).toHaveBeenCalledWith({
      amount: 7_500_00,
      email: 'ada@example.com',
      card: {
        number: '4242 4242 4242 4242',
        expiry: '12/30',
        cvc: '123',
        name: 'Ada Lovelace',
      },
    });

    payment.resolve(receipt);
    await screen.findByRole('button', { name: /^Pay/ });
    expect(onSuccess).toHaveBeenCalledWith(receipt);
  });

  it('shows a decline message and lets the user try again', async () => {
    const user = userEvent.setup();
    const pay = jest
      .fn()
      .mockRejectedValueOnce(
        new PaymentError('Your card was declined. Please use a different card.'),
      );
    const onSuccess = jest.fn();
    await render(<CheckoutForm amount={7_500_00} onSuccess={onSuccess} pay={pay} />);
    await fillValidCheckoutForm(user);

    await user.press(screen.getByRole('button', { name: 'Pay ₦7,500' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/Your card was declined/);
    expect(onSuccess).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Pay ₦7,500' })).toBeEnabled();
  });

  it('shows a generic message for unexpected payment failures', async () => {
    const user = userEvent.setup();
    const pay = jest.fn().mockRejectedValue(new Error('socket hang up'));
    await render(<CheckoutForm amount={100} onSuccess={jest.fn()} pay={pay} />);
    await fillValidCheckoutForm(user);

    await user.press(screen.getByRole('button', { name: /^Pay/ }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Payment failed. Please try again.');
  });
});

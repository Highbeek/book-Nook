import { render, screen, userEvent } from '@testing-library/react-native';

import { TextField } from '../TextField';

describe('<TextField />', () => {
  it('uses the label as the accessible name and forwards typing', async () => {
    const user = userEvent.setup();
    const onChangeText = jest.fn();
    await render(<TextField label="Email" value="" onChangeText={onChangeText} />);

    await user.type(screen.getByLabelText('Email'), 'a');

    expect(onChangeText).toHaveBeenCalledWith('a');
  });

  it('shows the error and marks the input invalid', async () => {
    await render(<TextField label="Email" value="x" error="Enter a valid email address." />);

    expect(screen.getByText('Enter a valid email address.')).toBeOnTheScreen();
    expect(screen.getByLabelText('Email')).toHaveProp('aria-invalid', true);
  });

  it('shows no error text when valid', async () => {
    await render(<TextField label="Email" value="ada@example.com" />);

    expect(screen.getByLabelText('Email')).toHaveProp('aria-invalid', false);
  });
});

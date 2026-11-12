import { fireEvent, render, screen, userEvent } from '@testing-library/react-native';
import { Keyboard } from 'react-native';

import { SearchBar } from '../SearchBar';

describe('<SearchBar />', () => {
  it('shows Cancel only while focused, and Cancel closes the keyboard', async () => {
    const user = userEvent.setup();
    const dismiss = jest.spyOn(Keyboard, 'dismiss');
    await render(<SearchBar value="" onChangeText={jest.fn()} />);
    const input = screen.getByLabelText('Search books');

    expect(screen.queryByRole('button', { name: 'Close keyboard' })).not.toBeOnTheScreen();

    await fireEvent(input, 'focus');
    await user.press(screen.getByRole('button', { name: 'Close keyboard' }));
    expect(dismiss).toHaveBeenCalled();

    await fireEvent(input, 'blur');
    expect(screen.queryByRole('button', { name: 'Close keyboard' })).not.toBeOnTheScreen();
  });

  it('clears the query', async () => {
    const user = userEvent.setup();
    const onChangeText = jest.fn();
    await render(<SearchBar value="dune" onChangeText={onChangeText} />);
    await user.press(screen.getByRole('button', { name: 'Clear search' }));
    expect(onChangeText).toHaveBeenCalledWith('');
  });
});

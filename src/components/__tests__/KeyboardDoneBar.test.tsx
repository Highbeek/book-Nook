import { render, screen, userEvent } from '@testing-library/react-native';
import { Keyboard, Platform } from 'react-native';

import { KeyboardDoneBar } from '../KeyboardDoneBar';

const originalOS = Platform.OS;

afterEach(() => {
  Platform.OS = originalOS;
  jest.restoreAllMocks();
});

describe('<KeyboardDoneBar />', () => {
  it('closes the keyboard from the Done button on iOS', async () => {
    Platform.OS = 'ios';
    const dismiss = jest.spyOn(Keyboard, 'dismiss');
    const user = userEvent.setup();
    await render(<KeyboardDoneBar nativeID="kb" />);

    await user.press(screen.getByRole('button', { name: 'Close keyboard' }));

    expect(dismiss).toHaveBeenCalled();
  });

  it('renders nothing on Android, which has its own submit key', async () => {
    Platform.OS = 'android';
    await render(<KeyboardDoneBar nativeID="kb" />);

    expect(screen.queryByRole('button', { name: 'Close keyboard' })).not.toBeOnTheScreen();
  });
});

import { render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import { PulseOnChange } from '../PulseOnChange';

describe('<PulseOnChange />', () => {
  it('renders its children and keeps them in sync as the value changes', async () => {
    const { rerender } = await render(
      <PulseOnChange value={1}>
        <Text>₦1,000</Text>
      </PulseOnChange>,
    );
    expect(screen.getByText('₦1,000')).toBeOnTheScreen();

    await rerender(
      <PulseOnChange value={2}>
        <Text>₦2,000</Text>
      </PulseOnChange>,
    );
    expect(screen.getByText('₦2,000')).toBeOnTheScreen();
  });
});

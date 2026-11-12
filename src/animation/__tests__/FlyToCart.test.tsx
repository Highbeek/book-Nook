import { render, screen, userEvent } from '@testing-library/react-native';
import { Pressable, Text } from 'react-native';

import type { ViewRef } from '@/utils/refs';

import { FlyToCartProvider, useFlyToCart } from '../FlyToCart';

function measuredRef(x: number, y: number, width: number, height: number) {
  const measureInWindow = jest.fn((cb: (...r: number[]) => void) => cb(x, y, width, height));
  return { ref: { current: { measureInWindow } } as unknown as ViewRef, measureInWindow };
}

function Launcher({ source }: { source: ViewRef | null }) {
  const fly = useFlyToCart();
  return (
    <Pressable
      role="button"
      aria-label="Launch"
      onPress={() => fly(source, { coverId: null, title: 'Dune' })}
    >
      <Text>Launch</Text>
    </Pressable>
  );
}

describe('FlyToCart', () => {
  it('measures the source cover, runs the flight and cleans up the overlay', async () => {
    const user = userEvent.setup();
    const source = measuredRef(20, 300, 64, 96);
    await render(
      <FlyToCartProvider>
        <Launcher source={source.ref} />
      </FlyToCartProvider>,
    );

    await user.press(screen.getByRole('button', { name: 'Launch' }));

    expect(source.measureInWindow).toHaveBeenCalled();

    expect(screen.queryByText('Dune')).not.toBeOnTheScreen();
  });

  it('does not crash when there is nothing to measure', async () => {
    const user = userEvent.setup();
    await render(
      <FlyToCartProvider>
        <Launcher source={null} />
      </FlyToCartProvider>,
    );
    await user.press(screen.getByRole('button', { name: 'Launch' }));
    expect(screen.getByRole('button', { name: 'Launch' })).toBeOnTheScreen();
  });

  it('is a safe no-op outside the provider', async () => {
    const user = userEvent.setup();
    await render(<Launcher source={measuredRef(0, 0, 10, 10).ref} />);
    await user.press(screen.getByRole('button', { name: 'Launch' }));
    expect(screen.getByRole('button', { name: 'Launch' })).toBeOnTheScreen();
  });
});

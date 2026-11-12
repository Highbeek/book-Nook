import { render, screen } from '@testing-library/react-native';

import { Bone, Skeleton } from '../Skeleton';

describe('<Skeleton />', () => {
  it('announces itself as a busy progress indicator with the given label', async () => {
    await render(
      <Skeleton label="Loading book…">
        <Bone height={14} />
      </Skeleton>,
    );

    const skeleton = screen.getByRole('progressbar', { name: 'Loading book…' });
    expect(skeleton).toBeOnTheScreen();
    expect(skeleton).toHaveProp('aria-busy', true);
  });
});

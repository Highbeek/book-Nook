import { render, screen } from '@testing-library/react-native';

import { RatingSummary } from '../RatingSummary';

const rating = {
  average: 3.96,
  count: 1_220,
  distribution: { 1: 110, 2: 60, 3: 180, 4: 290, 5: 580 },
};

describe('<RatingSummary />', () => {
  it('shows the average to one decimal, rounded stars, and the total count', async () => {
    await render(<RatingSummary rating={rating} />);

    expect(screen.getByText('4.0')).toBeOnTheScreen();
    expect(screen.getByText('★★★★☆')).toBeOnTheScreen();
    expect(screen.getByText('1,220 ratings')).toBeOnTheScreen();
    expect(screen.getByLabelText('Rated 4.0 out of 5 from 1,220 ratings')).toBeOnTheScreen();
  });

  it('lists every star value with its count, 5 down to 1', async () => {
    await render(<RatingSummary rating={rating} />);

    expect(screen.getByLabelText('5 stars: 580 ratings')).toBeOnTheScreen();
    expect(screen.getByLabelText('1 star: 110 ratings')).toBeOnTheScreen();
  });

  it('uses singular wording for a single rating', async () => {
    await render(
      <RatingSummary
        rating={{ average: 5, count: 1, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 1 } }}
      />,
    );
    expect(screen.getByText('1 rating')).toBeOnTheScreen();
  });

  it('shows an empty state when there are no ratings', async () => {
    await render(<RatingSummary rating={null} />);
    expect(screen.getByText('No reader ratings yet.')).toBeOnTheScreen();
  });
});

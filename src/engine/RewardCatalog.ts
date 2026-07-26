export type Reward = { id: string; name: string; effect: string; params?: any };

export const Rewards: Reward[] = [
  { id: 'shield', name: 'Shield', effect: 'ignore_punishment' },
  { id: 'extra_step', name: 'Extra Step', effect: 'advance', params: { steps: 1 } },
  { id: 'second_wind', name: 'Second Wind', effect: 'replay' },
  { id: 'inspiration', name: 'Inspiration', effect: 'choose_category' },
  { id: 'compass', name: 'Compass', effect: 'choose_between_two' },
];

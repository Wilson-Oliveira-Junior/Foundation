export type Reward = { id: string; type: string; payload?: any };

export default class RewardEngine {
  applyReward(playerId: string, reward: Reward) {
    // stub: implement reward application logic per player session
    console.log('Applying reward', reward, 'to', playerId);
  }
}

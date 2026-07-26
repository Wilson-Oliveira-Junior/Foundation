export default class MovementManager {
  movePiece(piece: any, track: any[], steps: number, onComplete: () => void) {
    // delegate to piece.moveAlong for now
    if (typeof piece.moveAlong === 'function') {
      piece.moveAlong(track, steps, onComplete);
    } else {
      onComplete();
    }
  }
}

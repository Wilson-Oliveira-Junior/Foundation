export default class TurnManager {
  private queue: string[] = [];

  constructor(names: string[] = []) {
    this.queue = names.slice();
  }

  next(): string | null {
    if (this.queue.length === 0) return null;
    const p = this.queue.shift()!;
    this.queue.push(p);
    return p;
  }

  peek(): string | null {
    return this.queue[0] || null;
  }

  setOrder(names: string[]) {
    this.queue = names.slice();
  }
}

export default class Narrator {
  say(scene: any, text: string, opts: any = {}) {
    scene.add.text(opts.x || 20, opts.y || 140, text, { color: opts.color || '#fff' });
  }
}

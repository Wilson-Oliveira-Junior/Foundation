export type ContentItem = {
  id: string;
  category: string;
  difficulty: number;
  question: string;
  answer: string;
};

export default class ContentPack {
  constructor(public items: ContentItem[] = []) {}

  getAll() {
    return this.items.slice();
  }

  getByCategory(cat: string) {
    return this.items.filter(i => i.category === cat);
  }
}

export type NarratorProfile = {
  id: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  greetings?: string[];
  encouragement?: string[];
  finalWin?: string[];
};

export const Profiles: NarratorProfile[] = [
  {
    id: 'cornerstone_beginner',
    difficulty: 'beginner',
    greetings: ['Boa tentativa! Vamos descobrir juntos.'],
    encouragement: ['Ótimo! Continue assim.'],
    finalWin: ['Você despertou a Cornerstone. Parabéns!'],
  },
  {
    id: 'cornerstone_advanced',
    difficulty: 'advanced',
    greetings: ['Interessante... acredito que você consegue ir além.'],
    encouragement: ['Isso foi desafiador — bom trabalho.'],
    finalWin: ['Você provou seu domínio. A Cornerstone desperta.'],
  },
];

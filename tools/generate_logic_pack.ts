import fs from 'fs';
import path from 'path';

type Q = {
  id: string;
  type: string;
  skill: string;
  learning_objective: string;
  bloom_level: string;
  question: string;
  options?: string[];
  answer?: number;
  explanation?: string;
  tags?: string[];
  difficulty: string;
}

function makeId(prefix:string, difficulty:string, n:number){
  const d = difficulty[0].toUpperCase();
  return `${prefix}-${d}-${String(n).padStart(3,'0')}`;
}

function generateForDifficulty(difficulty:string, startIndex:number, count:number){
  const qs: Q[] = [];
  for(let i=0;i<count;i++){
    const idx = startIndex + i + 1;
    qs.push({
      id: makeId('LOG', difficulty, idx),
      type: 'multiple_choice',
      skill: 'logical_reasoning',
      learning_objective: 'Apply basic logic patterns',
      bloom_level: difficulty === 'easy' ? 'remember' : difficulty === 'medium' ? 'understand' : 'apply',
      question: `Pergunta ${idx}: Qual é a próxima ação lógica nesta situação? (dificuldade: ${difficulty})`,
      options: ['Opção A','Opção B','Opção C','Opção D'],
      answer: 0,
      explanation: 'Resposta exemplo.',
      tags: ['logic'],
      difficulty
    });
  }
  return qs;
}

function main(){
  const outDir = path.join(__dirname, '..', 'content-packs', 'pack-programming-logic-v1');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const easy = generateForDifficulty('easy', 0, 70);
  const medium = generateForDifficulty('medium', 70, 70);
  const hard = generateForDifficulty('hard', 140, 70);
  const all = easy.concat(medium).concat(hard);
  const payload = { pack: 'programming', category: 'logic', difficulty: 'mixed', version:1, questions: all };
  fs.writeFileSync(path.join(outDir, 'questions.generated.json'), JSON.stringify(payload, null, 2), 'utf8');
  console.log('Generated', all.length, 'questions at', path.join(outDir, 'questions.generated.json'));
}

if (require.main === module) main();

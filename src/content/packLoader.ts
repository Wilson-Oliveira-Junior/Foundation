import fs from 'fs';
import path from 'path';

export type Question = any;

export function loadPackDir(packDir: string) {
  const manifestPath = path.join(packDir, 'manifest.json');
  const questionsPath = path.join(packDir, 'questions.json');
  if (!fs.existsSync(manifestPath) || !fs.existsSync(questionsPath)) throw new Error('Pack missing manifest or questions.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const questions = JSON.parse(fs.readFileSync(questionsPath, 'utf8'));
  return { manifest, questions };
}

export function generateDeck(questions: Question[], seed: number | string, count: number) {
  // deterministic shuffle using a simple mulberry32
  const s = Number(String(seed).split('').reduce((a,b)=>a+b.charCodeAt(0),0) || 1);
  function mulberry32(a:number){return function(){var t=a+=0x6D2B79F5;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;}}
  const rng = mulberry32(s);
  const arr = questions.slice();
  for (let i = arr.length -1; i>0; i--){
    const j = Math.floor(rng()*(i+1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.slice(0, count);
}

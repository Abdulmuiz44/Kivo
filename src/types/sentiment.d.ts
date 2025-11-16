declare module 'sentiment' {
  export default class Sentiment {
    analyze(text: string): {
      score: number;
      comparative: number;
      calculation: Array<{ [key: string]: number }>;
      tokens: string[];
      words: string[];
      positive: string[];
      negative: string[];
    };
  }
}

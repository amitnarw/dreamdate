declare module "node-nlp-rn" {
  export class NlpManager {
    constructor(options?: any);
    import(model: any): void;
    export(removeExportedTraining?: boolean): any;
    addDocument(language: string, utterance: string, intent: string): void;
    addAnswer(language: string, intent: string, answer: string): void;
    process(language: string, text: string): Promise<any>;
    train(): Promise<void>;
  }
}

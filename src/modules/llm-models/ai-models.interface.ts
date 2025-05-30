export enum AvailableModels {
  GPT_4_1 = 'gpt-4.1',
  GPT_3_5_TURBO = 'gpt-3.5-turbo',
  GPT_4O_MINI = 'gpt-4o-mini',
  CLAUDE_3_OPUS = 'claude-3-opus-20240229',
  GEMINI_1_5_PRO = 'gemini-1.5-pro',
}

export const modelsMapper = {
  openAI: [
    AvailableModels.GPT_4_1,
    AvailableModels.GPT_3_5_TURBO,
    AvailableModels.GPT_4O_MINI,
  ],
  claude: [AvailableModels.CLAUDE_3_OPUS],
  gemini: [AvailableModels.GEMINI_1_5_PRO],
};

export type Category = {
  name: string;
  severity: number;
  reason: string;
};

export type AIModelResponse = {
  categories?: Category[];
  model?: string;
  isAcceptable?: boolean;
  error?: string;
};

export interface AiModel {
  moderateComment(
    comment: string,
    model?: string,
    prompt?: string,
  ): Promise<AIModelResponse>;
}

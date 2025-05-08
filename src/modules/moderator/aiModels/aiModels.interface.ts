// TODO - This will be used later to unify the different AI models

type User = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  username: string;
};

type Category = {
  name: string;
  severity: number;
};

type AIModelResponse = {
  categories: Category[];
  reason: string;
};

export interface AiModel {
  checkComment(comment: string): Promise<AIModelResponse>;
  checkPost(post: string): Promise<AIModelResponse>;
  checkUser(user: User): Promise<AIModelResponse>;
}

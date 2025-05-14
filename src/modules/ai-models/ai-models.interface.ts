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
  reason: string;
};

type AIModelResponse = {
  categories: Category[];
  isAcceptable: boolean;
};

export interface AiModel {
  checkComment(comment: string): Promise<AIModelResponse>;
  checkPost(post: string): Promise<AIModelResponse>;
  checkUser(user: User): Promise<AIModelResponse>;
  checkImage(image: string): Promise<AIModelResponse>;
}

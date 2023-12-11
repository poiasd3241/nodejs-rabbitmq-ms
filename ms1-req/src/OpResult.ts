export type OpResult = {
  data?: any;
  isError: boolean;
  errorMessage?: string;
};

export const OkOpResult = (data: any): OpResult => ({ data, isError: false });
export const ErrorOpResult = (errorMessage: string): OpResult => ({
  isError: true,
  errorMessage,
});

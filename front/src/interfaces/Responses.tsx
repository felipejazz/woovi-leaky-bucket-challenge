export interface LoginMutationResponse {
    login: {
      token: string | null;
    };
  }
  
export interface RegisterMutationResponse {
    register: {
      errorMessage: string;
      successMessage: string;
    };
  }
  

export interface SimulatePixQueryResponse {
    simulatePixQuery: {
      message: string;
      tokensLeft: number;
    };
  }
  
export interface LoginMutationResponse {
    login: {
      token: string;
    };
  }
  
export interface RegisterMutationResponse {
    register: {
      token: string;
    };
  }
  

export interface SimulatePixQueryResponse {
    simulatePixQuery: {
      message: string;
      tokensLeft: number;
    };
  }
  
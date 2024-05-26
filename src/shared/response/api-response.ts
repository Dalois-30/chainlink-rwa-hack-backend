export class ApiResponseDTO<T> {
    data?: T;
    message?: any;
    statusCode?: number;
  }
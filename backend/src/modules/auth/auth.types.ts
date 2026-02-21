export interface LoginRequest {
    email: string;
    password: string;
}

export interface RegisterRequest {
    email: string;
    password: string;
    name: string;
    studentId?: string;
}

export interface AuthResponse {
    token: string;
    user: {
        userId: string;
        email: string;
        name: string;
    };
}

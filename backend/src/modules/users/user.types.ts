export interface User {
    id: string;
    email: string;
    name: string;
    studentId?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface UpdateUserRequest {
    name?: string;
    email?: string;
}

import { UserRepository } from "./user.repository";

export class UserService {
    static async getUserById(userId: string) {
        // TODO: Implement user lookup
        return UserRepository.findById(userId);
    }

    static async updateUser(userId: string, data: any) {
        // TODO: Validate and update user fields
        return UserRepository.update(userId, data);
    }
}

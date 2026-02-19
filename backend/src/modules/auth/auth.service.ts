import { generateToken, TokenPayload } from "../../core/security/jwt.util";

export class AuthService {
    static async login(email: string, password: string) {
        // TODO: Validate credentials against database
        // TODO: Compare hashed password

        const payload: TokenPayload = { userId: "temp-id", email };
        const token = generateToken(payload);

        return { token, user: { email } };
    }

    static async register(userData: { email: string; password: string; name: string }) {
        // TODO: Hash password
        // TODO: Save user to database
        // TODO: Return created user

        return { message: "User registered successfully" };
    }
}

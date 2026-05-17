import { ID } from "appwrite";
import { account, isAppwriteConfigured } from "@/lib/appwrite";
import { LoginSchemaType, RegisterSchemaType } from "@/validations/auth";

export const authService = {
  async register(data: RegisterSchemaType) {
    if (!isAppwriteConfigured) throw new Error("Appwrite is not configured. Set your .env.local variables.");
    try {
      const newAccount = await account.create(
        ID.unique(),
        data.email,
        data.password,
        data.name
      );
      // Auto-login after registration
      await this.login({ email: data.email, password: data.password });
      return newAccount;
    } catch (error: any) {
      throw new Error(error.message || "Failed to register");
    }
  },

  async login(data: LoginSchemaType) {
    if (!isAppwriteConfigured) throw new Error("Appwrite is not configured. Set your .env.local variables.");
    try {
      const session = await account.createEmailPasswordSession(
        data.email,
        data.password
      );
      return session;
    } catch (error: any) {
      throw new Error(error.message || "Failed to login");
    }
  },

  async logout() {
    if (!isAppwriteConfigured) return;
    try {
      await account.deleteSession("current");
    } catch (error: any) {
      throw new Error(error.message || "Failed to logout");
    }
  },

  async getCurrentUser() {
    if (!isAppwriteConfigured) return null;
    try {
      const currentAccount = await account.get();
      return currentAccount;
    } catch {
      return null;
    }
  },
};

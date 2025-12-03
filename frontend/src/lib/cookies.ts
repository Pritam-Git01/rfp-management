import Cookies from "js-cookie";
import { User } from "@/types";

const TOKEN_KEY = "token";
const USER_KEY = "user";

export const setAuthCookie = (token: string, user: User) => {
  Cookies.set(TOKEN_KEY, token, { expires: 7, sameSite: "Lax" }); // 7 days
  Cookies.set(USER_KEY, JSON.stringify(user), { expires: 7, sameSite: "Lax" });
};

export const getAuthCookie = () => {
  const token = Cookies.get(TOKEN_KEY);
  const userStr = Cookies.get(USER_KEY);
  let user: User | null = null;

  if (userStr) {
    try {
      user = JSON.parse(userStr);
    } catch (error) {
      console.error("Error parsing user cookie:", error);
    }
  }

  return { token, user };
};

export const clearAuthCookie = () => {
  Cookies.remove(TOKEN_KEY);
  Cookies.remove(USER_KEY);
};

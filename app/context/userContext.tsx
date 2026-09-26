"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { createContext, type ReactNode, useContext } from "react";
import { useCurrentUser } from "../hooks/useCurrentUser";

interface User {
  id: number;
  name: string;
  email: string;
  role?: string;
}

interface UserContextType {
  userFormat: User | null;
  isAdmin: boolean;
  isUser: boolean;
  isInstructor: boolean;
  isStudent: boolean;
  isParent: boolean;
  isAccountant: boolean;
  isLoading: boolean;
  logout: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const { data: user, isLoading } = useCurrentUser();
  const router = useRouter();
  const queryClient = useQueryClient();

  const userFormat: User | null = user
    ? {
        id: user.userId,
        name: user.name,
        email: user.email,
        role: user.role,
      }
    : null;

  const isAdmin = ["ADMIN", "SUPER_ADMIN"].includes(userFormat?.role ?? "");
  const isInstructor = userFormat?.role === "INSTRUCTOR";
  const isStudent = userFormat?.role === "STUDENT";
  const isParent = userFormat?.role === "PARENT";
  const isAccountant = userFormat?.role === "ACCOUNTANT";
  const isUser = isInstructor;

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      queryClient.clear();

      // Clear the token cookie
      // biome-ignore lint/suspicious/noDocumentCookie: Direct assignment is used to clear the token as Cookie Store API is not yet universal.
      document.cookie = "token=; Max-Age=0; path=/; SameSite=Lax";

      router.push("/login");
    } catch (error) {
      console.error("logout error:", error);
      router.push("/login");
    }
  };

  return (
    <UserContext.Provider
      value={{
        userFormat,
        isAdmin,
        isUser,
        isInstructor,
        isStudent,
        isParent,
        isAccountant,
        isLoading,
        logout,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used with use UserProvider");
  }
  return context;
};

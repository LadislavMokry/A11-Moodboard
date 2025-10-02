// ABOUTME: Service functions for interacting with /users endpoints
// ABOUTME: Uses Axios wrapper and Zod validation.

import { http } from "@/lib/http";
import { UserListSchema, UserSchema, type User } from "@/schemas/user";

export const getUsers = async (): Promise<User[]> => {
  const { data } = await http.get("/users");
  return UserListSchema.parse(data);
};

export const getUser = async (id: number): Promise<User> => {
  const { data } = await http.get(`/users/${id}`);
  return UserSchema.parse(data);
};

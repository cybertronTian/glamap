import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import type { InsertMessage, Message } from "@shared/schema";
import { useAuth } from "./use-auth";

export function useMessages(otherUserId?: number) {
  const { getToken } = useAuth();
  return useQuery({
    queryKey: [api.messages.list.path, otherUserId],
    queryFn: async () => {
      const token = await getToken();
      const url = new URL(api.messages.list.path, window.location.origin);
      if (otherUserId) {
        url.searchParams.append("otherUserId", String(otherUserId));
      }
      const res = await fetch(url.toString(), {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error("Failed to fetch messages");
      return api.messages.list.responses[200].parse(await res.json());
    },
    refetchInterval: 3000, // Poll every 3s for MVP
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();
  return useMutation({
    mutationFn: async (data: { receiverId: number; content: string }) => {
      const token = await getToken();
      const res = await fetch(api.messages.send.path, {
        method: api.messages.send.method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to send message");
      return api.messages.send.responses[201].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.messages.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.messages.list.path, variables.receiverId] });
    },
  });
}

export function useDeleteMessage() {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();
  return useMutation({
    mutationFn: async (messageId: number) => {
      const token = await getToken();
      const res = await fetch(`/api/messages/${messageId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error("Failed to delete message");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.messages.list.path] });
    },
  });
}

export function useDeleteConversation() {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();
  return useMutation({
    mutationFn: async (otherUserId: number) => {
      const token = await getToken();
      const res = await fetch(`/api/messages/conversation/${otherUserId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error("Failed to delete conversation");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.messages.list.path] });
    },
  });
}

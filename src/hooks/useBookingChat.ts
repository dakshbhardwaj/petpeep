"use client"
// Needs "use client" — uses useState, useEffect, useCallback, and
// the browser Supabase client for Realtime subscriptions.

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"

export type ChatMessage = {
  id: string
  bookingId: string
  senderId: string
  content: string
  sentAt: string
  readAt: string | null
}

type UseChatReturn = {
  messages: ChatMessage[]
  isLoading: boolean
  sendMessage: (content: string) => Promise<void>
}

/**
 * Hook that loads chat messages for a booking and subscribes to new
 * messages via Supabase Realtime (postgres_changes INSERT on Message table).
 *
 * @param bookingId - The booking whose chat thread to subscribe to.
 */
export function useBookingChat(bookingId: string): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    // Load initial messages via the REST API (also marks unread as read)
    fetch(`/api/bookings/${bookingId}/messages`)
      .then((r) => r.json())
      .then((data: { messages?: ChatMessage[] }) => {
        setMessages(data.messages ?? [])
        setIsLoading(false)
      })
      .catch(() => setIsLoading(false))

    // Subscribe to new messages inserted in Supabase Realtime
    const channel = supabase
      .channel(`booking-chat-${bookingId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "Message",
          filter: `bookingId=eq.${bookingId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as ChatMessage])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [bookingId])

  const sendMessage = useCallback(
    async (content: string): Promise<void> => {
      await fetch(`/api/bookings/${bookingId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      })
    },
    [bookingId]
  )

  return { messages, isLoading, sendMessage }
}

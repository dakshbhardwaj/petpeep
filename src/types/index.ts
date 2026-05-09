/**
 * Global TypeScript types for PetPeep.
 * Import from "@/types" everywhere.
 */
import type {
  User,
  PetParent,
  Sitter,
  Pet,
  Booking,
  BookingEvent,
  PhotoUpdate,
  Message,
  Review,
  Payout,
  SOSAlert,
  SitterApplication,
  SitterAvailability,
  BookingPet,
} from "@prisma/client"

// Re-export all Prisma types for convenience
export type {
  User,
  PetParent,
  Sitter,
  Pet,
  Booking,
  BookingEvent,
  PhotoUpdate,
  Message,
  Review,
  Payout,
  SOSAlert,
  SitterApplication,
  SitterAvailability,
  BookingPet,
}

export type {
  UserType,
  SitterVettingStatus,
  BookingStatus,
  BookingServiceType,
  CancellationPolicy,
  PayoutStatus,
  PetSpecies,
  ReviewDirection,
  BookingEventType,
} from "@prisma/client"

// ─── Extended / Joined Types ──────────────────────────────────────────────────

/** User with their parent or sitter profile attached */
export type UserWithProfile = User & {
  parent: PetParent | null
  sitter: Sitter | null
}

/** Sitter with their user data — used in search results */
export type SitterWithUser = Sitter & {
  user: User
}

/** Sitter search result — what the search page needs */
export type SitterSearchResult = Sitter & {
  user: Pick<User, "id" | "name" | "profilePhoto">
  distanceKm?: number // Computed server-side
}

/** Booking with all related data for the detail page */
export type BookingDetail = Booking & {
  parent: PetParent & { user: User }
  sitter: Sitter & { user: User }
  pets: Array<BookingPet & { pet: Pet }>
  events: BookingEvent[]
  photoUpdates: PhotoUpdate[]
  messages: Array<Message & { sender: User }>
  reviews: Review[]
  payout: Payout | null
}

/** Pet with parent info */
export type PetWithParent = Pet & {
  parent: PetParent & { user: User }
}

// ─── API Response Types ───────────────────────────────────────────────────────

export type ApiSuccess<T> = {
  data: T
}

export type ApiError = {
  error: string
  code?: string
  details?: Record<string, string[]>
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError

// ─── Auth Types ───────────────────────────────────────────────────────────────

/** Auth state available everywhere via useAuth hook */
export type AuthState = {
  user: UserWithProfile | null
  isLoading: boolean
  isAuthenticated: boolean
}

// ─── Form Types ───────────────────────────────────────────────────────────────

export type SignUpFormData = {
  email: string
}

export type OtpFormData = {
  token: string
}

export type CompleteProfileFormData = {
  name: string
  userType: "PARENT" | "SITTER"
}

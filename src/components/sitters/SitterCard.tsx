import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { money } from "@/lib/money"
import { MapPin, Star, Dog, Cat, PawPrint } from "lucide-react"
import type { Sitter, User } from "@prisma/client"

export type SitterCardData = Sitter & {
  user: Pick<User, "name" | "profilePhoto">
  distanceKm: number | null
}

interface SitterCardProps {
  sitter: SitterCardData
}

export function SitterCard({ sitter }: SitterCardProps) {
  const rates = [sitter.hourlyRate1Hr, sitter.hourlyRate2Hr, sitter.hourlyRate4Hr].filter(
    (r): r is number => r != null && r > 0
  )
  const lowestRate = rates.length > 0 ? Math.min(...rates) : null

  const acceptedPets = [
    sitter.acceptsDogs && "Dogs",
    sitter.acceptsCats && "Cats",
    sitter.acceptsOthers && "Others",
  ].filter(Boolean) as string[]

  return (
    <Link href={`/sitters/${sitter.id}`}>
      <Card className="cursor-pointer hover:shadow-card-hover transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Avatar className="h-14 w-14 shrink-0">
              <AvatarImage
                src={sitter.user.profilePhoto ?? undefined}
                alt={sitter.user.name}
              />
              <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg">
                {sitter.user.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">{sitter.user.name}</p>
                  <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    {sitter.city}
                    {sitter.distanceKm != null && sitter.distanceKm > 0 && (
                      <span> · {sitter.distanceKm} km away</span>
                    )}
                    {sitter.distanceKm == null && sitter.serviceRadiusKm > 0 && (
                      <span> · {sitter.serviceRadiusKm} km radius</span>
                    )}
                  </div>
                </div>
                {lowestRate != null && (
                  <div className="text-right shrink-0">
                    <p className="text-xs text-muted-foreground">from</p>
                    <p className="font-bold text-primary">{money.format(lowestRate)}</p>
                  </div>
                )}
              </div>

              <div className="mt-1.5 flex items-center gap-2">
                {sitter.avgRating ? (
                  <div className="flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 fill-secondary text-secondary" />
                    <span className="text-xs font-medium">{sitter.avgRating.toFixed(1)}</span>
                    <span className="text-xs text-muted-foreground">({sitter.totalReviews})</span>
                  </div>
                ) : (
                  <Badge variant="default" className="text-[10px] px-1.5 py-0">
                    New
                  </Badge>
                )}
                <Badge variant="success" className="text-[10px] px-1.5 py-0">
                  Verified
                </Badge>
              </div>

              {acceptedPets.length > 0 && (
                <div className="mt-1.5 flex items-center gap-1.5">
                  {sitter.acceptsDogs && <Dog className="h-3.5 w-3.5 text-muted-foreground" />}
                  {sitter.acceptsCats && <Cat className="h-3.5 w-3.5 text-muted-foreground" />}
                  {sitter.acceptsOthers && (
                    <PawPrint className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                  <span className="text-xs text-muted-foreground">{acceptedPets.join(", ")}</span>
                </div>
              )}

              {sitter.bio && (
                <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2">{sitter.bio}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

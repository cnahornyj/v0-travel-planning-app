import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MapPin, Calendar, Users } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">Travel Planning App</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">Plan your perfect journey with ease</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <Card>
            <CardHeader>
              <MapPin className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Discover Destinations</CardTitle>
              <CardDescription>Explore amazing places around the world</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">Start Exploring</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Calendar className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Plan Your Trip</CardTitle>
              <CardDescription>Create detailed itineraries for your adventures</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">Create Itinerary</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Users className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Travel Together</CardTitle>
              <CardDescription>Share plans and coordinate with your group</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">Invite Friends</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

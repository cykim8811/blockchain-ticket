import { useNavigate } from "react-router";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { events } from "@/lib/data";
import {
  Calendar,
  MapPin,
  Ticket,
  LogIn,
  LogOut,
  LayoutDashboard,
} from "lucide-react";
import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function EventListView() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  // get all document from 'timed' collection
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "timed"), (snapshot) => {
      if (snapshot.docs.length > 0) {
        setIsOpen(true);
      }
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl mb-4">
              Blockchain Ticketing - 4조
            </h1>
            <p className="text-xl text-muted-foreground">
              Secure your spot on the blockchain
            </p>
          </div>
          <div className="flex gap-4">
            <Button variant="outline" onClick={() => navigate("/admin")}>
              <LayoutDashboard className="mr-2 h-4 w-4" />
              Admin Dashboard
            </Button>
            {user ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => navigate("/my-tickets")}
                >
                  <Ticket className="mr-2 h-4 w-4" />
                  My Tickets
                </Button>
                <Button onClick={logout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
              </>
            ) : (
              <Button onClick={() => navigate("/login")}>
                <LogIn className="mr-2 h-4 w-4" />
                Login
              </Button>
            )}
          </div>
        </header>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <Card
              key={event.id}
              className="overflow-hidden flex flex-col transition-all hover:shadow-lg"
            >
              <div className="aspect-video w-full overflow-hidden">
                <img
                  src={event.image}
                  alt={event.title}
                  className="h-full w-full object-cover transition-transform hover:scale-105"
                />
              </div>
              <CardHeader>
                <CardTitle>{event.title}</CardTitle>
                <CardDescription>{event.location}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <div className="flex items-center text-sm text-muted-foreground mb-2">
                  <Calendar className="mr-2 h-4 w-4" />
                  {event.date}
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <MapPin className="mr-2 h-4 w-4" />
                  {event.location}
                </div>
              </CardContent>
              <CardFooter className="flex justify-between items-center border-t bg-muted/50 p-4">
                <span className="text-lg font-bold text-primary">
                  {event.price}
                </span>
                <Button
                  onClick={() => navigate(`/ticketing/${event.id}`)}
                  disabled={isOpen === 0}
                >
                  Book Ticket
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

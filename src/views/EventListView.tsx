import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { events } from "@/lib/data";
import { useAuth } from "@/contexts/AuthContext";

export default function EventListView() {
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    const handleLogout = async () => {
        try {
            await logout();
            navigate("/login");
        } catch (error) {
            console.error("Failed to logout", error);
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground p-8">
            <header className="mb-12 text-center relative">
                <div className="absolute right-0 top-0 flex gap-2">
                    <Button variant="ghost" onClick={() => navigate("/admin")}>
                        Admin
                    </Button>
                    {user ? (
                        <>
                            <Button variant="outline" onClick={() => navigate("/my-tickets")}>
                                My Tickets
                            </Button>
                            <Button variant="destructive" onClick={handleLogout}>
                                Logout
                            </Button>
                        </>
                    ) : (
                        <Button onClick={() => navigate("/login")}>
                            Login
                        </Button>
                    )}
                </div>
                <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl mb-4 bg-gradient-to-r from-blue-500 to-purple-600 text-transparent bg-clip-text">
                    Upcoming Events
                </h1>
                <p className="text-xl text-muted-foreground">
                    Secure your spot.
                </p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
                {events.map((event) => (
                    <div
                        key={event.id}
                        className="group relative overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-sm transition-all hover:shadow-md hover:scale-[1.02]"
                    >
                        <div className="aspect-video w-full overflow-hidden">
                            <img
                                src={event.image}
                                alt={event.title}
                                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                            />
                        </div>
                        <div className="p-6">
                            <h3 className="text-2xl font-semibold leading-none tracking-tight mb-2">
                                {event.title}
                            </h3>
                            <div className="flex justify-between items-center text-sm text-muted-foreground mb-4">
                                <span>{event.date}</span>
                                <span>{event.location}</span>
                            </div>
                            <div className="flex items-center justify-between mt-4">
                                <span className="text-lg font-bold text-primary">{event.price}</span>
                                <Button
                                    onClick={() => navigate(`/ticket/${event.id}`)}
                                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                                >
                                    Buy Ticket
                                </Button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

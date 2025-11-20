import { useState, useEffect } from "react";
import { collection, query, where, getDocs, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { useNavigate } from "react-router";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, Ticket as TicketIcon, Trash2 } from "lucide-react";

interface Ticket {
    id: string;
    eventId: string;
    eventTitle: string;
    seatNumber: string | null;
    status: 'booked' | 'waiting' | 'cancelled';
    createdAt: any;
    txHash?: string;
    email: string;
}

export default function MyTicketsView() {
    const { user, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authLoading && !user) {
            navigate("/login");
            return;
        }

        const fetchTickets = async () => {
            if (!user) return;

            try {
                const q = query(
                    collection(db, "tickets"),
                    where("userId", "==", user.uid)
                );
                const querySnapshot = await getDocs(q);
                const ticketsData = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as Ticket[];

                // Sort by date descending
                ticketsData.sort((a, b) => b.createdAt.seconds - a.createdAt.seconds);

                setTickets(ticketsData);
            } catch (error) {
                console.error("Error fetching tickets:", error);
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchTickets();
        }
    }, [user, authLoading, navigate]);

    const handleCancelTicket = async (ticketId: string) => {
        if (!window.confirm("Are you sure you want to cancel this ticket? This action cannot be undone.")) {
            return;
        }

        try {
            await deleteDoc(doc(db, "tickets", ticketId));
            setTickets(prev => prev.filter(t => t.id !== ticketId));
            alert("Ticket cancelled successfully.");
        } catch (error) {
            console.error("Error cancelling ticket:", error);
            alert("Failed to cancel ticket.");
        }
    };

    if (authLoading || loading) {
        return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold text-center mb-8">My Tickets</h1>

            {tickets.length === 0 ? (
                <div className="text-center text-muted-foreground">
                    <TicketIcon className="mx-auto h-12 w-12 mb-4" />
                    <p>You don't have any tickets yet.</p>
                    <Button className="mt-4" onClick={() => navigate("/")}>
                        Browse Events
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {tickets.map((ticket) => (
                        <Card key={ticket.id} className="flex flex-col">
                            <CardHeader>
                                <CardTitle>{ticket.eventTitle}</CardTitle>
                                <CardDescription>Ticket ID: {ticket.id}</CardDescription>
                            </CardHeader>
                            <CardContent className="flex-grow">
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Status:</span>
                                        <span className={`font-medium ${ticket.status === 'booked' ? 'text-green-600' : ticket.status === 'waiting' ? 'text-yellow-600' : 'text-red-600'}`}>
                                            {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Email:</span>
                                        <span className="font-medium">{ticket.email}</span>
                                    </div>
                                    {ticket.seatNumber && (
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Seat:</span>
                                            <span className="font-medium">{ticket.seatNumber}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Date:</span>
                                        <span className="font-medium">
                                            {ticket.createdAt?.seconds ? new Date(ticket.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}
                                        </span>
                                    </div>
                                    {ticket.txHash && (
                                        <div className="mt-2 pt-2 border-t">
                                            <span className="text-xs text-muted-foreground block mb-1">Transaction Hash</span>
                                            <code className="text-xs bg-muted p-1 rounded block break-all">
                                                {ticket.txHash}
                                            </code>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    className="w-full"
                                    onClick={() => handleCancelTicket(ticket.id)}
                                >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Cancel Ticket
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}

            <div className="mt-12 text-center">
                <Button variant="outline" onClick={() => navigate("/")}>
                    Back to Events
                </Button>
            </div>
        </div>
    );
}

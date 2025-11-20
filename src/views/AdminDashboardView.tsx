import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { events } from "@/lib/data";
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router";
import { Loader2 } from "lucide-react";

interface Ticket {
    id: string;
    eventId: string;
    status: string;
}

interface EventStats {
    id: number;
    title: string;
    totalSold: number;
    revenue: number;
    price: string;
}

export default function AdminDashboardView() {
    const [stats, setStats] = useState<EventStats[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const querySnapshot = await getDocs(collection(db, "tickets"));
                const tickets: Ticket[] = [];
                querySnapshot.forEach((doc) => {
                    tickets.push({ id: doc.id, ...doc.data() } as Ticket);
                });

                const eventStats = events.map((event) => {
                    const eventTickets = tickets.filter(
                        (t) => t.eventId === event.id.toString() && t.status === "booked"
                    );

                    // Parse price string (e.g., "$150") to number
                    const priceValue = parseInt(event.price.replace(/[^0-9]/g, ""));

                    return {
                        id: event.id,
                        title: event.title,
                        totalSold: eventTickets.length,
                        revenue: eventTickets.length * priceValue,
                        price: event.price
                    };
                });

                setStats(eventStats);
            } catch (error) {
                console.error("Error fetching stats:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    const totalRevenue = stats.reduce((acc, curr) => acc + curr.revenue, 0);
    const totalTicketsSold = stats.reduce((acc, curr) => acc + curr.totalSold, 0);

    return (
        <div className="min-h-screen bg-background p-8">
            <div className="max-w-6xl mx-auto space-y-8">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">
                            Dashboard
                        </h1>
                        <p className="text-muted-foreground mt-2">
                            Overview of ticket sales and revenue
                        </p>
                    </div>
                    <Button onClick={() => navigate("/")} variant="outline">
                        Back to Home
                    </Button>
                </div>

                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">
                                        Total Revenue
                                    </CardTitle>
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        className="h-4 w-4 text-muted-foreground"
                                    >
                                        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                                    </svg>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">${totalRevenue.toLocaleString()}</div>
                                    <p className="text-xs text-muted-foreground">
                                        Total earnings from all events
                                    </p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">
                                        Tickets Sold
                                    </CardTitle>
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        className="h-4 w-4 text-muted-foreground"
                                    >
                                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                                        <circle cx="9" cy="7" r="4" />
                                        <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                                    </svg>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{totalTicketsSold}</div>
                                    <p className="text-xs text-muted-foreground">
                                        Confirmed bookings across all events
                                    </p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">
                                        Active Events
                                    </CardTitle>
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        className="h-4 w-4 text-muted-foreground"
                                    >
                                        <rect width="20" height="14" x="2" y="5" rx="2" />
                                        <path d="M2 10h20" />
                                    </svg>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{events.length}</div>
                                    <p className="text-xs text-muted-foreground">
                                        Currently listed events
                                    </p>
                                </CardContent>
                            </Card>
                        </div>

                        <Card>
                            <CardHeader>
                                <CardTitle>Event Performance</CardTitle>
                                <CardDescription>
                                    Detailed breakdown of ticket sales by event.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableCaption>A list of your recent ticket sales.</TableCaption>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[300px]">Event Name</TableHead>
                                            <TableHead>Price</TableHead>
                                            <TableHead className="text-right">Sold</TableHead>
                                            <TableHead className="text-right">Revenue</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {stats.map((stat) => (
                                            <TableRow key={stat.id}>
                                                <TableCell className="font-medium">{stat.title}</TableCell>
                                                <TableCell>{stat.price}</TableCell>
                                                <TableCell className="text-right">{stat.totalSold}</TableCell>
                                                <TableCell className="text-right">
                                                    ${stat.revenue.toLocaleString()}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </>
                )}
            </div>
        </div>
    );
}

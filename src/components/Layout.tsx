import { useState, useEffect } from "react";
import { useNavigate, Outlet } from "react-router";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { events } from "@/lib/data";
import { BellRing } from "lucide-react";
import { collection, query, where, onSnapshot, orderBy, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

export default function Layout() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [waitlistNotification, setWaitlistNotification] = useState<{ eventId: number, title: string } | null>(null);

    useEffect(() => {
        if (!user) return;

        // Listen for user's waiting tickets
        const q = query(
            collection(db, "tickets"),
            where("userId", "==", user.uid),
            where("status", "==", "waiting")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            snapshot.docs.forEach(async (userTicketDoc) => {
                const userTicket = userTicketDoc.data();
                const eventId = userTicket.eventId;
                const event = events.find(e => e.id === Number(eventId));
                if (!event) return;

                // Check event status
                // 1. Get total booked count
                const bookedQuery = query(
                    collection(db, "tickets"),
                    where("eventId", "==", String(eventId)),
                    where("status", "==", "booked")
                );

                // 2. Get all waiting tickets to find rank
                const waitingQuery = query(
                    collection(db, "tickets"),
                    where("eventId", "==", String(eventId)),
                    where("status", "==", "waiting"),
                    orderBy("createdAt", "asc")
                );

                onSnapshot(bookedQuery, async (bookedSnap) => {
                    const bookedCount = bookedSnap.size;
                    const availableSeats = (event.totalSeats || 40) - bookedCount;

                    if (availableSeats > 0) {
                        // Check rank
                        const waitingSnap = await getDocs(waitingQuery);
                        const waitingDocs = waitingSnap.docs;
                        const myIndex = waitingDocs.findIndex(d => d.id === userTicketDoc.id);

                        if (myIndex !== -1 && myIndex < availableSeats) {
                            setWaitlistNotification({
                                eventId: Number(eventId),
                                title: event.title
                            });
                        }
                    }
                });
            });
        });

        return () => unsubscribe();
    }, [user]);

    return (
        <>
            <Outlet />
            <Dialog open={!!waitlistNotification} onOpenChange={(open: boolean) => !open && setWaitlistNotification(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <BellRing className="h-5 w-5 text-primary" />
                            Good News!
                        </DialogTitle>
                        <DialogDescription>
                            A seat has become available for <strong>{waitlistNotification?.title}</strong> and you are next in line!
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setWaitlistNotification(null)}>
                            Later
                        </Button>
                        <Button onClick={() => {
                            if (waitlistNotification) {
                                navigate(`/ticketing/${waitlistNotification.eventId}`);
                                setWaitlistNotification(null);
                            }
                        }}>
                            Go to Seat Selection
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

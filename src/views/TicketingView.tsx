
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { collection, addDoc, query, where, getDocs, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { events } from "@/lib/data";
import { Loader2, Armchair, BellRing, Info } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

// Mock seat data generator - Now starts all available
const generateSeats = () => {
    const rows = ['A', 'B', 'C', 'D', 'E'];
    const cols = 8;
    const seats = [];
    for (const row of rows) {
        for (let i = 1; i <= cols; i++) {
            seats.push({
                id: `${row}${i} `,
                row,
                number: i,
                status: 'available'
            });
        }
    }
    return seats;
};

export default function TicketingView() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, loading: authLoading } = useAuth();

    const [step, setStep] = useState(1); // 1: Details, 2: Seats, 3: Confirmation
    const [loading, setLoading] = useState(false);
    const [processingStatus, setProcessingStatus] = useState<'idle' | 'sending' | 'confirming' | 'booking'>('idle');
    const [isLoaded, setIsLoaded] = useState(false);
    const [seats, setSeats] = useState(generateSeats());
    const [selectedSeat, setSelectedSeat] = useState<string | null>(null);
    const [bookedCount, setBookedCount] = useState(0);
    const [hasWaiters, setHasWaiters] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
    });

    const event = events.find(e => e.id === Number(id));
    const totalSeats = event?.totalSeats || 40;

    // Check if user is eligible to book despite being full (i.e., it's their turn)
    const [isEligible, setIsEligible] = useState(false);
    const [waitlistPosition, setWaitlistPosition] = useState<number | null>(null);
    // isFull now means "Waitlist Mode": either physically full OR there's a queue I'm not at the front of
    const isFull = (bookedCount >= totalSeats || hasWaiters) && !isEligible;

    useEffect(() => {
        setIsLoaded(true);

        if (!id) return;

        // Real-time listener for bookings
        const q = query(
            collection(db, "tickets"),
            where("eventId", "==", id),
            where("status", "in", ["booked", "waiting"])
        );

        const unsubscribe = onSnapshot(q, async (snapshot) => {
            // Calculate booked count (only 'booked' status counts towards capacity)
            const bookedDocs = snapshot.docs.filter(doc => doc.data().status === 'booked');
            const currentBookedCount = bookedDocs.length;
            setBookedCount(currentBookedCount);

            // Get waiting docs
            const waitingDocs = snapshot.docs
                .filter(doc => doc.data().status === 'waiting')
                .sort((a, b) => a.data().createdAt.seconds - b.data().createdAt.seconds);

            setHasWaiters(waitingDocs.length > 0);

            // Update seat map based on real bookings
            const bookedSeatNumbers = new Set(bookedDocs.map(doc => doc.data().seatNumber));

            setSeats(prevSeats => prevSeats.map(seat => ({
                ...seat,
                status: bookedSeatNumbers.has(seat.id) ? 'booked' : 'available'
            })));

            // Check eligibility if user is logged in
            if (user) {
                const availableSeats = totalSeats - currentBookedCount;

                // Find user's waiting ticket
                const myWaitingTicket = snapshot.docs.find(
                    doc => doc.data().userId === user.uid && doc.data().status === 'waiting'
                );

                if (myWaitingTicket) {
                    // Calculate rank
                    const myIndex = waitingDocs.findIndex(doc => doc.id === myWaitingTicket.id);
                    setWaitlistPosition(myIndex + 1);

                    if (availableSeats > 0 && myIndex !== -1 && myIndex < availableSeats) {
                        setIsEligible(true);
                    } else {
                        setIsEligible(false);
                    }
                } else {
                    setWaitlistPosition(null);
                    // If user has no waiting ticket
                    // If there are waiters, new users must join the back of the line (not eligible)
                    if (waitingDocs.length > 0) {
                        setIsEligible(false);
                    } else {
                        // No waiters, open seats -> Eligible
                        setIsEligible(true);
                    }
                }
            }
        });

        return () => unsubscribe();
    }, [id, user, totalSeats]);

    useEffect(() => {
        if (!authLoading && !user) {
            navigate("/login");
        } else if (user) {
            setFormData(prev => ({
                ...prev,
                email: user.email || "",
                name: user.displayName || prev.name
            }));
        }
    }, [user, authLoading, navigate]);

    if (authLoading) {
        return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;
    }

    if (!event) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background p-4">
                <Card className="w-full max-w-md text-center">
                    <CardHeader>
                        <CardTitle className="text-destructive">Event Not Found</CardTitle>
                        <CardDescription>The event you are looking for does not exist.</CardDescription>
                    </CardHeader>
                    <CardFooter className="justify-center">
                        <Button onClick={() => navigate("/")}>Return to Home</Button>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    const handleNext = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (step === 1) {
            if (formData.name && formData.email) {
                // If full, skip seat selection and go to confirmation (Waitlist)
                if (isFull) {
                    setStep(3);
                } else {
                    setStep(2);
                }
            }
        } else if (step === 2) {
            if (selectedSeat) {
                setStep(3);
            }
        }
    };

    const handleSubmit = async () => {
        if (!selectedSeat && !isFull) return;
        setLoading(true);

        try {
            // Simulate Blockchain Transaction
            setProcessingStatus('sending');
            await new Promise(resolve => setTimeout(resolve, 2000)); // 2s delay

            setProcessingStatus('confirming');
            await new Promise(resolve => setTimeout(resolve, 2000)); // 2s delay

            setProcessingStatus('booking');

            // Actual Database Write
            await addDoc(collection(db, "tickets"), {
                eventId: id,
                eventTitle: event.title,
                userId: user?.uid,
                ...formData,
                seatNumber: isFull ? null : selectedSeat,
                createdAt: new Date(),
                status: isFull ? "waiting" : "booked",
                txHash: "0x" + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('') // Fake TX Hash
            });

            alert(isFull ? "Added to Waitlist successfully!" : "Ticket booked successfully!");
            navigate("/my-tickets");
        } catch (error) {
            console.error("Error adding document: ", error);
            alert("Failed to reserve ticket. Please try again.");
        } finally {
            setLoading(false);
            setProcessingStatus('idle');
        }
    };

    const getStepTitle = () => {
        switch (step) {
            case 1: return "Enter Details";
            case 2: return "Select Seat";
            case 3: return isFull ? "Confirm Waitlist" : "Confirm Booking";
            default: return "";
        }
    };

    const getStepDescription = () => {
        switch (step) {
            case 1: return "Enter your details to proceed";
            case 2: return "Choose your preferred seat";
            case 3: return isFull ? "Join the waitlist for this event" : "Review your booking details";
            default: return "";
        }
    };

    const getButtonText = () => {
        switch (processingStatus) {
            case 'sending': return "Sending Transaction to ETC...";
            case 'confirming': return "Confirming Transaction...";
            case 'booking': return isFull ? "Joining Waitlist..." : "Finalizing Booking...";
            default: return isFull ? "Join Waitlist" : "Confirm & Pay";
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 md:p-8 relative overflow-hidden">
            {/* Blurred Background */}
            <div
                className={`absolute inset - 0 z - [-1] bg - cover bg - center transition - all duration - 1000 ease - out ${isLoaded ? 'opacity-100 scale-110' : 'opacity-0 scale-100'} `}
                style={{
                    backgroundImage: `url(${event.image})`,
                    filter: 'blur(20px) brightness(0.4)',
                }}
            />

            <Card className="w-full max-w-2xl shadow-2xl bg-background/95 backdrop-blur-sm border-white/10">
                <CardHeader className="space-y-1 text-center">
                    <CardTitle className="text-2xl font-bold">
                        {getStepTitle()}
                    </CardTitle>
                    <CardDescription>
                        {getStepDescription()}
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    {/* Event Summary Section - Always Visible */}
                    <div className="mb-6 rounded-lg border bg-muted/50 p-4">
                        <div className="flex flex-col space-y-2">
                            <h3 className="font-semibold text-lg text-foreground">{event.title}</h3>
                            <div className="flex justify-between text-sm text-muted-foreground">
                                <span>Date</span>
                                <span className="font-medium text-foreground">{event.date}</span>
                            </div>
                            <div className="flex justify-between text-sm text-muted-foreground">
                                <span>Location</span>
                                <span className="font-medium text-foreground">{event.location}</span>
                            </div>
                            <div className="flex justify-between text-sm text-muted-foreground">
                                <span>Capacity</span>
                                <span className={`font-medium ${isFull ? 'text-destructive' : 'text-green-600'}`}>
                                    {bookedCount} / {totalSeats} Filled
                                </span>
                            </div>

                            {/* Waitlist Status Banner */}
                            {waitlistPosition !== null && (
                                <div className={`mt-4 p-3 rounded-md text-sm font-medium flex items-center animate-pulse ${isEligible
                                    ? 'bg-green-100 border border-green-200 text-green-800'
                                    : 'bg-blue-100 border border-blue-200 text-blue-800'
                                    }`}>
                                    {isEligible ? (
                                        <>
                                            <BellRing className="w-4 h-4 mr-2" />
                                            You are #{waitlistPosition} in line! It's your turn to book.
                                        </>
                                    ) : (
                                        <>
                                            <Info className="w-4 h-4 mr-2" />
                                            You are currently #{waitlistPosition} in the waitlist.
                                        </>
                                    )}
                                </div>
                            )}

                            {/* Generic Eligibility Banner (for non-waitlisters who got a spot) */}
                            {isEligible && waitlistPosition === null && bookedCount >= totalSeats && (
                                <div className="mt-4 p-3 bg-green-100 border border-green-200 text-green-800 rounded-md text-sm font-medium flex items-center animate-pulse">
                                    <BellRing className="w-4 h-4 mr-2" />
                                    A spot is open! You can now select a seat.
                                </div>
                            )}

                            {selectedSeat && step > 2 && !isFull && (
                                <div className="flex justify-between text-sm text-primary font-medium">
                                    <span>Selected Seat</span>
                                    <span>{selectedSeat}</span>
                                </div>
                            )}
                            <div className="mt-2 flex justify-between border-t pt-2">
                                <span className="font-semibold">Total Price</span>
                                <span className="font-bold text-primary text-lg">{event.price}</span>
                            </div>
                        </div>
                    </div>

                    {step === 1 && (
                        <form onSubmit={handleNext} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Full Name</Label>
                                <Input
                                    id="name"
                                    placeholder="Enter your full name"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="bg-background"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email Address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="Enter your email"
                                    required
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="bg-background"
                                />
                            </div>

                            <div className="pt-4 grid grid-cols-2 gap-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => navigate("/")}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit">
                                    {isFull ? "Next: Join Waitlist" : "Next: Select Seat"}
                                </Button>
                            </div>
                        </form>
                    )}

                    {step === 2 && !isFull && (
                        <div className="space-y-6">
                            <div className="flex justify-center gap-4 mb-4 text-sm">
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 bg-primary rounded" />
                                    <span>Selected</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 border border-input rounded" />
                                    <span>Available</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 bg-muted rounded" />
                                    <span>Booked</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-8 gap-2 max-w-md mx-auto">
                                {seats.map((seat) => (
                                    <button
                                        key={seat.id}
                                        disabled={seat.status === 'booked'}
                                        onClick={() => setSelectedSeat(seat.id)}
                                        className={`p-2 rounded-md flex items-center justify-center transition-colors
                                            ${seat.status === 'booked'
                                                ? 'bg-neutral-300 text-muted-foreground cursor-not-allowed'
                                                : selectedSeat === seat.id
                                                    ? 'bg-primary text-primary-foreground'
                                                    : 'border border-input hover:bg-accent hover:text-accent-foreground'
                                            }
`}
                                        title={`Seat ${seat.id} `}
                                    >
                                        <Armchair className="w-4 h-4" />
                                    </button>
                                ))}
                            </div>

                            <div className="text-center text-sm text-muted-foreground mt-2">
                                Screen
                                <div className="w-full h-1 bg-muted mt-1 rounded-full" />
                            </div>

                            <div className="pt-4 grid grid-cols-2 gap-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setStep(1)}
                                    disabled={loading}
                                >
                                    Back
                                </Button>
                                <Button
                                    onClick={() => handleNext()}
                                    disabled={loading || !selectedSeat}
                                >
                                    Next: Review Booking
                                </Button>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-6">
                            <div className="rounded-lg border p-4 space-y-4">
                                <h3 className="font-semibold">{isFull ? "Waitlist Details" : "Booking Details"}</h3>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="text-muted-foreground block">Name</span>
                                        <span className="font-medium">{formData.name}</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground block">Email</span>
                                        <span className="font-medium">{formData.email}</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground block">Status</span>
                                        <span className={`font - medium ${isFull ? 'text-yellow-600' : 'text-green-600'} `}>
                                            {isFull ? "Waitlist" : "Booking"}
                                        </span>
                                    </div>
                                    {!isFull && (
                                        <div>
                                            <span className="text-muted-foreground block">Seat</span>
                                            <span className="font-medium text-primary">{selectedSeat}</span>
                                        </div>
                                    )}
                                </div>
                                {isFull && (
                                    <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded text-sm text-yellow-800 dark:text-yellow-200">
                                        The event is currently full. You will be added to the waitlist.
                                    </div>
                                )}
                            </div>

                            <div className="pt-4 grid grid-cols-2 gap-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setStep(isFull ? 1 : 2)}
                                    disabled={loading || processingStatus !== 'idle'}
                                >
                                    Back
                                </Button>
                                <Button
                                    onClick={handleSubmit}
                                    disabled={loading || processingStatus !== 'idle'}
                                    className="min-w-[180px]"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            {getButtonText()}
                                        </>
                                    ) : (
                                        getButtonText()
                                    )}
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

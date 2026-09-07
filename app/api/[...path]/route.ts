import { NextResponse } from "next/server";

interface Venue {
  id: number;
  name: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
}

interface AdminEvent {
  id: number;
  type: "workshops" | "lectures" | "competitions" | "general";
  heading: string;
  description: string | null;
  picture: string | null;
  datetime: string | null;
  startTime: string | null;
  endTime: string | null;
  price: number;
  capacity: number | null;
  isFull: boolean;
  isTeamEvent: boolean;
  teamSize: number | null;
  published: boolean;
  venue: { id: number; name: string; address: string | null } | null;
  createdAt: string;
  updatedAt: string;
  catchyPara?: string | null;
  committee?: string | null;
  ticketId?: number | null;
}

interface Announcement {
  id: number;
  title: string;
  content: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AdminUser {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  college: string | null;
  district: string | null;
  referral: string;
  role: "USER" | "ADMIN";
  picture?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Booking {
  bookingUid: string;
  kind: "EVENT" | "ACCOMMODATION";
  status: "PENDING" | "CONFIRMED" | "FAILED" | "CANCELLED" | "TIMEOUT";
  qty: number;
  amountSubtotal: number;
  amountFee: number;
  amountTax: number;
  amountTotal: number;
  currency: string;
  user: { id: number; name: string; email: string };
  event: { id: number; heading: string; type: "workshops" | "lectures" | "competitions" | "general" } | null;
  accommodation: unknown;
  createdAt: string;
  updatedAt: string;
}

const mockVenues: Venue[] = [
  { id: 1, name: "Main Auditorium", address: "Central Block, NIT Calicut", latitude: 11.3216, longitude: 75.9337 },
  { id: 2, name: "MB 102", address: "Main Building, Ground Floor", latitude: 11.322, longitude: 75.934 },
  { id: 3, name: "Open Air Theatre (OAT)", address: "Near Student Amenities Centre", latitude: 11.321, longitude: 75.933 },
  { id: 4, name: "ELHC Hall A", address: "Electrical Department Complex", latitude: 11.3225, longitude: 75.935 }
];

let mockEvents: AdminEvent[] = [
  {
    id: 1,
    type: "workshops",
    heading: "AI & Machine Learning Workshop",
    description: "Hands-on workshop covering deep learning fundamentals and neural networks.",
    catchyPara: "Master AI in 2 days!",
    picture: "https://images.unsplash.com/photo-1518770660439-4636190af475",
    datetime: "2026-10-15T09:30:00.000Z",
    startTime: "2026-10-15T09:30:00.000Z",
    endTime: "2026-10-15T17:00:00.000Z",
    price: 49900,
    capacity: 100,
    isFull: false,
    isTeamEvent: false,
    teamSize: null,
    published: true,
    venue: { id: 1, name: "Main Auditorium", address: "Central Block, NIT Calicut" },
    createdAt: "2026-09-01T10:00:00.000Z",
    updatedAt: "2026-09-05T12:00:00.000Z",
    committee: "Computer Science Association",
    ticketId: 101
  },
  {
    id: 2,
    type: "competitions",
    heading: "RoboWars 2026",
    description: "Combat robotics championship. Build combat robots to battle in the arena.",
    catchyPara: "May the best bot win!",
    picture: null,
    datetime: "2026-10-16T10:00:00.000Z",
    startTime: "2026-10-16T10:00:00.000Z",
    endTime: "2026-10-16T18:00:00.000Z",
    price: 100000,
    capacity: 32,
    isFull: false,
    isTeamEvent: true,
    teamSize: 4,
    published: true,
    venue: { id: 3, name: "Open Air Theatre (OAT)", address: "Near Student Amenities Centre" },
    createdAt: "2026-09-02T11:00:00.000Z",
    updatedAt: "2026-09-06T14:00:00.000Z",
    committee: "Robotics Club",
    ticketId: 102
  },
  {
    id: 3,
    type: "lectures",
    heading: "Keynote: Quantum Computing",
    description: "Lecture on quantum supremacy and physical qubit architectures.",
    catchyPara: "Future of physics and computation",
    picture: null,
    datetime: "2026-10-17T11:00:00.000Z",
    startTime: "2026-10-17T11:00:00.000Z",
    endTime: "2026-10-17T13:00:00.000Z",
    price: 0,
    capacity: 250,
    isFull: false,
    isTeamEvent: false,
    teamSize: null,
    published: true,
    venue: { id: 1, name: "Main Auditorium", address: "Central Block, NIT Calicut" },
    createdAt: "2026-09-03T09:00:00.000Z",
    updatedAt: "2026-09-03T09:00:00.000Z",
    committee: "Physics Society",
    ticketId: null
  },
  {
    id: 4,
    type: "competitions",
    heading: "HackTathva 24hr Hackathon",
    description: "Build innovative software solutions for real-world problems in 24 hours.",
    catchyPara: "Code, Create, Conquer!",
    picture: null,
    datetime: "2026-10-16T12:00:00.000Z",
    startTime: "2026-10-16T12:00:00.000Z",
    endTime: "2026-10-17T12:00:00.000Z",
    price: 25000,
    capacity: 50,
    isFull: true,
    isTeamEvent: true,
    teamSize: 3,
    published: true,
    venue: { id: 2, name: "MB 102", address: "Main Building, Ground Floor" },
    createdAt: "2026-09-04T15:00:00.000Z",
    updatedAt: "2026-09-07T08:00:00.000Z",
    committee: "Club Dev",
    ticketId: 104
  },
  {
    id: 5,
    type: "general",
    heading: "Tathva '26 Inauguration Ceremony",
    description: "Grand opening of Tathva '26 techfest.",
    catchyPara: "The mega fest begins",
    picture: null,
    datetime: "2026-10-15T08:00:00.000Z",
    startTime: "2026-10-15T08:00:00.000Z",
    endTime: "2026-10-15T09:30:00.000Z",
    price: 0,
    capacity: 1000,
    isFull: false,
    isTeamEvent: false,
    teamSize: null,
    published: false,
    venue: null,
    createdAt: "2026-09-05T16:00:00.000Z",
    updatedAt: "2026-09-05T16:00:00.000Z",
    committee: "Executive Committee",
    ticketId: null
  },
  {
    id: 6,
    type: "workshops",
    heading: "Embedded Systems & IoT Workshop",
    description: "Learn microcontroller programming and sensor integration.",
    catchyPara: "Connect the physical world to code",
    picture: null,
    datetime: "2026-10-17T09:00:00.000Z",
    startTime: "2026-10-17T09:00:00.000Z",
    endTime: "2026-10-17T16:00:00.000Z",
    price: 35000,
    capacity: 60,
    isFull: false,
    isTeamEvent: false,
    teamSize: null,
    published: true,
    venue: { id: 4, name: "ELHC Hall A", address: "Electrical Department Complex" },
    createdAt: "2026-09-06T11:00:00.000Z",
    updatedAt: "2026-09-06T11:00:00.000Z",
    committee: "IEEE Student Branch",
    ticketId: 106
  },
  {
    id: 7,
    type: "competitions",
    heading: "CodeStorm Competitive Programming",
    description: "Algorithmic problem solving competition.",
    catchyPara: "Race against time and complexity",
    picture: null,
    datetime: "2026-10-17T14:00:00.000Z",
    startTime: null,
    endTime: "2026-10-17T17:00:00.000Z",
    price: 15000,
    capacity: 120,
    isFull: false,
    isTeamEvent: true,
    teamSize: 1,
    published: true,
    venue: { id: 2, name: "MB 102", address: "Main Building, Ground Floor" },
    createdAt: "2026-09-07T10:00:00.000Z",
    updatedAt: "2026-09-07T10:00:00.000Z",
    committee: "Computer Science Association",
    ticketId: 107
  },
  {
    id: 8,
    type: "lectures",
    heading: "Web3 & Decentralized Systems",
    description: "Understanding blockchain, smart contracts, and Web3 ecosystem.",
    catchyPara: "Decentralize the future",
    picture: null,
    datetime: "2026-09-01T10:00:00.000Z",
    startTime: "2026-09-01T10:00:00.000Z",
    endTime: "2026-09-01T12:00:00.000Z",
    price: 0,
    capacity: 150,
    isFull: false,
    isTeamEvent: false,
    teamSize: null,
    published: false,
    venue: { id: 1, name: "Main Auditorium", address: "Central Block, NIT Calicut" },
    createdAt: "2026-08-20T10:00:00.000Z",
    updatedAt: "2026-08-20T10:00:00.000Z",
    committee: "FOSS Cell",
    ticketId: null
  }
];

const mockAnnouncements: Announcement[] = [
  {
    id: 1,
    title: "Registrations Open for Tathva '26",
    content: "Early bird registrations are now live for all workshops and flagship events.",
    published: true,
    createdAt: "2026-09-01T08:00:00.000Z",
    updatedAt: "2026-09-01T08:00:00.000Z"
  },
  {
    id: 2,
    title: "RoboWars Arena Specifications Released",
    content: "Check out the detailed dimensions and safety rules for RoboWars 2026.",
    published: true,
    createdAt: "2026-09-03T10:00:00.000Z",
    updatedAt: "2026-09-03T10:00:00.000Z"
  },
  {
    id: 3,
    title: "Draft: Accommodation Guidelines",
    content: "Draft guidelines for outstation participant stays.",
    published: false,
    createdAt: "2026-09-06T14:00:00.000Z",
    updatedAt: "2026-09-06T14:00:00.000Z"
  }
];

const mockUsers: AdminUser[] = [
  {
    id: 1,
    name: "tathvahead",
    email: "tathva@head.com",
    phone: "+91 9876543210",
    college: "NIT Calicut",
    district: "Koszhikode",
    referral: "REF101",
    role: "ADMIN",
    picture: null,
    createdAt: "2026-08-15T10:00:00.000Z",
    updatedAt: "2026-08-15T10:00:00.000Z"
  },
  {
    id: 2,
    name: "Priya Sharma",
    email: "priya@example.com",
    phone: "+91 9876543211",
    college: "IIT Madras",
    district: "Chennai",
    referral: "REF102",
    role: "USER",
    picture: null,
    createdAt: "2026-09-02T12:00:00.000Z",
    updatedAt: "2026-09-02T12:00:00.000Z"
  }
];

const mockBookings: Booking[] = [
  {
    bookingUid: "BK-2026-001",
    kind: "EVENT",
    status: "CONFIRMED",
    qty: 1,
    amountSubtotal: 49900,
    amountFee: 1000,
    amountTax: 900,
    amountTotal: 51800,
    currency: "INR",
    user: { id: 2, name: "Priya Sharma", email: "priya@example.com" },
    event: { id: 1, heading: "AI & Machine Learning Workshop", type: "workshops" },
    accommodation: null,
    createdAt: "2026-09-05T14:30:00.000Z",
    updatedAt: "2026-09-05T14:30:00.000Z"
  }
];

export async function GET(
  request: Request,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params;
  const url = new URL(request.url);

  if (path[0] === "auth" && path[1] === "google") {
    return NextResponse.redirect(
      new URL("/auth/callback?token=mock-admin-jwt-token", request.url)
    );
  }

  if (path[0] === "admin") {
    if (path[1] === "me") {
      const authHeader = request.headers.get("authorization");
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return NextResponse.json(
          { message: "Authentication required", code: "AUTH_REQUIRED" },
          { status: 401 }
        );
      }

      return NextResponse.json({
        user: {
          id: 1,
          name: "tathvahead",
          email: "tathva@head.com",
          phone: "+91 9876543210",
          college: "NIT Calicut",
          district: "Kozhikode",
          referral: "REF101",
          role: "ADMIN",
          picture: null,
          createdAt: "2026-08-15T10:00:00.000Z",
          updatedAt: "2026-08-15T10:00:00.000Z"
        }
      });
    }

    if (path[1] === "dashboard") {
      return NextResponse.json({
        events: {
          total: mockEvents.length,
          published: mockEvents.filter((e) => e.published).length,
          drafts: mockEvents.filter((e) => !e.published).length
        },
        announcements: {
          total: mockAnnouncements.length,
          published: mockAnnouncements.filter((a) => a.published).length
        },
        users: mockUsers.length,
        bookings: {
          total: mockBookings.length,
          pending: mockBookings.filter((b) => b.status === "PENDING").length,
          confirmed: mockBookings.filter((b) => b.status === "CONFIRMED").length,
          failed: mockBookings.filter((b) => b.status === "FAILED").length
        },
        contactMessages: { new: 2 }
      });
    }

    if (path[1] === "events") {
      if (path.length === 2) {
        let filtered = [...mockEvents];
        const search = url.searchParams.get("search");
        const type = url.searchParams.get("type");
        const publishedStr = url.searchParams.get("published");

        if (search) {
          const q = search.toLowerCase();
          filtered = filtered.filter(
            (e) =>
              e.heading.toLowerCase().includes(q) ||
              (e.description && e.description.toLowerCase().includes(q)) ||
              (e.committee && e.committee.toLowerCase().includes(q))
          );
        }
        if (type) {
          filtered = filtered.filter((e) => e.type === type);
        }
        if (publishedStr !== null && publishedStr !== undefined && publishedStr !== "") {
          const isPub = publishedStr === "true";
          filtered = filtered.filter((e) => e.published === isPub);
        }

        const page = parseInt(url.searchParams.get("page") || "1", 10);
        const pageSize = parseInt(url.searchParams.get("pageSize") || "20", 10);
        const total = filtered.length;
        const start = (page - 1) * pageSize;
        const items = filtered.slice(start, start + pageSize);

        return NextResponse.json({ items, page, pageSize, total });
      }

      if (path.length === 3) {
        const id = parseInt(path[2], 10);
        const event = mockEvents.find((e) => e.id === id);
        if (!event) {
          return NextResponse.json(
            { message: "Event not found", code: "NOT_FOUND" },
            { status: 404 }
          );
        }
        return NextResponse.json({ event });
      }
    }

    if (path[1] === "venues") {
      return NextResponse.json({
        items: mockVenues,
        page: 1,
        pageSize: 50,
        total: mockVenues.length
      });
    }

    if (path[1] === "announcements") {
      return NextResponse.json({
        items: mockAnnouncements,
        page: 1,
        pageSize: 50,
        total: mockAnnouncements.length
      });
    }

    if (path[1] === "users") {
      return NextResponse.json({
        items: mockUsers,
        page: 1,
        pageSize: 50,
        total: mockUsers.length
      });
    }

    if (path[1] === "bookings") {
      return NextResponse.json({
        items: mockBookings,
        page: 1,
        pageSize: 50,
        total: mockBookings.length
      });
    }
  }

  return NextResponse.json(
    { message: "Route not found", code: "NOT_FOUND" },
    { status: 404 }
  );
}

export async function POST(
  request: Request,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params;

  if (path[0] === "admin" && path[1] === "events") {
    if (path.length === 2) {
      const body = await request.json();
      const id =
        mockEvents.length > 0
          ? Math.max(...mockEvents.map((e) => e.id)) + 1
          : 1;
      const now = new Date().toISOString();

      let venueObj = null;
      if (body.venueId) {
        const v = mockVenues.find((v) => v.id === body.venueId);
        if (v) {
          venueObj = { id: v.id, name: v.name, address: v.address };
        }
      }

      const newEvent: AdminEvent = {
        id,
        type: body.type || "general",
        heading: body.heading || "",
        description: body.description || null,
        catchyPara: body.catchyPara || null,
        picture: body.picture || null,
        datetime: body.datetime || null,
        startTime: body.startTime || null,
        endTime: body.endTime || null,
        price: body.price ?? 0,
        ticketId: body.ticketId || null,
        venue: venueObj,
        committee: body.committee || null,
        isTeamEvent: !!body.isTeamEvent,
        teamSize: body.teamSize || null,
        capacity: body.capacity || null,
        published: !!body.published,
        isFull: false,
        createdAt: now,
        updatedAt: now
      };
      mockEvents.unshift(newEvent);
      return NextResponse.json({ event: newEvent }, { status: 201 });
    }

    if (path.length === 4 && path[3] === "publish") {
      const id = parseInt(path[2], 10);
      const index = mockEvents.findIndex((e) => e.id === id);
      if (index === -1) {
        return NextResponse.json(
          { message: "Event not found", code: "NOT_FOUND" },
          { status: 404 }
        );
      }
      mockEvents[index] = {
        ...mockEvents[index],
        published: true,
        updatedAt: new Date().toISOString()
      };
      return NextResponse.json({ event: mockEvents[index] });
    }

    if (path.length === 4 && path[3] === "unpublish") {
      const id = parseInt(path[2], 10);
      const index = mockEvents.findIndex((e) => e.id === id);
      if (index === -1) {
        return NextResponse.json(
          { message: "Event not found", code: "NOT_FOUND" },
          { status: 404 }
        );
      }
      mockEvents[index] = {
        ...mockEvents[index],
        published: false,
        updatedAt: new Date().toISOString()
      };
      return NextResponse.json({ event: mockEvents[index] });
    }
  }

  return NextResponse.json(
    { message: "Route not found", code: "NOT_FOUND" },
    { status: 404 }
  );
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params;

  if (path[0] === "admin" && path[1] === "events" && path.length === 3) {
    const id = parseInt(path[2], 10);
    const index = mockEvents.findIndex((e) => e.id === id);
    if (index === -1) {
      return NextResponse.json(
        { message: "Event not found", code: "NOT_FOUND" },
        { status: 404 }
      );
    }
    const body = await request.json();
    const current = mockEvents[index];
    let venueObj = current.venue;
    if (body.venueId !== undefined) {
      if (body.venueId === null) {
        venueObj = null;
      } else {
        const v = mockVenues.find((v) => v.id === body.venueId);
        if (v) venueObj = { id: v.id, name: v.name, address: v.address };
      }
    }

    const updated: AdminEvent = {
      ...current,
      ...body,
      venue: venueObj,
      updatedAt: new Date().toISOString()
    };
    delete (updated as unknown as Record<string, unknown>).venueId;
    mockEvents[index] = updated;
    return NextResponse.json({ event: updated });
  }

  return NextResponse.json(
    { message: "Route not found", code: "NOT_FOUND" },
    { status: 404 }
  );
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params;

  if (path[0] === "admin" && path[1] === "events" && path.length === 3) {
    const id = parseInt(path[2], 10);
    mockEvents = mockEvents.filter((e) => e.id !== id);
    return new NextResponse(null, { status: 204 });
  }

  return NextResponse.json(
    { message: "Route not found", code: "NOT_FOUND" },
    { status: 404 }
  );
}

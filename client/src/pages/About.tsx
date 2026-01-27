import { Navigation } from "@/components/Navigation";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-10 max-w-3xl">
        <h1 className="font-display text-3xl font-bold mb-8">About Glamap</h1>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
          <h1 className="text-2xl font-bold mb-2">Glamap - Location-Based Beauty Services Platform</h1>
          <p className="text-muted-foreground font-medium mb-6">Personal Project | Full-Stack Web Application | January 2026</p>

          <h2 className="text-xl font-bold mt-8 mb-4">Project Overview</h2>
          <p>
            Glamap is a location-based web application connecting freelance beauty service providers with clients across Australia. Built as a personal project to demonstrate full-stack development skills, it addresses the visibility challenges faced by freelance beauty professionals while providing clients with an intuitive platform to discover nearby, trustworthy providers.
          </p>

          <h2 className="text-xl font-bold mt-8 mb-4">Key Features Implemented</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Interactive Map Discovery:</strong> Leaflet.js-powered map with custom pink pins displaying 160+ Sydney suburbs and provider locations</li>
            <li><strong>Advanced Search & Filtering:</strong> Directory with location-based search by suburb, postcode, and service type</li>
            <li><strong>Provider Profiles:</strong> Comprehensive profiles showcasing services, pricing, ratings, and client reviews</li>
            <li><strong>Review System:</strong> One-review-per-client policy with optional display names for authenticity</li>
            <li><strong>Real-Time Messaging:</strong> Private messaging system between clients and providers with notifications</li>
            <li><strong>Profile Management:</strong> Secure image upload/edit/remove functionality with object storage integration</li>
          </ul>

          <h2 className="text-xl font-bold mt-8 mb-4">Technical Architecture</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Frontend:</strong> React 18 + TypeScript, Vite, Tailwind CSS, shadcn/ui, TanStack React Query, Leaflet.js, React Hook Form + Zod</li>
            <li><strong>Backend:</strong> Node.js + Express.js (TypeScript REST API), PostgreSQL + Drizzle ORM</li>
            <li><strong>Authentication:</strong> OpenID Connect (OIDC) implementation</li>
            <li><strong>Infrastructure:</strong> Object storage for media uploads, OpenStreetMap integration</li>
          </ul>

          <h2 className="text-xl font-bold mt-8 mb-4">My Contributions & Learnings</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Design & Ideation:</strong> Conceptualized the entire user experience, designed the UI/UX, and defined all core features and workflows</li>
            <li><strong>Research & Architecture:</strong> Researched and selected authentication (OIDC) and database (PostgreSQL) solutions based on security and scalability requirements</li>
            <li><strong>Development Process:</strong> Utilized GitHub Copilot for code generation assistance while personally handling all debugging, testing, and implementation decisions</li>
            <li><strong>Full-Stack Implementation:</strong> Built complete features from database schema design to frontend components</li>
            <li><strong>Problem Solving:</strong> Debugged complex issues in authentication flow, real-time messaging, and map integration</li>
          </ul>

          <h2 className="text-xl font-bold mt-8 mb-4">Skills Demonstrated</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>Full-Stack Development (React, Express.js, PostgreSQL)</li>
            <li>UI/UX Design & Implementation</li>
            <li>Database Design & ORM Integration</li>
            <li>Authentication & Security Implementation</li>
            <li>API Development & Real-Time Features</li>
            <li>Interactive Mapping & Geospatial Data</li>
            <li>File Upload & Storage Systems</li>
          </ul>

          <h2 className="text-xl font-bold mt-8 mb-4">Impact</h2>
          <p>
            Successfully created a functional platform that demonstrates modern web development practices, from concept to deployment, while solving a real market need for freelance beauty professionals.
          </p>
        </div>
      </div>
    </div>
  );
}

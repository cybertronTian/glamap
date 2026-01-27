import { Navigation } from "@/components/Navigation";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-10 max-w-3xl">
        <h1 className="font-display text-3xl font-bold mb-2">Glamap Privacy Policy</h1>
        <p className="text-muted-foreground mb-8">Effective Date: January 23, 2026</p>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
          <p>
            Glamap ("we", "our", or "us") respects your privacy and is committed to protecting your personal information. This Privacy Policy explains how we collect, use, and share information when you use our web application.
          </p>

          <h2 className="text-xl font-bold mt-8 mb-4">1. Information We Collect</h2>
          <p>When you use Glamap, we may collect the following types of information:</p>
          
          <h3 className="text-lg font-semibold mt-4 mb-2">a. Personal Information</h3>
          <ul className="list-disc pl-6 space-y-1">
            <li>Name, username, email address</li>
            <li>Account login credentials (managed via Firebase Authentication)</li>
            <li>Profile information provided by providers (bio, Instagram, service types, location)</li>
          </ul>

          <h3 className="text-lg font-semibold mt-4 mb-2">b. Usage Information</h3>
          <ul className="list-disc pl-6 space-y-1">
            <li>Map interactions, search queries, and filters</li>
            <li>Messages sent and received through the chat system</li>
            <li>Browser and device information</li>
          </ul>

          <h3 className="text-lg font-semibold mt-4 mb-2">c. Location Information</h3>
          <p>With your consent, browser geolocation is used to show nearby providers</p>

          <h3 className="text-lg font-semibold mt-4 mb-2">d. Cookies and Analytics</h3>
          <p>We may use cookies or similar technologies to improve the user experience and analyze usage trends</p>

          <h2 className="text-xl font-bold mt-8 mb-4">2. How We Use Your Information</h2>
          <p>We use your information to:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Provide and maintain the Glamap service</li>
            <li>Enable login and authentication</li>
            <li>Display providers on maps and in lists</li>
            <li>Allow messaging between users and providers</li>
            <li>Improve our services and user experience</li>
            <li>Communicate important updates about your account</li>
          </ul>

          <h2 className="text-xl font-bold mt-8 mb-4">3. How We Share Your Information</h2>
          <p>We do not sell or rent your personal information. We may share information only:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>With your consent</li>
            <li>With service providers (e.g., Firebase, hosting providers) who process data on our behalf</li>
            <li>When required by law or to protect the rights and safety of our users</li>
          </ul>

          <h2 className="text-xl font-bold mt-8 mb-4">4. Your Rights</h2>
          <p>You can:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Access, update, or delete your profile information</li>
            <li>Withdraw consent for geolocation services at any time</li>
            <li>Contact us for questions about your personal data</li>
          </ul>

          <h2 className="text-xl font-bold mt-8 mb-4">5. Security</h2>
          <p>
            We implement reasonable administrative, technical, and physical safeguards to protect your information. However, no method of transmission over the Internet or electronic storage is completely secure, so we cannot guarantee absolute security.
          </p>

          <h2 className="text-xl font-bold mt-8 mb-4">6. Third-Party Services</h2>
          <p>
            Our app may use third-party services (e.g., Firebase for authentication, hosting services, OpenStreetMap for map tiles). These services have their own privacy policies.
          </p>

          <h2 className="text-xl font-bold mt-8 mb-4">7. Children's Privacy</h2>
          <p>
            Glamap is not intended for children under 13, and we do not knowingly collect personal information from children.
          </p>

          <h2 className="text-xl font-bold mt-8 mb-4">8. Changes to This Privacy Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. Updates will be posted here with the "Effective Date" updated.
          </p>

          <h2 className="text-xl font-bold mt-8 mb-4">9. Contact Us</h2>
          <p>If you have questions about this Privacy Policy, contact us at:</p>
          <p>
            Email: <a href="mailto:glamap.dev@gmail.com" className="text-primary hover:underline">glamap.dev@gmail.com</a>
          </p>
        </div>
      </div>
    </div>
  );
}

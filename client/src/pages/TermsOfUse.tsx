import { Navigation } from "@/components/Navigation";

export default function TermsOfUsePage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-10 max-w-3xl">
        <h1 className="font-display text-3xl font-bold mb-2">Glamap Terms of Use</h1>
        <p className="text-muted-foreground mb-8">Effective Date: January 23, 2026</p>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
          <p>
            Welcome to Glamap ("we", "our", or "us"). By accessing or using our web application, you agree to comply with these Terms of Use. Please read them carefully.
          </p>

          <h2 className="text-xl font-bold mt-8 mb-4">1. Use of the Service</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>Glamap provides a platform for users to discover freelance beauty service providers and for providers to showcase their services.</li>
            <li>You agree to use the service only for lawful purposes and in accordance with these Terms.</li>
            <li>You are responsible for maintaining the confidentiality of your account login credentials.</li>
          </ul>

          <h2 className="text-xl font-bold mt-8 mb-4">2. Eligibility</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>You must be at least 13 years old to use Glamap.</li>
            <li>Providers must have the necessary licenses or qualifications to offer their services.</li>
          </ul>

          <h2 className="text-xl font-bold mt-8 mb-4">3. User Conduct</h2>
          <p>You agree not to:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Post or transmit content that is unlawful, harmful, abusive, harassing, or offensive.</li>
            <li>Impersonate another user or provider.</li>
            <li>Attempt to disrupt, hack, or interfere with the platform or its services.</li>
          </ul>

          <h2 className="text-xl font-bold mt-8 mb-4">4. Messaging and Content</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>Messages sent through Glamap are private and stored securely.</li>
            <li>We do not monitor messages, but reserve the right to act on reports of abuse.</li>
            <li>You are responsible for the accuracy and legality of the content you post or share.</li>
          </ul>

          <h2 className="text-xl font-bold mt-8 mb-4">5. Provider Information</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>Providers are responsible for the accuracy of their profile information, services, prices, and availability.</li>
            <li>Glamap does not guarantee the quality, safety, or reliability of any services provided by freelance providers.</li>
          </ul>

          <h2 className="text-xl font-bold mt-8 mb-4">6. Intellectual Property</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>All content on Glamap, including logos, design, code, and text, is owned by Glamap or its licensors.</li>
            <li>Users may not copy, reproduce, or distribute Glamap content without written permission.</li>
          </ul>

          <h2 className="text-xl font-bold mt-8 mb-4">7. Limitation of Liability</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>Glamap is provided "as is" without warranties of any kind.</li>
            <li>We are not liable for any direct, indirect, or consequential damages resulting from the use of the service.</li>
            <li>Users assume all responsibility when interacting with providers or other users.</li>
          </ul>

          <h2 className="text-xl font-bold mt-8 mb-4">8. Privacy</h2>
          <p>
            Your use of Glamap is also governed by our Privacy Policy, which explains how we collect, use, and protect your data.
          </p>

          <h2 className="text-xl font-bold mt-8 mb-4">9. Termination</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>We may suspend or terminate your account for violating these Terms.</li>
            <li>You may also delete your account at any time through the settings page.</li>
          </ul>

          <h2 className="text-xl font-bold mt-8 mb-4">10. Changes to Terms</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>We may update these Terms of Use at any time.</li>
            <li>Continued use of Glamap after changes indicates acceptance of the updated Terms.</li>
          </ul>

          <h2 className="text-xl font-bold mt-8 mb-4">11. Contact Us</h2>
          <p>For questions about these Terms or your account:</p>
          <p>
            Email: <a href="mailto:glamap.dev@gmail.com" className="text-primary hover:underline">glamap.dev@gmail.com</a>
          </p>
        </div>
      </div>
    </div>
  );
}

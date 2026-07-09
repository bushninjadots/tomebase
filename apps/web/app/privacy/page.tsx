import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Privacy Policy</h1>
      <div className="prose prose-gray max-w-none space-y-6 text-gray-700 text-sm leading-relaxed">
        <p>Last updated: {new Date().toLocaleDateString()}</p>

        <h2 className="text-lg font-semibold text-gray-900 mt-8">1. Information We Collect</h2>
        <p>We collect information you provide when creating an account: name, email address, and optionally a profile image. When using the Service, we store content you create, including documentation pages and project settings.</p>

        <h2 className="text-lg font-semibold text-gray-900 mt-8">2. How We Use Information</h2>
        <p>We use your information to: provide and maintain the Service, communicate with you about your account, improve our product, and comply with legal obligations. We do not sell your personal information.</p>

        <h2 className="text-lg font-semibold text-gray-900 mt-8">3. Data Storage and Security</h2>
        <p>Your data is stored securely using industry-standard encryption. We implement appropriate technical and organizational measures to protect your information.</p>

        <h2 className="text-lg font-semibold text-gray-900 mt-8">4. Third-Party Services</h2>
        <p>We may use third-party services for authentication (e.g., GitHub, Google), hosting, and analytics. These services have their own privacy policies governing data handling.</p>

        <h2 className="text-lg font-semibold text-gray-900 mt-8">5. Cookies</h2>
        <p>We use essential cookies for authentication and session management. We may use analytics cookies to understand usage patterns. You can control cookie preferences through your browser settings.</p>

        <h2 className="text-lg font-semibold text-gray-900 mt-8">6. Data Retention</h2>
        <p>We retain your data as long as your account is active. Upon account deletion, data is removed within 30 days. Backup copies may persist temporarily.</p>

        <h2 className="text-lg font-semibold text-gray-900 mt-8">7. Your Rights</h2>
        <p>Depending on your jurisdiction, you may have the right to access, correct, delete, or port your data. Contact us at privacy@tomebase.io to exercise these rights.</p>

        <h2 className="text-lg font-semibold text-gray-900 mt-8">8. Changes to Policy</h2>
        <p>We may update this policy. Material changes will be communicated via email or in-app notice.</p>

        <h2 className="text-lg font-semibold text-gray-900 mt-8">9. Contact</h2>
        <p>For privacy-related inquiries, contact us at privacy@tomebase.io.</p>
      </div>
      <div className="mt-12 border-t border-gray-100 pt-6">
        <Link href="/" className="text-sm text-fluid-600 hover:text-fluid-700">&larr; Back to TomeBase</Link>
      </div>
    </div>
  );
}

import Link from 'next/link';

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Terms of Service</h1>
      <div className="prose prose-gray max-w-none space-y-6 text-gray-700 text-sm leading-relaxed">
        <p>Last updated: {new Date().toLocaleDateString()}</p>

        <h2 className="text-lg font-semibold text-gray-900 mt-8">1. Acceptance of Terms</h2>
        <p>By accessing or using Fluid (&ldquo;the Service&rdquo;), you agree to be bound by these Terms of Service. If you do not agree, do not use the Service.</p>

        <h2 className="text-lg font-semibold text-gray-900 mt-8">2. Description of Service</h2>
        <p>Fluid provides a documentation platform that allows users to create, edit, publish, and share documentation. The Service is provided on a subscription basis with free and paid tiers.</p>

        <h2 className="text-lg font-semibold text-gray-900 mt-8">3. User Accounts</h2>
        <p>You are responsible for maintaining the confidentiality of your account credentials and for all activity under your account. You must provide accurate information when creating an account.</p>

        <h2 className="text-lg font-semibold text-gray-900 mt-8">4. Acceptable Use</h2>
        <p>You agree not to misuse the Service. This includes, but is not limited to: uploading malicious content, attempting to breach security, violating others&apos; intellectual property, or using the Service for illegal purposes.</p>

        <h2 className="text-lg font-semibold text-gray-900 mt-8">5. Content Ownership</h2>
        <p>You retain all rights to the content you create and store using Fluid. By using the Service, you grant Fluid a license to host and display your content as necessary to provide the Service.</p>

        <h2 className="text-lg font-semibold text-gray-900 mt-8">6. Payment and Billing</h2>
        <p>Paid plans are billed monthly or annually as selected. Payments are non-refundable except as required by law. We may change pricing with 30 days&apos; notice.</p>

        <h2 className="text-lg font-semibold text-gray-900 mt-8">7. Limitation of Liability</h2>
        <p>Fluid is provided &ldquo;as is&rdquo; without warranties of any kind. We are not liable for damages arising from your use of the Service, including data loss or service interruptions.</p>

        <h2 className="text-lg font-semibold text-gray-900 mt-8">8. Termination</h2>
        <p>We may suspend or terminate accounts for violations of these terms. You may cancel your account at any time. Upon termination, your data will be deleted within 30 days.</p>

        <h2 className="text-lg font-semibold text-gray-900 mt-8">9. Changes to Terms</h2>
        <p>We may update these terms. Continued use after changes constitutes acceptance. We will notify users of material changes via email.</p>
      </div>
      <div className="mt-12 border-t border-gray-100 pt-6">
        <Link href="/" className="text-sm text-fluid-600 hover:text-fluid-700">&larr; Back to Fluid</Link>
      </div>
    </div>
  );
}

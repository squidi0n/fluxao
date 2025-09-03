import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service | FluxAO',
  description:
    'Terms of Service for FluxAO - Read our terms and conditions for using our platform and services.',
};

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
        <p className="text-muted-foreground mb-8">
          Effective Date: {new Date().toLocaleDateString()}
        </p>

        <div className="prose prose-lg dark:prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
            <p>
              By accessing and using FluxAO ("Service"), you accept and agree to be bound by the
              terms and provision of this agreement. If you do not agree to abide by the above,
              please do not use this Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Description of Service</h2>
            <p>
              FluxAO provides a content management and blogging platform that allows users to
              create, publish, and share content. The Service includes features such as blog
              creation, newsletter management, analytics, and premium subscription options.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. User Accounts</h2>
            <h3 className="text-xl font-semibold mb-2">3.1 Account Creation</h3>
            <p>
              To use certain features of the Service, you must register for an account. You agree to
              provide accurate, current, and complete information during registration and to update
              such information to keep it accurate.
            </p>

            <h3 className="text-xl font-semibold mb-2">3.2 Account Security</h3>
            <p>
              You are responsible for safeguarding your password and for any activities or actions
              under your account. You agree to notify us immediately of any unauthorized access to
              or use of your account.
            </p>

            <h3 className="text-xl font-semibold mb-2">3.3 Account Termination</h3>
            <p>
              We reserve the right to suspend or terminate your account if you violate these Terms
              of Service or engage in any conduct that we determine is inappropriate or unlawful.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. User Content</h2>
            <h3 className="text-xl font-semibold mb-2">4.1 Content Ownership</h3>
            <p>
              You retain all rights to the content you post on FluxAO. By posting content, you grant
              us a worldwide, non-exclusive, royalty-free license to use, reproduce, modify, and
              distribute your content in connection with the Service.
            </p>

            <h3 className="text-xl font-semibold mb-2">4.2 Content Guidelines</h3>
            <p>You agree not to post content that:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Is unlawful, harmful, threatening, abusive, harassing, or defamatory</li>
              <li>Violates any person's intellectual property rights</li>
              <li>Contains viruses or malicious code</li>
              <li>Is spam or unsolicited commercial content</li>
              <li>Violates the privacy of others</li>
              <li>Promotes illegal activities</li>
            </ul>

            <h3 className="text-xl font-semibold mb-2">4.3 Content Moderation</h3>
            <p>
              We reserve the right to remove any content that violates these Terms of Service or
              that we deem inappropriate. We are not responsible for any loss or damage resulting
              from the removal of content.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Subscription and Payments</h2>
            <h3 className="text-xl font-semibold mb-2">5.1 Subscription Plans</h3>
            <p>
              FluxAO offers both free and paid subscription plans. Paid plans provide access to
              premium features as described on our pricing page. Prices are subject to change with
              notice.
            </p>

            <h3 className="text-xl font-semibold mb-2">5.2 Billing</h3>
            <p>
              Paid subscriptions are billed in advance on a monthly or annual basis. Payment
              processing is handled securely through Stripe. You authorize us to charge your payment
              method for the subscription fee.
            </p>

            <h3 className="text-xl font-semibold mb-2">5.3 Refunds</h3>
            <p>
              Subscription fees are generally non-refundable. We may provide refunds at our
              discretion on a case-by-case basis. Free trial periods, if offered, automatically
              convert to paid subscriptions unless canceled.
            </p>

            <h3 className="text-xl font-semibold mb-2">5.4 Cancellation</h3>
            <p>
              You may cancel your subscription at any time through your account settings.
              Cancellation takes effect at the end of the current billing period, and you will
              retain access to premium features until then.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Intellectual Property</h2>
            <p>
              The Service and its original content (excluding user content), features, and
              functionality are owned by FluxAO and are protected by international copyright,
              trademark, patent, trade secret, and other intellectual property laws.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Privacy</h2>
            <p>
              Your use of the Service is also governed by our Privacy Policy. Please review our
              Privacy Policy, which also governs the Site and informs users of our data collection
              practices.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">
              8. Disclaimers and Limitations of Liability
            </h2>
            <h3 className="text-xl font-semibold mb-2">8.1 Service Availability</h3>
            <p>
              The Service is provided on an "AS IS" and "AS AVAILABLE" basis. We do not guarantee
              that the Service will be uninterrupted, secure, or error-free.
            </p>

            <h3 className="text-xl font-semibold mb-2">8.2 Limitation of Liability</h3>
            <p>
              To the maximum extent permitted by law, FluxAO shall not be liable for any indirect,
              incidental, special, consequential, or punitive damages, or any loss of profits or
              revenues, whether incurred directly or indirectly.
            </p>

            <h3 className="text-xl font-semibold mb-2">8.3 Indemnification</h3>
            <p>
              You agree to indemnify and hold harmless FluxAO and its affiliates from any claims,
              losses, damages, liabilities, and expenses arising from your use of the Service or
              violation of these Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">9. Third-Party Services</h2>
            <p>
              The Service may contain links to third-party websites or services that are not owned
              or controlled by FluxAO. We have no control over and assume no responsibility for the
              content, privacy policies, or practices of any third-party websites or services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">10. Modifications to Terms</h2>
            <p>
              We reserve the right to modify these Terms of Service at any time. If we make material
              changes, we will notify you by email or by posting a notice on the Service. Your
              continued use of the Service after any modifications indicates your acceptance of the
              updated Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">11. Governing Law</h2>
            <p>
              These Terms shall be governed and construed in accordance with the laws of [Your
              Jurisdiction], without regard to its conflict of law provisions. Any legal action or
              proceeding shall be brought exclusively in the courts located in [Your Jurisdiction].
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">12. Severability</h2>
            <p>
              If any provision of these Terms is held to be unenforceable or invalid, such provision
              will be changed and interpreted to accomplish the objectives of such provision to the
              greatest extent possible under applicable law, and the remaining provisions will
              continue in full force and effect.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">13. Contact Information</h2>
            <p>For questions about these Terms of Service, please contact us at:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Email: legal@fluxao.com</li>
              <li>Address: FluxAO, [Your Address]</li>
              <li>
                Contact Form:{' '}
                <a href="/contact" className="text-primary hover:underline">
                  Contact Us
                </a>
              </li>
            </ul>
          </section>

          <section className="border-t pt-8 mt-8">
            <h2 className="text-2xl font-semibold mb-4">Acceptable Use Policy</h2>
            <p>
              In addition to the above terms, users must comply with the following acceptable use
              policy:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Do not use the Service for any illegal purposes</li>
              <li>Do not attempt to gain unauthorized access to any part of the Service</li>
              <li>Do not interfere with or disrupt the Service or servers</li>
              <li>Do not use automated means to access the Service without permission</li>
              <li>Do not impersonate others or provide false information</li>
              <li>Do not use the Service to send spam or unsolicited messages</li>
              <li>Respect the intellectual property rights of others</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}

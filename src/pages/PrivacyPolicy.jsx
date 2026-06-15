import { Link } from 'react-router-dom';

export default function PrivacyPolicy() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <Link to="/" className="text-sm text-gray-500 hover:text-white transition-colors mb-8 inline-block">
        ← Back to PartyHub
      </Link>

      <h1 className="text-3xl font-bold text-white mb-2">Privacy Policy</h1>
      <p className="text-gray-500 text-sm mb-10">Last updated: June 15, 2026</p>

      <div className="space-y-8 text-gray-400 text-sm leading-relaxed">

        <section>
          <h2 className="text-white font-semibold text-base mb-2">1. Who We Are</h2>
          <p>
            PartyHub is operated by Sai Vigneshwar Reddy ("we", "us", "our"). We provide an event discovery
            and community platform available at <a href="https://speilfinder.com" className="text-purple-400 hover:underline">speilfinder.com</a> and
            via the PartyHub mobile app.
          </p>
          <p className="mt-2">
            Contact: <a href="mailto:vigneshwarreddy.marthala@gmail.com" className="text-purple-400 hover:underline">vigneshwarreddy.marthala@gmail.com</a>
          </p>
        </section>

        <section>
          <h2 className="text-white font-semibold text-base mb-2">2. What Data We Collect</h2>
          <p>When you register and use PartyHub, we collect:</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li><strong className="text-gray-300">Account information</strong>: your email address and display name</li>
            <li><strong className="text-gray-300">Profile information</strong>: city, country, and any profile details you choose to add</li>
            <li><strong className="text-gray-300">RSVP data</strong>: events you join or check in to</li>
            <li><strong className="text-gray-300">Chat messages</strong>: messages you send in event chat rooms</li>
            <li><strong className="text-gray-300">Usage data</strong>: pages and features you interact with (via Supabase logs)</li>
          </ul>
          <p className="mt-2">We do <strong className="text-gray-300">not</strong> collect your location, phone number, payment information, or any health data.</p>
        </section>

        <section>
          <h2 className="text-white font-semibold text-base mb-2">3. How We Use Your Data</h2>
          <ul className="list-disc list-inside space-y-1">
            <li>To create and manage your account</li>
            <li>To show you relevant events in your city</li>
            <li>To allow you to RSVP and participate in event chat rooms</li>
            <li>To send important service notifications (e.g. event updates)</li>
            <li>To improve the app and fix bugs</li>
          </ul>
          <p className="mt-2">We do <strong className="text-gray-300">not</strong> sell your data to third parties or use it for advertising.</p>
        </section>

        <section>
          <h2 className="text-white font-semibold text-base mb-2">4. Data Storage & Security</h2>
          <p>
            Your data is stored securely on <a href="https://supabase.com" className="text-purple-400 hover:underline">Supabase</a>, a
            cloud database provider. All data is encrypted in transit using HTTPS/TLS. Supabase is hosted on AWS
            infrastructure in Europe.
          </p>
        </section>

        <section>
          <h2 className="text-white font-semibold text-base mb-2">5. Data Sharing</h2>
          <p>We only share your data with:</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li><strong className="text-gray-300">Supabase</strong> — our database and authentication provider</li>
            <li><strong className="text-gray-300">Vercel</strong> — our web hosting provider</li>
            <li><strong className="text-gray-300">Expo / EAS</strong> — our mobile app build and update platform</li>
          </ul>
          <p className="mt-2">We do not share your personal data with any other third parties.</p>
        </section>

        <section>
          <h2 className="text-white font-semibold text-base mb-2">6. Your Rights</h2>
          <p>You have the right to:</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Access the personal data we hold about you</li>
            <li>Request correction of inaccurate data</li>
            <li>Request deletion of your account and all associated data</li>
            <li>Withdraw consent at any time</li>
          </ul>
          <p className="mt-2">
            To exercise any of these rights, email us at{' '}
            <a href="mailto:vigneshwarreddy.marthala@gmail.com" className="text-purple-400 hover:underline">
              vigneshwarreddy.marthala@gmail.com
            </a>. We will respond within 30 days.
          </p>
        </section>

        <section>
          <h2 className="text-white font-semibold text-base mb-2">7. Account Deletion</h2>
          <p>
            You can request full deletion of your account and data at any time by emailing us. We will delete
            your profile, RSVPs, and chat history within 14 days of your request.
          </p>
        </section>

        <section>
          <h2 className="text-white font-semibold text-base mb-2">8. Children's Privacy</h2>
          <p>
            PartyHub is intended for users aged 18 and over. We do not knowingly collect data from children
            under 18. If we become aware that a child has provided personal data, we will delete it immediately.
          </p>
        </section>

        <section>
          <h2 className="text-white font-semibold text-base mb-2">9. Changes to This Policy</h2>
          <p>
            We may update this privacy policy from time to time. We will notify you of significant changes
            by updating the "Last updated" date at the top of this page. Continued use of the app after
            changes means you accept the updated policy.
          </p>
        </section>

        <section>
          <h2 className="text-white font-semibold text-base mb-2">10. Contact</h2>
          <p>
            For any privacy-related questions or requests, please contact:<br />
            <a href="mailto:vigneshwarreddy.marthala@gmail.com" className="text-purple-400 hover:underline">
              vigneshwarreddy.marthala@gmail.com
            </a>
          </p>
        </section>

      </div>

      <div className="mt-12 pt-6 border-t border-gray-800 text-xs text-gray-700">
        © 2026 PartyHub · Sai Vigneshwar Reddy
      </div>
    </div>
  );
}

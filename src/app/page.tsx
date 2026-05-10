import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        <section className="bg-gradient-to-br from-brand-light to-white py-20 px-4 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Audiobooks. Your way.</h1>
          <p className="text-lg text-gray-600 max-w-xl mx-auto mb-8">
            Buy directly from us in Naira, or find our titles on Spotify, Apple Books, Audible and more.
          </p>
          <div className="flex gap-3 justify-center">
            <Link href="/store" className="bg-brand text-white px-6 py-3 rounded-xl font-medium hover:bg-brand-dark transition-colors">
              Browse Store
            </Link>
            <Link href="/register" className="bg-white text-gray-700 border border-gray-200 px-6 py-3 rounded-xl font-medium hover:bg-gray-50 transition-colors">
              Create Account
            </Link>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 py-16">
          <h2 className="text-2xl font-semibold text-gray-900 mb-10 text-center">Why choose Audora?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: '🔒', title: 'Secure streaming', desc: 'No downloads, no sharing. Your purchase is tied to your account and streamed on-demand.' },
              { icon: '💳', title: 'Pay in Naira', desc: 'Buy directly with Paystack — cards, bank transfers, USSD. No currency conversion.' },
              { icon: '🌍', title: 'Global platforms too', desc: 'Find our titles on Spotify, Apple Books, Google Play, and Audible via Findaway Voices.' },
            ].map((f) => (
              <div key={f.title} className="text-center p-6 bg-white rounded-xl border border-gray-100">
                <div className="text-4xl mb-4">{f.icon}</div>
                <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}

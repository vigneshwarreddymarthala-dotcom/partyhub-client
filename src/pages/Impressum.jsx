import { Link } from 'react-router-dom';

export default function Impressum() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <Link to="/" className="text-sm text-gray-500 hover:text-white transition-colors mb-8 inline-block">
        ← Back to SpielFinder
      </Link>

      <h1 className="text-3xl font-bold text-white mb-8">Impressum</h1>

      <div className="space-y-6 text-gray-400 text-sm leading-relaxed">

        <section>
          <h2 className="text-white font-semibold text-base mb-2">Angaben gemäß § 5 TMG</h2>
          <p>Sai Vigneshwar Reddy</p>
        </section>

        <section>
          <h2 className="text-white font-semibold text-base mb-2">Kontakt</h2>
          <p>E-Mail: <a href="mailto:vigneshwarreddy.marthala@gmail.com" className="text-brand-400 hover:underline">vigneshwarreddy.marthala@gmail.com</a></p>
        </section>

        <section>
          <h2 className="text-white font-semibold text-base mb-2">Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV</h2>
          <p>Sai Vigneshwar Reddy</p>
        </section>

        <section>
          <h2 className="text-white font-semibold text-base mb-2">Haftungsausschluss</h2>
          <p>
            Die Inhalte unserer Seiten wurden mit größter Sorgfalt erstellt. Für die Richtigkeit, Vollständigkeit
            und Aktualität der Inhalte können wir jedoch keine Gewähr übernehmen.
          </p>
        </section>

        <section>
          <h2 className="text-white font-semibold text-base mb-2">Urheberrecht</h2>
          <p>
            Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem deutschen
            Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der
            Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers.
          </p>
        </section>

      </div>

      <div className="mt-12 pt-6 border-t border-gray-800 text-xs text-gray-700">
        © 2026 SpielFinder · Sai Vigneshwar Reddy
      </div>
    </div>
  );
}

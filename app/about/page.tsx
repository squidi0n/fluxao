import { Metadata } from 'next';
import Link from 'next/link';

import { Card } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Über uns',
  description:
    'Erfahre mehr über FluxAO - das moderne Tech und KI Magazin für die neuesten Entwicklungen in Technologie und Künstlicher Intelligenz.',
  openGraph: {
    title: 'Über uns | FluxAO',
    description:
      'Erfahre mehr über FluxAO - das moderne Tech und KI Magazin für die neuesten Entwicklungen in Technologie und Künstlicher Intelligenz.',
  },
};

const teamMembers = [
  {
    name: 'Max Mustermann',
    role: 'Chefredakteur',
    bio: 'Mit über 10 Jahren Erfahrung in der Tech-Branche leitet Max unser Redaktionsteam und sorgt für hochwertige Inhalte.',
    image: '/team/max.jpg',
  },
  {
    name: 'Anna Schmidt',
    role: 'KI-Expertin',
    bio: 'Anna hat in Machine Learning promoviert und bringt tiefgreifendes Fachwissen über KI-Technologien mit.',
    image: '/team/anna.jpg',
  },
  {
    name: 'Tom Weber',
    role: 'Tech-Journalist',
    bio: 'Tom berichtet über die neuesten Trends und Entwicklungen in der Technologie-Welt.',
    image: '/team/tom.jpg',
  },
];

const values = [
  {
    title: 'Innovation',
    description:
      'Wir berichten über die neuesten technologischen Durchbrüche und deren Auswirkungen auf unsere Gesellschaft.',
    icon: '🚀',
  },
  {
    title: 'Qualität',
    description:
      'Unsere Artikel werden sorgfältig recherchiert und von Experten geprüft, um höchste Qualitätsstandards zu gewährleisten.',
    icon: '✨',
  },
  {
    title: 'Verständlichkeit',
    description:
      'Komplexe technische Themen werden verständlich und zugänglich für alle Leser aufbereitet.',
    icon: '📖',
  },
  {
    title: 'Zukunftsorientierung',
    description:
      'Wir schauen nicht nur auf das Heute, sondern auch auf die technologischen Möglichkeiten von morgen.',
    icon: '🔮',
  },
];

const milestones = [
  {
    year: '2023',
    title: 'Gründung von FluxAO',
    description: 'Start des Magazins mit dem Fokus auf KI und moderne Technologien.',
  },
  {
    year: '2023',
    title: 'Erste 10.000 Leser',
    description: 'Erreichen einer treuen Leserschaft von Tech-Enthusiasten.',
  },
  {
    year: '2024',
    title: 'Newsletter-Launch',
    description: 'Start unseres wöchentlichen Newsletters mit über 5.000 Abonnenten.',
  },
  {
    year: '2024',
    title: 'Community-Aufbau',
    description:
      'Aufbau einer aktiven Community von Entwicklern, Forschern und Tech-Interessierten.',
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              Über FluxAO
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
              FluxAO ist das moderne Tech und KI Magazin für alle, die sich für die neuesten
              Entwicklungen in Technologie und Künstlicher Intelligenz interessieren.
            </p>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
                  Unsere Mission
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                  In einer Zeit, in der sich Technologie rasant entwickelt, ist es unser Ziel,
                  komplexe technische Themen verständlich zu machen und über die Auswirkungen auf
                  unsere Gesellschaft zu informieren.
                </p>
                <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
                  Wir glauben, dass jeder Zugang zu qualitativ hochwertigen Informationen über
                  Technologie haben sollte, unabhängig vom technischen Hintergrund.
                </p>
              </div>
              <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-8">
                <blockquote className="text-xl italic text-gray-700 dark:text-gray-300">
                  "Technologie ist am besten, wenn sie Menschen zusammenbringt."
                </blockquote>
                <cite className="block mt-4 text-gray-500 dark:text-gray-400">
                  - Matt Mullenweg, Gründer von WordPress
                </cite>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="bg-gray-50 dark:bg-gray-900 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-12 text-center">
              Unsere Werte
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {values.map((value, index) => (
                <Card key={index} className="text-center p-8">
                  <div className="text-4xl mb-4">{value.icon}</div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    {value.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                    {value.description}
                  </p>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-12 text-center">
              Unser Team
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {teamMembers.map((member, index) => (
                <Card key={index} className="text-center p-8">
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full mx-auto mb-6 flex items-center justify-center text-white text-2xl font-bold">
                    {member.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    {member.name}
                  </h3>
                  <p className="text-blue-600 dark:text-blue-400 font-medium mb-4">{member.role}</p>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{member.bio}</p>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="bg-gray-50 dark:bg-gray-900 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-12 text-center">
              Unsere Geschichte
            </h2>
            <div className="space-y-8">
              {milestones.map((milestone, index) => (
                <div key={index} className="flex items-start space-x-6">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                      {milestone.year}
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      {milestone.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                      {milestone.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
              Lust auf Zusammenarbeit?
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
              Wir freuen uns immer über neue Ideen, Gastbeiträge oder Feedback von unserer
              Community.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Kontakt aufnehmen
              </Link>
              <Link
                href="/blog"
                className="inline-flex items-center justify-center px-6 py-3 bg-white text-blue-600 border border-blue-600 font-medium rounded-lg hover:bg-blue-50 dark:bg-gray-800 dark:text-blue-400 dark:border-blue-400 dark:hover:bg-gray-700 transition-colors"
              >
                Unsere Artikel lesen
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

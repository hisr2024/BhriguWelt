'use client';

import { motion } from "framer-motion";
import Link from "next/link";
import AnimatedLogo from "@/components/AnimatedLogo";

export default function HomePage() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
      },
    },
  };

  return (
    <div className="serene-page">
      <motion.section 
        className="panel"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Hero Section with Animated Logo */}
        <motion.div className="hero-section" variants={itemVariants}>
          <motion.div 
            className="hero-logo"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
          >
            <AnimatedLogo />
          </motion.div>
          <motion.h1 
            className="hero-title gradient-text"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            Welcome to BhriguWelt
          </motion.h1>
          <motion.p 
            className="hero-subtitle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
          >
            Ancient Vedic Wisdom Meets Modern Astrology
          </motion.p>
        </motion.div>

        {/* About Bhrigu Samhita */}
        <motion.div className="card highlight info-card-bhrigu" variants={itemVariants}>
          <motion.div 
            className="card-icon"
            animate={{
              rotate: [0, 360],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            📜
          </motion.div>
          <h2>About Bhrigu Samhita</h2>
          <p className="lead-text">
            The Bhrigu Samhita is one of the most revered ancient texts in Vedic astrology, 
            attributed to the sage Maharishi Bhrigu. This sacred manuscript contains detailed 
            horoscopes and life predictions compiled over 5,000 years ago.
          </p>
          <div className="feature-grid">
            <div className="feature-box">
              <span className="feature-icon">🌟</span>
              <h3>Ancient Wisdom</h3>
              <p>
                Contains predictions written on palm leaves, preserved through generations by 
                devoted custodians in temples and archives across India.
              </p>
            </div>
            <div className="feature-box">
              <span className="feature-icon">🔮</span>
              <h3>Precise Predictions</h3>
              <p>
                Offers remarkably accurate life predictions including marriage, career, health, 
                and spiritual milestones based on planetary positions at birth.
              </p>
            </div>
            <div className="feature-box">
              <span className="feature-icon">🕉️</span>
              <h3>Karmic Insights</h3>
              <p>
                Reveals past life influences and karmic patterns that shape your current life 
                journey, helping you understand your soul's purpose.
              </p>
            </div>
            <div className="feature-box">
              <span className="feature-icon">✨</span>
              <h3>Future Guidance</h3>
              <p>
                Provides detailed year-by-year predictions and remedial measures to navigate 
                life's challenges and maximize opportunities.
              </p>
            </div>
          </div>
        </motion.div>

        {/* About Nadi Jyotisha */}
        <motion.div className="card highlight info-card-nadi" variants={itemVariants}>
          <motion.div 
            className="card-icon"
            animate={{
              y: [0, -10, 0],
              rotate: [0, 5, -5, 0],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            🌙
          </motion.div>
          <h2>About Nadi Jyotisha</h2>
          <p className="lead-text">
            Nadi Jyotisha is an ancient form of Hindu astrology practiced in Tamil Nadu, India. 
            It is based on the belief that ancient sages wrote the life patterns of every human 
            being on palm leaves thousands of years ago.
          </p>
          <div className="feature-grid">
            <div className="feature-box">
              <span className="feature-icon">📚</span>
              <h3>Palm Leaf Manuscripts</h3>
              <p>
                Ancient predictions inscribed on palm leaves in Tamil, Telugu, and Sanskrit, 
                preserved in temple libraries across South India.
              </p>
            </div>
            <div className="feature-box">
              <span className="feature-icon">🎯</span>
              <h3>Personal Destiny</h3>
              <p>
                Each individual's Nadi leaf contains their complete life story, including 
                family details, career path, and major life events.
              </p>
            </div>
            <div className="feature-box">
              <span className="feature-icon">🌸</span>
              <h3>Remedial Solutions</h3>
              <p>
                Offers specific remedies and rituals to mitigate challenges and enhance 
                positive outcomes in various aspects of life.
              </p>
            </div>
            <div className="feature-box">
              <span className="feature-icon">🙏</span>
              <h3>Spiritual Evolution</h3>
              <p>
                Guides your spiritual journey by revealing your soul's purpose, past life 
                karmas, and the path to liberation (moksha).
              </p>
            </div>
          </div>
          <div className="cta-box">
            <p>
              <strong>Experience Nadi Jyotisha:</strong> Explore our comprehensive Nadi analysis 
              to discover your past lives, future trajectory, and karmic relationships.
            </p>
            <Link href="/nadi-jyotisha" className="button-link">
              Explore Nadi Jyotisha →
            </Link>
          </div>
        </motion.div>

        <motion.div className="card tools-card" variants={itemVariants}>
          <h3>📚 Additional Specialized Tools</h3>
          <p className="muted">
            For focused analysis, explore our dedicated sections:
          </p>
          <motion.ul 
            className="tools-list"
            initial="hidden"
            animate="visible"
            variants={{
              visible: {
                transition: {
                  staggerChildren: 0.1,
                  delayChildren: 1.5,
                },
              },
            }}
          >
            {[
              { href: "/future", icon: "🌟", title: "Future Directives", desc: "Detailed future outlook and guidance" },
              { href: "/past-life", icon: "🕉️", title: "Past Lives", desc: "Karmic patterns from previous incarnations" },
              { href: "/dashboard", icon: "📊", title: "Full Dashboard", desc: "Access all astrology tools" },
            ].map((tool, idx) => (
              <motion.li
                key={idx}
                variants={{
                  hidden: { opacity: 0, scale: 0.9 },
                  visible: { opacity: 1, scale: 1 },
                }}
                whileHover={{ scale: 1.05, x: 5 }}
              >
                <a href={tool.href} className="tool-link">
                  <span className="tool-icon">{tool.icon}</span>
                  <div>
                    <strong>{tool.title}</strong> - {tool.desc}
                  </div>
                </a>
              </motion.li>
            ))}
          </motion.ul>
        </motion.div>
      </motion.section>

      <style jsx>{`
        .hero-section {
          text-align: center;
          padding: var(--space-6) var(--space-4);
          margin-bottom: var(--space-5);
        }

        .hero-logo {
          width: 150px;
          height: 150px;
          margin: 0 auto var(--space-4);
        }

        .hero-title {
          font-size: 3rem;
          margin-bottom: var(--space-2);
          font-weight: 800;
        }

        .hero-subtitle {
          font-size: 1.3rem;
          color: #8A5CF6;
          font-weight: 600;
          margin-bottom: var(--space-2);
        }

        .info-card-bhrigu {
          background: linear-gradient(135deg, rgba(77, 238, 234, 0.08), rgba(138, 92, 246, 0.08));
          border-left: 4px solid #4DEEEA;
          margin: var(--space-5) 0;
          position: relative;
        }

        .info-card-nadi {
          background: linear-gradient(135deg, rgba(138, 92, 246, 0.08), rgba(236, 72, 153, 0.08));
          border-left: 4px solid #8A5CF6;
          margin: var(--space-5) 0;
          position: relative;
        }

        .card-icon {
          font-size: 4rem;
          text-align: center;
          margin-bottom: var(--space-3);
        }

        .lead-text {
          font-size: 1.1rem;
          line-height: 1.8;
          color: #475569;
          margin-bottom: var(--space-4);
          font-weight: 500;
        }

        .feature-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: var(--space-4);
          margin-top: var(--space-4);
        }

        .feature-box {
          padding: var(--space-4);
          background: rgba(255, 255, 255, 0.5);
          border-radius: 0.75rem;
          border: 1px solid rgba(138, 92, 246, 0.15);
          transition: all 0.3s ease;
        }

        .feature-box:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 20px rgba(138, 92, 246, 0.15);
          border-color: rgba(138, 92, 246, 0.3);
        }

        .feature-box .feature-icon {
          font-size: 2.5rem;
          display: block;
          margin-bottom: var(--space-2);
        }

        .feature-box h3 {
          font-size: 1.2rem;
          color: #8A5CF6;
          margin-bottom: var(--space-2);
          font-weight: 700;
        }

        .feature-box p {
          font-size: 0.95rem;
          line-height: 1.6;
          color: #64748b;
        }

        .cta-box {
          margin-top: var(--space-5);
          padding: var(--space-4);
          background: rgba(138, 92, 246, 0.1);
          border-radius: 0.75rem;
          text-align: center;
        }

        .cta-box p {
          margin-bottom: var(--space-3);
          font-size: 1.05rem;
        }

        .cta-box strong {
          color: #8A5CF6;
        }

        .mystical-header {
          text-align: center;
          padding: var(--space-5) var(--space-4);
          margin-top: var(--space-6);
        }

        .mystical-symbol {
          font-size: 3.5rem;
          margin-bottom: var(--space-3);
        }

        .gradient-text {
          background: linear-gradient(90deg, #4DEEEA, #8A5CF6, #BEF264);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          font-size: 2.5rem;
          margin-bottom: var(--space-2);
          font-weight: 800;
        }

        .mystical-subtitle {
          font-size: 1.2rem;
          color: #4DEEEA;
          margin-bottom: var(--space-3);
          font-weight: 600;
        }

        .chart-showcase-container {
          margin: var(--space-6) 0;
          padding: var(--space-5);
          background: linear-gradient(135deg, rgba(139, 92, 246, 0.03), rgba(14, 165, 233, 0.03));
          border-radius: 1rem;
          border: 1px solid rgba(139, 92, 246, 0.1);
        }

        .chart-description {
          padding: var(--space-4);
        }

        .chart-description-title {
          font-size: 1.8rem;
          font-weight: 700;
          color: #8A5CF6;
          margin-bottom: var(--space-3);
        }

        .chart-description-text {
          font-size: 1rem;
          line-height: 1.7;
          color: #64748b;
          margin-bottom: var(--space-4);
        }

        .chart-features {
          display: grid;
          gap: var(--space-3);
        }

        .feature-item {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          padding: var(--space-3);
          background: rgba(139, 92, 246, 0.05);
          border-radius: 0.5rem;
          border: 1px solid rgba(139, 92, 246, 0.1);
          font-weight: 600;
          color: #475569;
        }

        .feature-icon {
          font-size: 1.5rem;
        }

        .chart-loading {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 400px;
          color: #8A5CF6;
          font-weight: 600;
        }

        .mystical-card {
          background: linear-gradient(135deg, rgba(77, 238, 234, 0.1), rgba(138, 92, 246, 0.1));
          border-left: 4px solid #4DEEEA;
          margin-top: var(--space-6);
        }

        .info-card {
          background: rgba(190, 242, 100, 0.05);
          border-left: 4px solid #BEF264;
          margin-top: var(--space-4);
        }

        .tools-card {
          background: linear-gradient(135deg, rgba(139, 92, 246, 0.05), rgba(236, 72, 153, 0.05));
          border-left: 4px solid #8A5CF6;
          margin-top: var(--space-4);
        }

        .benefits-list {
          list-style: none;
          padding: 0;
          margin: var(--space-3) 0 0;
        }

        .benefits-list li {
          padding: var(--space-2) 0;
          border-bottom: 1px solid rgba(77, 238, 234, 0.1);
        }

        .benefits-list li:last-child {
          border-bottom: none;
        }

        .benefits-list strong {
          color: #4DEEEA;
          display: block;
          margin-bottom: var(--space-1);
        }

        .tools-list {
          list-style: none;
          padding: 0;
          margin: var(--space-3) 0 0;
        }

        .tool-link {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          padding: var(--space-3);
          border-radius: 0.5rem;
          background: rgba(139, 92, 246, 0.03);
          border: 1px solid rgba(139, 92, 246, 0.1);
          text-decoration: none;
          color: inherit;
          transition: all 0.3s ease;
        }

        .tool-link:hover {
          background: rgba(139, 92, 246, 0.08);
          border-color: rgba(139, 92, 246, 0.3);
          box-shadow: 0 4px 12px rgba(139, 92, 246, 0.15);
        }

        .tool-icon {
          font-size: 2rem;
        }

        @media (max-width: 768px) {
          .hero-title {
            font-size: 2rem;
          }

          .hero-subtitle {
            font-size: 1.1rem;
          }

          .hero-logo {
            width: 100px;
            height: 100px;
          }

          .feature-grid {
            grid-template-columns: 1fr;
          }

          .gradient-text {
            font-size: 2rem;
          }

          .mystical-subtitle {
            font-size: 1rem;
          }

          .chart-showcase-container {
            padding: var(--space-3);
          }

          .chart-description-title {
            font-size: 1.5rem;
          }
        }
      `}</style>
    </div>
  );
}

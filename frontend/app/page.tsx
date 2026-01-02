'use client';

import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import HoroscopeForm from "@/components/HoroscopeForm";

const AnimatedBirthChart = dynamic(() => import("@/components/AnimatedBirthChart"), {
  ssr: false,
  loading: () => <div className="chart-loading">Loading chart...</div>,
});

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
        <motion.div className="section-heading mystical-header" variants={itemVariants}>
          <motion.div 
            className="mystical-symbol" 
            aria-hidden="true"
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
            ⭐
          </motion.div>
          <motion.h1 
            className="gradient-text"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
          >
            Birth Chart & Horoscope
          </motion.h1>
          <motion.p 
            className="mystical-subtitle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            Lifetime Predictions with Focus on Important Events
          </motion.p>
          <motion.p 
            className="muted"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
          >
            Comprehensive life analysis focusing on major life events, marriage timing,
            career milestones, transformational periods, and important year-wise predictions
            based on Ancient Bhrigu Samhita principles.
          </motion.p>
        </motion.div>

        {/* Animated Birth Chart Showcase */}
        <motion.div 
          className="chart-showcase-container"
          variants={itemVariants}
        >
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
            >
              <AnimatedBirthChart />
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7, duration: 0.8 }}
            >
              <div className="chart-description">
                <h3 className="chart-description-title">Interactive Birth Chart</h3>
                <p className="chart-description-text">
                  Experience the cosmic blueprint of your life through an interactive visualization 
                  of planetary positions. Each planet's placement reveals unique insights about your 
                  personality, destiny, and karmic path according to Bhrigu Samhita principles.
                </p>
                <div className="chart-features">
                  <div className="feature-item">
                    <span className="feature-icon">🌙</span>
                    <span>12 Houses of Life</span>
                  </div>
                  <div className="feature-item">
                    <span className="feature-icon">✨</span>
                    <span>Planetary Positions</span>
                  </div>
                  <div className="feature-item">
                    <span className="feature-icon">🔮</span>
                    <span>Karmic Insights</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>

        <motion.div className="card highlight mystical-card" variants={itemVariants}>
          <motion.p 
            className="eyebrow"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8 }}
          >
            Focus on Important Life Events
          </motion.p>
          <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
          >
            ⭐ Detailed Lifetime Predictions & Major Milestones
          </motion.h2>
          <motion.p 
            className="muted"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.0 }}
          >
            Enter your birth details to receive a comprehensive horoscope focusing on important 
            life events. Get detailed year-by-year analysis of major milestones including marriage 
            timing, career breakthroughs, property acquisition, children, health transitions, 
            and spiritual awakening — all grounded in Bhrigu Samhita principles.
          </motion.p>
        </motion.div>

        <motion.div className="panel__content--stacked" variants={itemVariants}>
          <HoroscopeForm />
        </motion.div>

        <motion.div className="card info-card" variants={itemVariants}>
          <h3>⭐ Important Life Events You'll Discover</h3>
          <motion.ul 
            className="benefits-list"
            initial="hidden"
            animate="visible"
            variants={{
              visible: {
                transition: {
                  staggerChildren: 0.1,
                  delayChildren: 1.2,
                },
              },
            }}
          >
            {[
              {
                title: "Marriage & Relationships:",
                desc: "Timing, characteristics, and important relationship milestones",
              },
              {
                title: "Career Breakthroughs:",
                desc: "Job changes, promotions, and professional achievements",
              },
              {
                title: "Children & Family:",
                desc: "Family expansion and important parenting phases",
              },
              {
                title: "Property & Assets:",
                desc: "Major purchases, investments, and asset acquisition timing",
              },
              {
                title: "Health Transitions:",
                desc: "Important health events and wellness milestones",
              },
              {
                title: "Financial Milestones:",
                desc: "Wealth accumulation periods and major financial events",
              },
              {
                title: "Spiritual Awakening:",
                desc: "Transformational periods and spiritual growth phases",
              },
              {
                title: "Life Challenges:",
                desc: "Critical periods requiring caution and preparation",
              },
            ].map((benefit, idx) => (
              <motion.li
                key={idx}
                variants={{
                  hidden: { opacity: 0, x: -20 },
                  visible: { opacity: 1, x: 0 },
                }}
              >
                <strong>{benefit.title}</strong> {benefit.desc}
              </motion.li>
            ))}
          </motion.ul>
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
        .mystical-header {
          text-align: center;
          padding: var(--space-5) var(--space-4);
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

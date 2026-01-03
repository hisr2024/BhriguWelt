'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Calendar, MapPin, Settings, LogOut, ArrowLeft, Edit } from 'lucide-react';
import Link from 'next/link';
import AnimatedBackground, { FloatingElements } from '../components/AnimatedBackground';
import GenZCard from '../components/GenZCard';
import GenZBadge from '../components/GenZBadge';
import GenZButton from '../components/GenZButton';
import BottomNav from '../components/BottomNav';

export default function ProfilePage() {
  const [editing, setEditing] = useState(false);

  return (
    <div className="min-h-screen relative overflow-hidden pb-24 md:pb-8">
      <AnimatedBackground />
      <FloatingElements />

      <div className="genz-container py-8 relative z-10">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <GenZButton variant="ghost" size="sm">
            <Link href="/dashboard" className="flex items-center gap-2">
              <ArrowLeft className="w-5 h-5" />
              Back
            </Link>
          </GenZButton>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 text-center"
        >
          {/* Avatar */}
          <motion.div
            className="w-32 h-32 mx-auto mb-6 rounded-full bg-gradient-to-r from-genz-electric-blue to-genz-purple-haze flex items-center justify-center text-6xl shadow-genz-glow"
            whileHover={{ scale: 1.05, rotate: 360 }}
            transition={{ duration: 0.6 }}
          >
            ✨
          </motion.div>

          <GenZBadge variant="neon" className="mb-4">
            Soul Seeker
          </GenZBadge>

          <h1 className="genz-title mb-4">
            Your Profile
          </h1>
          <p className="text-xl text-white/80">
            Manage your cosmic journey
          </p>
        </motion.div>

        {/* Profile Info */}
        <div className="max-w-2xl mx-auto space-y-6 mb-12">
          <GenZCard variant="glass">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-display font-bold text-white">
                Personal Information
              </h2>
              <GenZButton
                variant="outline"
                size="sm"
                onClick={() => setEditing(!editing)}
              >
                <Edit className="w-4 h-4 mr-2" />
                {editing ? 'Save' : 'Edit'}
              </GenZButton>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-genz-electric-blue to-genz-mint-fresh flex items-center justify-center">
                  <User className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-white/60 mb-1">Name</p>
                  <p className="text-white font-medium">John Doe</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-genz-purple-haze to-genz-lavender-dream flex items-center justify-center">
                  <Mail className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-white/60 mb-1">Email</p>
                  <p className="text-white font-medium">john@example.com</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-genz-cyber-yellow to-genz-sunset-orange flex items-center justify-center">
                  <Calendar className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-white/60 mb-1">Birth Date</p>
                  <p className="text-white font-medium">March 15, 1995</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-genz-hot-pink to-genz-coral-pop flex items-center justify-center">
                  <MapPin className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-white/60 mb-1">Birth Place</p>
                  <p className="text-white font-medium">New Delhi, India</p>
                </div>
              </div>
            </div>
          </GenZCard>

          {/* Actions */}
          <GenZCard variant="neon">
            <h2 className="text-2xl font-display font-bold text-white mb-6">
              Quick Actions
            </h2>
            <div className="space-y-3">
              <GenZButton variant="outline" size="lg" fullWidth className="justify-start">
                <Settings className="w-5 h-5 mr-3" />
                Settings & Preferences
              </GenZButton>
              <GenZButton variant="outline" size="lg" fullWidth className="justify-start">
                <LogOut className="w-5 h-5 mr-3" />
                Sign Out
              </GenZButton>
            </div>
          </GenZCard>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}

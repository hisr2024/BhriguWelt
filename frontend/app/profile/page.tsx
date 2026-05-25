'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Calendar, MapPin, Settings, LogOut, ArrowLeft, Edit, Clock, Plus, UserCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AnimatedBackground, { FloatingElements } from '../components/AnimatedBackground';
import GenZCard from '../components/GenZCard';
import GenZBadge from '../components/GenZBadge';
import GenZButton from '../components/GenZButton';
import BottomNav from '../components/BottomNav';
import { useEncryption } from '@/lib/context/EncryptionContext';
import { useEncryptedStorage } from '@/lib/hooks/useEncryptedStorage';
import type { Profile } from '@/lib/types';

export default function ProfilePage() {
  const router = useRouter();
  const { lock } = useEncryption();
  const { getAllProfiles } = useEncryptedStorage();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    try {
      setLoading(true);
      const loadedProfiles = await getAllProfiles();
      setProfiles(loadedProfiles);

      // Get current profile (first one or from localStorage)
      const currentProfileId = localStorage.getItem('current_profile_id');
      if (currentProfileId) {
        const profile = loadedProfiles.find(p => p.id === parseInt(currentProfileId));
        setCurrentProfile(profile || loadedProfiles[0] || null);
      } else if (loadedProfiles.length > 0) {
        setCurrentProfile(loadedProfiles[0] ?? null);
        localStorage.setItem('current_profile_id', loadedProfiles[0]!.id!.toString());
      }
    } catch (error) {
      console.error('Error loading profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => {
    if (!showSignOutConfirm) {
      setShowSignOutConfirm(true);
      return;
    }

    // Lock the app (clear encryption key from memory)
    lock();

    // Clear current session data
    sessionStorage.clear();

    // Redirect to unlock page
    router.push('/unlock');
  };

  const handleSwitchProfile = (profile: Profile) => {
    setCurrentProfile(profile);
    localStorage.setItem('current_profile_id', profile.id!.toString());
  };

  const handleCreateNewProfile = () => {
    router.push('/get-started');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <AnimatedBackground />
        <div className="text-white text-xl">Loading your profile...</div>
      </div>
    );
  }

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
            {currentProfile ? currentProfile.name : 'Your Profile'}
          </h1>
          <p className="text-xl text-white/80">
            Manage your cosmic journey
          </p>
        </motion.div>

        {/* Profile Info */}
        <div className="max-w-2xl mx-auto space-y-6 mb-12">
          {currentProfile && (
            <GenZCard variant="glass">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-display font-bold text-white">
                  Personal Information
                </h2>
                <GenZButton
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/get-started')}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </GenZButton>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-genz-electric-blue to-genz-mint-fresh flex items-center justify-center">
                    <User className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-white/60 mb-1">Name</p>
                    <p className="text-white font-medium">{currentProfile.name}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-genz-cyber-yellow to-genz-sunset-orange flex items-center justify-center">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-white/60 mb-1">Birth Date</p>
                    <p className="text-white font-medium">{currentProfile.dateOfBirth}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-genz-purple-haze to-genz-lavender-dream flex items-center justify-center">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-white/60 mb-1">Birth Time</p>
                    <p className="text-white font-medium">{currentProfile.timeOfBirth}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-genz-hot-pink to-genz-coral-pop flex items-center justify-center">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-white/60 mb-1">Birth Place</p>
                    <p className="text-white font-medium">{currentProfile.placeOfBirth}</p>
                  </div>
                </div>
              </div>
            </GenZCard>
          )}

          {/* Multiple Profiles */}
          {profiles.length > 1 && (
            <GenZCard variant="glass">
              <h2 className="text-2xl font-display font-bold text-white mb-6">
                Switch Profile
              </h2>
              <div className="space-y-3">
                {profiles.map((profile) => (
                  <motion.button
                    key={profile.id}
                    onClick={() => handleSwitchProfile(profile)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${
                      currentProfile?.id === profile.id
                        ? 'bg-gradient-to-r from-genz-electric-blue/20 to-genz-purple-haze/20 border-2 border-genz-electric-blue/50'
                        : 'bg-white/5 hover:bg-white/10 border-2 border-transparent'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      currentProfile?.id === profile.id
                        ? 'bg-gradient-to-r from-genz-electric-blue to-genz-purple-haze'
                        : 'bg-gray-700'
                    }`}>
                      <UserCircle className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-white font-medium">{profile.name}</p>
                      <p className="text-sm text-white/60">{profile.dateOfBirth}</p>
                    </div>
                    {currentProfile?.id === profile.id && (
                      <GenZBadge variant="neon" size="sm">
                        Active
                      </GenZBadge>
                    )}
                  </motion.button>
                ))}
              </div>
            </GenZCard>
          )}

          {/* Add New Profile */}
          <GenZButton
            variant="outline"
            size="lg"
            fullWidth
            onClick={handleCreateNewProfile}
            className="group"
          >
            <Plus className="w-5 h-5 mr-3 group-hover:rotate-90 transition-transform" />
            Create New Profile
          </GenZButton>

          {/* Actions */}
          <GenZCard variant="neon">
            <h2 className="text-2xl font-display font-bold text-white mb-6">
              Quick Actions
            </h2>
            <div className="space-y-3">
              <Link href="/settings">
                <GenZButton variant="outline" size="lg" fullWidth className="justify-start">
                  <Settings className="w-5 h-5 mr-3" />
                  Settings & Preferences
                </GenZButton>
              </Link>
              <GenZButton
                variant="outline"
                size="lg"
                fullWidth
                className={`justify-start ${
                  showSignOutConfirm
                    ? 'border-red-500/50 text-red-400 hover:bg-red-500/10'
                    : ''
                }`}
                onClick={handleSignOut}
              >
                <LogOut className="w-5 h-5 mr-3" />
                {showSignOutConfirm ? 'Confirm Sign Out?' : 'Sign Out'}
              </GenZButton>
              {showSignOutConfirm && (
                <p className="text-sm text-white/60 text-center">
                  Click again to confirm. You'll need to unlock with your passcode.
                </p>
              )}
            </div>
          </GenZCard>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}

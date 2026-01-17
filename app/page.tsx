"use client";

import { useState, useEffect } from "react";
import { ArrowRight, Loader2, User, Briefcase, Play, Plus, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  getUserProfile,
  getAllRoles,
  setActiveRoleId,
  setActiveSessionId,
  setActiveStageId,
  getRoleById,
} from "@/utils/profileStorage";
import { UserProfile, Role, InterviewStage, STORAGE_KEYS } from "@/types/profile";

export default function Home() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<string>("");
  const [selectedStageId, setSelectedStageId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setProfile(getUserProfile());
    const allRoles = getAllRoles();
    setRoles(allRoles);

    // Pre-select first role and stage if available
    if (allRoles.length > 0) {
      setSelectedRoleId(allRoles[0].roleId);
      if (allRoles[0].stages.length > 0) {
        setSelectedStageId(allRoles[0].stages[0].id);
      }
    }
  }, []);

  const selectedRole = roles.find((r) => r.roleId === selectedRoleId);
  const stages = selectedRole?.stages || [];

  const handleRoleChange = (roleId: string) => {
    setSelectedRoleId(roleId);
    const role = roles.find((r) => r.roleId === roleId);
    if (role && role.stages.length > 0) {
      setSelectedStageId(role.stages[0].id);
    } else {
      setSelectedStageId("");
    }
  };

  const handleStartInterview = async () => {
    if (!selectedRoleId || !selectedStageId) return;

    setIsLoading(true);

    try {
      setActiveRoleId(selectedRoleId);
      setActiveStageId(selectedStageId);
      setActiveSessionId(`${Date.now()}-${Math.random().toString(36).substring(2, 9)}`);

      router.push("/interview");
    } catch (error) {
      console.error(error);
      alert("Something went wrong. Please try again.");
      setIsLoading(false);
    }
  };

  // Empty state: No profile
  if (!profile) {
    return (
      <main className="min-h-screen bg-dark-950 text-white flex flex-col items-center justify-center p-4 font-sans">
        <div className="max-w-md text-center space-y-6">
          <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto border border-primary/20">
            <Sparkles className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-3xl font-bold">Welcome to AI Interviewer</h1>
          <p className="text-gray-400">
            Let's set up your profile first. Upload your CV and we'll extract your
            background to personalize your interview practice.
          </p>
          <button
            onClick={() => router.push("/profile")}
            className="btn-primary inline-flex items-center space-x-2 px-6 py-3"
          >
            <User className="w-5 h-5" />
            <span>Set Up Your Profile</span>
          </button>
        </div>
      </main>
    );
  }

  // Empty state: No roles
  if (roles.length === 0) {
    return (
      <main className="min-h-screen bg-dark-950 text-white flex flex-col items-center justify-center p-4 font-sans">
        <div className="max-w-md text-center space-y-6">
          <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto border border-primary/20">
            <Briefcase className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-3xl font-bold">Hey, {profile.name.split(" ")[0]}!</h1>
          <p className="text-gray-400">
            Create your first role to start practicing. Add a job description and
            customize the interview stages.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => router.push("/roles/new")}
              className="btn-primary inline-flex items-center justify-center space-x-2 px-6 py-3"
            >
              <Plus className="w-5 h-5" />
              <span>Create Your First Role</span>
            </button>
          </div>
          <button
            onClick={() => router.push("/profile")}
            className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
          >
            Edit Profile →
          </button>
        </div>
      </main>
    );
  }

  // Main state: Ready to interview
  return (
    <main className="min-h-screen bg-dark-950 text-white flex flex-col relative overflow-hidden font-sans">
      {/* Hero Background */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-1/2 transform -translate-x-1/2 w-[80%] h-[80%] bg-hero-glow blur-[150px] opacity-20 rounded-full"></div>
      </div>

      {/* Header */}
      <header className="z-10 p-4 md:p-6 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <span className="font-semibold">AI Interviewer</span>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.push("/roles")}
            className="text-sm text-gray-400 hover:text-white transition-colors flex items-center space-x-1"
          >
            <Briefcase className="w-4 h-4" />
            <span>Roles</span>
          </button>
          <button
            onClick={() => router.push("/profile")}
            className="text-sm text-gray-400 hover:text-white transition-colors flex items-center space-x-1"
          >
            <User className="w-4 h-4" />
            <span>Profile</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="z-10 flex-1 flex flex-col items-center justify-center p-4 sm:p-8">
        <div className="max-w-lg w-full text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
              Ready to practice,
              <br />
              <span className="text-primary">{profile.name.split(" ")[0]}?</span>
            </h1>
            <p className="text-gray-400 text-lg">
              Select a role and interview stage to begin your mock interview.
            </p>
          </div>

          {/* Selection Card */}
          <div className="glass-panel p-6 rounded-2xl space-y-5 text-left">
            {/* Role Selection */}
            <div className="space-y-2">
              <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider">
                Select Role
              </label>
              <select
                value={selectedRoleId}
                onChange={(e) => {
                  if (e.target.value === "__new__") {
                    router.push("/roles/new");
                  } else {
                    handleRoleChange(e.target.value);
                  }
                }}
                className="w-full bg-dark-900/70 border border-dark-700 rounded-xl px-4 py-3 text-sm focus:border-primary/60 focus:ring-0 transition-all appearance-none"
              >
                {roles.map((role) => (
                  <option key={role.roleId} value={role.roleId}>
                    {role.roleName}
                  </option>
                ))}
                <option value="__new__" className="text-primary">+ New Role</option>
              </select>
            </div>

            {/* Stage Selection */}
            <div className="space-y-2">
              <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider">
                Interview Stage
              </label>
              <select
                value={selectedStageId}
                onChange={(e) => setSelectedStageId(e.target.value)}
                className="w-full bg-dark-900/70 border border-dark-700 rounded-xl px-4 py-3 text-sm focus:border-primary/60 focus:ring-0 transition-all appearance-none"
              >
                {stages.map((stage) => (
                  <option key={stage.id} value={stage.id}>
                    {stage.name}
                  </option>
                ))}
              </select>
              {selectedRole && stages.find((s) => s.id === selectedStageId)?.description && (
                <p className="text-xs text-gray-500">
                  {stages.find((s) => s.id === selectedStageId)?.description}
                </p>
              )}
            </div>

            {/* Start Button */}
            <button
              onClick={handleStartInterview}
              disabled={isLoading || !selectedRoleId || !selectedStageId}
              className="w-full btn-primary flex items-center justify-center space-x-2 py-4 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Starting...</span>
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  <span>Start Interview</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

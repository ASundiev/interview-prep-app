"use client";

import { useState } from "react";
import { Upload, FileText, ArrowRight, Loader2, CheckCircle2, Mic, Zap, MessageSquare } from "lucide-react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [jdFile, setJdFile] = useState<File | null>(null);
  const [recruiterFile, setRecruiterFile] = useState<File | null>(null);
  const [loadingStep, setLoadingStep] = useState("");
  const [interviewType, setInterviewType] = useState<"screening" | "hiring-manager" | "cultural-fit">("screening");
  const [extraContextFile, setExtraContextFile] = useState<File | null>(null);

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (file: File | null) => void
  ) => {
    if (e.target.files && e.target.files[0]) {
      setter(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setLoadingStep("Reading documents...");

    const formData = new FormData();
    if (cvFile) formData.append("cv", cvFile);
    if (jdFile) formData.append("jd", jdFile);
    if (recruiterFile) formData.append("recruiter", recruiterFile);
    formData.append("interviewType", interviewType);
    if (extraContextFile) formData.append("extraContext", extraContextFile);

    try {
      setLoadingStep("Analyzing recruiter profile...");
      const response = await fetch("/api/parse", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to parse documents");
      }

      setLoadingStep("Generating interview strategy...");
      const data = await response.json();
      const contextWithType = { ...data, interviewType };
      localStorage.setItem("interviewContext", JSON.stringify(contextWithType));
      router.push("/interview");
    } catch (error) {
      console.error(error);
      alert("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
      setLoadingStep("");
    }
  };

  return (
    <main className="min-h-screen bg-dark-950 text-white flex flex-col relative overflow-hidden font-sans">


      {/* Hero Background */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-1/2 transform -translate-x-1/2 w-[80%] h-[80%] bg-hero-glow blur-[150px] opacity-20 rounded-full"></div>
      </div>

      <div className="z-10 flex-1 flex flex-col items-center justify-center p-4 sm:p-8">
        <div className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

          {/* Left Column: Text */}
          <div className="space-y-8 text-center lg:text-left">
            <div className="space-y-4">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
                <span className="flex h-2 w-2 rounded-full bg-secondary"></span>
                <span className="text-sm font-medium text-gray-300">AI-Powered Interview Coach</span>
              </div>
              <h1 className="text-5xl sm:text-6xl font-bold tracking-tight leading-[1.1]">
                Master your <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-primary-light to-purple-400">next interview</span>
              </h1>
              <p className="text-lg text-gray-400 max-w-lg mx-auto lg:mx-0 leading-relaxed">
                Upload your CV and job description to practice with an AI interview coach. Get instant feedback and improve your confidence.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 pt-4 sm:grid-cols-2">
              {/* Feature 1 */}
              <div className="flex items-start space-x-3 text-left">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary border border-primary/20">
                    <Mic className="w-5 h-5" />
                  </div>
                </div>
                <div>
                  <h4 className="text-base font-semibold text-white">Voice-Enabled Chat</h4>
                  <p className="mt-1 text-sm text-gray-400 leading-relaxed">Speak naturally with voice-to-text and AI voice responses.</p>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="flex items-start space-x-3 text-left">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary border border-primary/20">
                    <Zap className="w-5 h-5" />
                  </div>
                </div>
                <div>
                  <h4 className="text-base font-semibold text-white">Instant Feedback</h4>
                  <p className="mt-1 text-sm text-gray-400 leading-relaxed">Detailed performance analysis after every session.</p>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="flex items-start space-x-3 text-left">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary border border-primary/20">
                    <FileText className="w-5 h-5" />
                  </div>
                </div>
                <div>
                  <h4 className="text-base font-semibold text-white">Tailored Scenarios</h4>
                  <p className="mt-1 text-sm text-gray-400 leading-relaxed">Questions generated from your specific CV.</p>
                </div>
              </div>

              {/* Feature 4 */}
              <div className="flex items-start space-x-3 text-left">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary border border-primary/20">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                </div>
                <div>
                  <h4 className="text-base font-semibold text-white">Live Transcript</h4>
                  <p className="mt-1 text-sm text-gray-400 leading-relaxed">Review and download your full interview transcript.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Form Card */}
          <div className="w-full">
            <form onSubmit={handleSubmit} className="glass-panel p-8 rounded-3xl shadow-2xl space-y-6 relative overflow-hidden group">
              {/* Card Glow Effect */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[80px] rounded-full pointer-events-none group-hover:bg-primary/20 transition-all duration-500"></div>

              <div className="space-y-2 relative z-10">
                <h3 className="text-xl font-semibold">Start your session</h3>
                <p className="text-sm text-gray-400">Upload your documents to personalize the AI.</p>
              </div>

              {/* CV Upload */}
              <div className="space-y-2 relative z-10">
                <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider">Resume / CV (Optional)</label>
                <div className="relative group/input">
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.txt,.md"
                    onChange={(e) => handleFileChange(e, setCvFile)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                  />
                  <div className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${cvFile ? 'bg-primary/10 border-primary/50' : 'bg-dark-900/50 border-dark-700 group-hover/input:border-primary/50'}`}>
                    <div className="flex items-center space-x-3 text-gray-300">
                      <div className={`p-2 rounded-lg ${cvFile ? 'bg-primary text-white' : 'bg-dark-800 text-gray-500'}`}>
                        <FileText className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-medium truncate max-w-[180px]">{cvFile ? cvFile.name : "Upload Resume / CV"}</span>
                    </div>
                    {cvFile && <CheckCircle2 className="w-5 h-5 text-primary" />}
                  </div>
                </div>
              </div>

              {/* JD Upload */}
              <div className="space-y-2 relative z-10">
                <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider">Job Description (Optional)</label>
                <div className="relative group/input">
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.txt,.md"
                    onChange={(e) => handleFileChange(e, setJdFile)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                  />
                  <div className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${jdFile ? 'bg-primary/10 border-primary/50' : 'bg-dark-900/50 border-dark-700 group-hover/input:border-primary/50'}`}>
                    <div className="flex items-center space-x-3 text-gray-300">
                      <div className={`p-2 rounded-lg ${jdFile ? 'bg-primary text-white' : 'bg-dark-800 text-gray-500'}`}>
                        <FileText className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-medium truncate max-w-[180px]">{jdFile ? jdFile.name : "Upload File"}</span>
                    </div>
                    {jdFile && <CheckCircle2 className="w-5 h-5 text-primary" />}
                  </div>
                </div>
              </div>

              {/* Recruiter Profile */}
              <div className="space-y-2 relative z-10">
                <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider">Recruiter Profile (Optional)</label>
                <div className="relative group/input">
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.txt,.md"
                    onChange={(e) => handleFileChange(e, setRecruiterFile)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                  />
                  <div className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${recruiterFile ? 'bg-primary/10 border-primary/50' : 'bg-dark-900/50 border-dark-700 group-hover/input:border-primary/50'}`}>
                    <div className="flex items-center space-x-3 text-gray-300">
                      <div className={`p-2 rounded-lg ${recruiterFile ? 'bg-primary text-white' : 'bg-dark-800 text-gray-500'}`}>
                        <FileText className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-medium truncate max-w-[180px]">{recruiterFile ? recruiterFile.name : "Upload LinkedIn Profile"}</span>
                    </div>
                    {recruiterFile && <CheckCircle2 className="w-5 h-5 text-primary" />}
                  </div>
                </div>
              </div>

              {/* Extra Context Upload */}
              <div className="space-y-2 relative z-10">
                <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider">Extra Context (Optional)</label>
                <div className="relative group/input">
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.txt,.md"
                    onChange={(e) => handleFileChange(e, setExtraContextFile)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                  />
                  <div className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${extraContextFile ? 'bg-primary/10 border-primary/50' : 'bg-dark-900/50 border-dark-700 group-hover/input:border-primary/50'}`}>
                    <div className="flex items-center space-x-3 text-gray-300">
                      <div className={`p-2 rounded-lg ${extraContextFile ? 'bg-primary text-white' : 'bg-dark-800 text-gray-500'}`}>
                        <FileText className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-medium truncate max-w-[180px]">{extraContextFile ? extraContextFile.name : "Upload file"}</span>
                    </div>
                    {extraContextFile && <CheckCircle2 className="w-5 h-5 text-primary" />}
                  </div>
                </div>
              </div>

              {/* Interview Type */}
              <div className="space-y-2 relative z-10">
                <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider">Interview Type</label>
                <div className="relative">
                  <select
                    value={interviewType}
                    onChange={(e) => setInterviewType(e.target.value as typeof interviewType)}
                    className="input-field w-full text-sm appearance-none bg-dark-900/70 border border-dark-700 rounded-xl px-4 py-3 focus:border-primary/60 focus:ring-0"
                  >
                    <option value="screening">Screening / Recruiter Call</option>
                    <option value="hiring-manager">Hiring Manager Interview</option>
                    <option value="cultural-fit">Cultural Fit / Team Values</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-gray-500">
                    <ArrowRight className="w-4 h-4 rotate-90" />
                  </div>
                </div>
                <p className="text-xs text-gray-500">We'll tailor the AI's tone and questions for this stage.</p>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full btn-primary flex items-center justify-center space-x-2 mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="animate-pulse">{loadingStep}</span>
                  </>
                ) : (
                  <>
                    <span>Start Interview</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}

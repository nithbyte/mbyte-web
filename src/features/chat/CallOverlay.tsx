"use client";

import React, { useRef, useEffect } from "react";
import {
  Phone,
  PhoneOff,
  Video,
  VideoOff,
  Mic,
  MicOff,
  ScreenShare,
  Maximize2,
  Minimize2,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CallSession } from "@/types/chat";

interface CallOverlayProps {
  activeCall: CallSession | null;
  callDuration: number;
  isMuted: boolean;
  isVideoEnabled: boolean;
  isScreenSharing: boolean;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  currentUserId?: string;
  onAccept: () => void;
  onReject: () => void;
  onEndCall: () => void;
  onToggleMute: () => void;
  onToggleVideo: () => void;
  onToggleScreenShare: () => void;
}

export function CallOverlay({
  activeCall,
  callDuration,
  isMuted,
  isVideoEnabled,
  isScreenSharing,
  localStream,
  remoteStream,
  currentUserId,
  onAccept,
  onReject,
  onEndCall,
  onToggleMute,
  onToggleVideo,
  onToggleScreenShare,
}: CallOverlayProps) {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [isMinimized, setIsMinimized] = React.useState(false);

  // Bind local stream
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Bind remote stream
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  if (!activeCall) return null;

  const isIncoming =
    activeCall.status === "RINGING" && activeCall.callerId !== currentUserId;
  const isVideo = activeCall.callType === "VIDEO";
  const partner =
    activeCall.callerId === currentUserId
      ? activeCall.receiver || { firstName: "Team Colleague", lastName: "", email: "", avatarUrl: undefined as string | undefined }
      : activeCall.caller || { firstName: "Incoming Caller", lastName: "", email: "", avatarUrl: undefined as string | undefined };
  const partnerName = `${partner.firstName || ""} ${partner.lastName || ""}`.trim() || "Colleague";

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Incoming Call Ringing Overlay
  if (isIncoming) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in">
        <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-700/60 p-6 text-white text-center shadow-2xl relative overflow-hidden">
          <div className="absolute -top-16 -left-16 w-48 h-48 bg-orange-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -right-16 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

          {/* Caller Avatar Pulse */}
          <div className="relative mx-auto my-6 w-28 h-28 flex items-center justify-center">
            <span className="absolute inset-0 rounded-full bg-emerald-500/30 animate-ping" />
            <span className="absolute -inset-3 rounded-full bg-emerald-500/10 animate-pulse" />
            <div className="relative w-24 h-24 rounded-full bg-gradient-to-tr from-slate-800 to-slate-700 border-2 border-emerald-400 flex items-center justify-center text-3xl font-bold text-white shadow-xl">
              {partner.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={partner.avatarUrl}
                  alt={partnerName}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                partnerName.slice(0, 2).toUpperCase()
              )}
            </div>
          </div>

          <h3 className="text-xl font-bold tracking-tight text-white">{partnerName}</h3>
          <p className="mt-1 text-sm text-emerald-400 font-medium">
            Incoming {isVideo ? "Video" : "Audio"} Call...
          </p>

          <div className="mt-8 flex items-center justify-center gap-6">
            {/* Reject Button */}
            <button
              onClick={onReject}
              className="flex flex-col items-center gap-1 group cursor-pointer"
            >
              <div className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-500 flex items-center justify-center text-white shadow-lg transition-transform active:scale-95 group-hover:scale-105">
                <PhoneOff className="w-6 h-6" />
              </div>
              <span className="text-xs text-slate-300 font-medium">Decline</span>
            </button>

            {/* Accept Button */}
            <button
              onClick={onAccept}
              className="flex flex-col items-center gap-1 group cursor-pointer"
            >
              <div className="w-14 h-14 rounded-full bg-emerald-600 hover:bg-emerald-500 flex items-center justify-center text-white shadow-lg transition-transform active:scale-95 group-hover:scale-105 animate-bounce">
                {isVideo ? <Video className="w-6 h-6" /> : <Phone className="w-6 h-6" />}
              </div>
              <span className="text-xs text-emerald-300 font-medium">Accept</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Active or Outgoing Call
  return (
    <div
      className={cn(
        "fixed z-50 transition-all duration-300 shadow-2xl overflow-hidden",
        isMinimized
          ? "bottom-6 right-6 w-72 h-44 rounded-2xl border border-slate-700 bg-slate-900"
          : "fixed inset-0 sm:inset-6 md:inset-10 lg:inset-14 max-w-5xl max-h-[85vh] m-auto rounded-3xl border border-slate-800 bg-slate-950 flex flex-col"
      )}
    >
      {/* Top Header Bar */}
      <div className="flex items-center justify-between px-5 py-3.5 bg-slate-900/80 backdrop-blur border-b border-slate-800 z-10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
          <div>
            <h4 className="text-sm font-semibold text-white truncate max-w-[200px] sm:max-w-xs">
              {partnerName}
            </h4>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>{activeCall.status === "CONNECTED" ? formatDuration(callDuration) : "Connecting..."}</span>
              <span>•</span>
              <span className="capitalize">{activeCall.callType.toLowerCase()} Call</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title={isMinimized ? "Maximize" : "Minimize"}
          >
            {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main View Area */}
      <div className="relative flex-1 bg-gradient-to-b from-slate-950 via-slate-900 to-black flex items-center justify-center overflow-hidden">
        {isVideo ? (
          <>
            {/* Remote Video Stream */}
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />

            {/* If remote stream has no video track active yet */}
            {(!remoteStream || remoteStream.getVideoTracks().length === 0) && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-slate-950/70">
                <div className="w-24 h-24 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center text-3xl font-bold text-white mb-4 shadow-xl">
                  {partnerName.slice(0, 2).toUpperCase()}
                </div>
                <h3 className="text-lg font-medium text-white">{partnerName}</h3>
                <p className="text-xs text-slate-400 mt-1">
                  {activeCall.status === "CONNECTED" ? "Connected (Audio Active)" : "Ringing..."}
                </p>
              </div>
            )}

            {/* Local Video PIP (Picture-in-Picture) */}
            <div
              className={cn(
                "absolute bottom-4 right-4 rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl transition-all duration-200 bg-slate-900",
                isMinimized ? "w-20 h-16" : "w-36 h-28 sm:w-48 sm:h-36"
              )}
            >
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className={cn(
                  "w-full h-full object-cover",
                  !isVideoEnabled && "hidden"
                )}
              />
              {!isVideoEnabled && (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 text-xs bg-slate-900">
                  <VideoOff className="w-5 h-5 mb-1" />
                  <span>Camera Off</span>
                </div>
              )}
              <div className="absolute top-1 left-2 text-[10px] bg-black/60 px-1.5 py-0.5 rounded text-white font-medium">
                You
              </div>
            </div>
          </>
        ) : (
          /* Audio Call Visualizer Screen */
          <div className="flex flex-col items-center justify-center text-center p-8">
            <div className="relative mb-6">
              <span className="absolute -inset-4 rounded-full bg-orange-500/20 animate-ping" />
              <div className="relative w-28 h-28 rounded-full bg-gradient-to-tr from-orange-500 to-amber-600 border-4 border-slate-800 flex items-center justify-center text-3xl font-bold text-white shadow-2xl">
                {partner.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={partner.avatarUrl}
                    alt={partnerName}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  partnerName.slice(0, 2).toUpperCase()
                )}
              </div>
            </div>

            <h3 className="text-xl font-bold text-white">{partnerName}</h3>
            <p className="text-sm text-slate-400 mt-1">
              {activeCall.status === "CONNECTED"
                ? `In Call • ${formatDuration(callDuration)}`
                : "Calling..."}
            </p>

            <div className="mt-4 flex items-center gap-1.5 h-6">
              {[40, 70, 100, 60, 90, 45, 80, 55, 30].map((h, i) => (
                <div
                  key={i}
                  className="w-1 bg-[#FF6B00] rounded-full animate-pulse"
                  style={{
                    height: `${activeCall.status === "CONNECTED" ? h : 20}%`,
                    animationDelay: `${i * 120}ms`,
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Floating Control Bar */}
      <div className="p-4 bg-slate-900/95 backdrop-blur border-t border-slate-800 flex items-center justify-center gap-4 shrink-0">
        {/* Mute Mic */}
        <button
          onClick={onToggleMute}
          className={cn(
            "p-3 rounded-2xl transition-all cursor-pointer shadow-md",
            isMuted
              ? "bg-red-500/20 text-red-400 border border-red-500/40"
              : "bg-slate-800 text-white hover:bg-slate-700"
          )}
          title={isMuted ? "Unmute Microphone" : "Mute Microphone"}
        >
          {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>

        {/* Video Camera Toggle (for video calls) */}
        {isVideo && (
          <button
            onClick={onToggleVideo}
            className={cn(
              "p-3 rounded-2xl transition-all cursor-pointer shadow-md",
              !isVideoEnabled
                ? "bg-red-500/20 text-red-400 border border-red-500/40"
                : "bg-slate-800 text-white hover:bg-slate-700"
            )}
            title={isVideoEnabled ? "Turn Camera Off" : "Turn Camera On"}
          >
            {isVideoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
          </button>
        )}

        {/* Screen Share */}
        {isVideo && (
          <button
            onClick={onToggleScreenShare}
            className={cn(
              "p-3 rounded-2xl transition-all cursor-pointer shadow-md hidden sm:flex",
              isScreenSharing
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                : "bg-slate-800 text-white hover:bg-slate-700"
            )}
            title={isScreenSharing ? "Stop Presenting" : "Share Screen"}
          >
            <ScreenShare className="w-5 h-5" />
          </button>
        )}

        {/* End Call Button */}
        <button
          onClick={onEndCall}
          className="px-6 py-3 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-semibold flex items-center gap-2 shadow-lg hover:shadow-red-500/20 transition-all cursor-pointer active:scale-95"
        >
          <PhoneOff className="w-5 h-5" />
          <span className="text-xs sm:text-sm">End Call</span>
        </button>
      </div>
    </div>
  );
}

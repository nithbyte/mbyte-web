"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { chatService } from "@/services/chatService";
import { CallSession, CallType, CallStatus } from "@/types/chat";

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
  ],
};

export interface WebRTCCallState {
  activeCall: CallSession | null;
  callDuration: number;
  isMuted: boolean;
  isVideoEnabled: boolean;
  isScreenSharing: boolean;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  connectionState: RTCPeerConnectionState | "idle" | "calling" | "ringing";
  error: string | null;
}

export function useWebRTCCall(currentUserId?: string, enabled: boolean = true) {
  const [activeCall, setActiveCall] = useState<CallSession | null>(null);
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [connectionState, setConnectionState] = useState<RTCPeerConnectionState | "idle" | "calling" | "ringing">("idle");
  const [error, setError] = useState<string | null>(null);

  const activeCallRef = useRef<CallSession | null>(null);
  const dismissedCallIdsRef = useRef<Set<string>>(new Set());
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const durationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const signalPollerRef = useRef<NodeJS.Timeout | null>(null);
  const incomingCheckTimerRef = useRef<NodeJS.Timeout | null>(null);
  const processedSignalIdsRef = useRef<Set<string>>(new Set());
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);

  useEffect(() => {
    activeCallRef.current = activeCall;
  }, [activeCall]);

  // Start duration timer STRICTLY once call is attended (CONNECTED)
  const startDurationTimer = useCallback((connectedAt?: string | null) => {
    if (durationTimerRef.current) return;
    const baseMs = connectedAt ? new Date(connectedAt).getTime() : Date.now();
    const initialElapsed = Number.isFinite(baseMs)
      ? Math.max(0, Math.floor((Date.now() - baseMs) / 1000))
      : 0;
    setCallDuration(initialElapsed);
    durationTimerRef.current = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
  }, []);

  // Cleanup helper
  const cleanUpStreamsAndPC = useCallback(() => {
    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current);
      durationTimerRef.current = null;
    }
    if (signalPollerRef.current) {
      clearInterval(signalPollerRef.current);
      signalPollerRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
      setLocalStream(null);
    }
    if (remoteStreamRef.current) {
      remoteStreamRef.current.getTracks().forEach((track) => track.stop());
      remoteStreamRef.current = null;
      setRemoteStream(null);
    }
    if (pcRef.current) {
      try {
        pcRef.current.close();
      } catch {
        // ignore
      }
      pcRef.current = null;
    }
    pendingCandidatesRef.current = [];
    processedSignalIdsRef.current.clear();
    setConnectionState("idle");
    setCallDuration(0);
    setIsMuted(false);
    setIsScreenSharing(false);
  }, []);

  // Flush queued ICE candidates after remote description is set
  const flushPendingCandidates = useCallback(async (pc: RTCPeerConnection) => {
    while (pendingCandidatesRef.current.length > 0) {
      const candidate = pendingCandidatesRef.current.shift();
      if (candidate) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.warn("Flushing ICE candidate error:", err);
        }
      }
    }
  }, []);

  // Setup PeerConnection
  const createPeerConnection = useCallback((callId: string) => {
    if (typeof window === "undefined" || !window.RTCPeerConnection) return null;

    const pc = new RTCPeerConnection(RTC_CONFIG);
    pcRef.current = pc;

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        chatService.sendSignal(callId, "ICE_CANDIDATE", event.candidate);
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState) {
        setConnectionState(pc.connectionState);
      }
      // Do NOT start duration timer here before the callee has explicitly accepted (status === "CONNECTED").
      // Remote hangup / end is driven authoritatively by backend CallSession status and END/REJECT signals.
    };

    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        remoteStreamRef.current = event.streams[0];
        setRemoteStream(event.streams[0]);
      } else {
        if (!remoteStreamRef.current) {
          remoteStreamRef.current = new MediaStream();
        }
        remoteStreamRef.current.addTrack(event.track);
        setRemoteStream(new MediaStream(remoteStreamRef.current.getTracks()));
      }
    };

    return pc;
  }, []);

  // Request user media safely with animated canvas and audio fallback
  const acquireMedia = useCallback(async (callType: CallType) => {
    if (typeof navigator !== "undefined" && navigator.mediaDevices?.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: callType === "VIDEO" ? { width: { ideal: 1280 }, height: { ideal: 720 } } : false,
        });
        localStreamRef.current = stream;
        setLocalStream(stream);
        setIsVideoEnabled(callType === "VIDEO");
        return stream;
      } catch (err: any) {
        console.warn("Hardware media access failed, trying audio-only + simulated video:", err);
      }
    }

    // Fallback: animated canvas & audio synth so WebRTC peer connection always has active tracks
    const canvas = document.createElement("canvas");
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext("2d");
    let frame = 0;
    const draw = () => {
      if (!ctx) return;
      frame++;
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(0, 0, 640, 480);
      const radius = 55 + Math.sin(frame * 0.1) * 15;
      ctx.beginPath();
      ctx.arc(320, 200, radius, 0, Math.PI * 2);
      ctx.fillStyle = "#ff6b00";
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 24px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(callType === "VIDEO" ? "Video Active" : "Audio Active", 320, 310);
      ctx.font = "14px sans-serif";
      ctx.fillStyle = "#94a3b8";
      ctx.fillText("Connected", 320, 345);
      if (localStreamRef.current) {
        requestAnimationFrame(draw);
      }
    };
    draw();

    const mockVideoStream = canvas.captureStream ? canvas.captureStream(25) : new MediaStream();

    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      gain.gain.value = 0.001;
      osc.connect(gain);
      const dst = audioCtx.createMediaStreamDestination();
      gain.connect(dst);
      osc.start();
      const audioTrack = dst.stream.getAudioTracks()[0];
      if (audioTrack) {
        mockVideoStream.addTrack(audioTrack);
      }
    } catch (e) {
      // AudioContext unavailable
    }

    localStreamRef.current = mockVideoStream;
    setLocalStream(mockVideoStream);
    setIsVideoEnabled(callType === "VIDEO");
    return mockVideoStream;
  }, []);

  // Poll for peer signals (SDP Offer/Answer/ICE) and remote call state
  const startSignalPolling = useCallback((callId: string) => {
    if (signalPollerRef.current) clearInterval(signalPollerRef.current);

    signalPollerRef.current = setInterval(async () => {
      try {
        // 1. Synchronize authoritative remote call status from backend
        const remoteSession = await chatService.getCallSession(callId);
        if (remoteSession) {
          if (
            remoteSession.status === "REJECTED" ||
            remoteSession.status === "ENDED" ||
            remoteSession.status === "MISSED"
          ) {
            dismissedCallIdsRef.current.add(callId);
            cleanUpStreamsAndPC();
            setActiveCall(null);
            return;
          }
          if (remoteSession.status === "CONNECTED") {
            setActiveCall((prev) =>
              prev && prev.status !== "CONNECTED"
                ? { ...prev, status: "CONNECTED", connectedAt: remoteSession.connectedAt }
                : prev
            );
            startDurationTimer(remoteSession.connectedAt);
          }
        }

        // 2. Process signaling queue (END/REJECT checked even before PC is ready)
        const signals = await chatService.getSignals(callId);
        if (!Array.isArray(signals)) return;

        for (const sig of signals) {
          const sigKey = sig.id || `${sig.type}_${sig.createdAt}`;
          if (processedSignalIdsRef.current.has(sigKey)) continue;
          if (sig.senderId === currentUserId) continue; // Ignore own signals

          processedSignalIdsRef.current.add(sigKey);

          if (sig.type === "END" || sig.type === "REJECT" || sig.type === "BYE" || sig.type === "END_CALL") {
            dismissedCallIdsRef.current.add(callId);
            cleanUpStreamsAndPC();
            setActiveCall(null);
            return;
          }

          const pc = pcRef.current;
          if (!pc) continue;

          if (sig.type === "OFFER" && sig.payload) {
            if (pc.signalingState === "stable" || pc.signalingState === "have-local-offer") {
              await pc.setRemoteDescription(new RTCSessionDescription(sig.payload));
              await flushPendingCandidates(pc);
              const answer = await pc.createAnswer();
              await pc.setLocalDescription(answer);
              await chatService.sendSignal(callId, "ANSWER", answer);
            }
          } else if (sig.type === "ANSWER" && sig.payload) {
            if (pc.signalingState === "have-local-offer") {
              await pc.setRemoteDescription(new RTCSessionDescription(sig.payload));
              await flushPendingCandidates(pc);
            }
          } else if (sig.type === "ICE_CANDIDATE" && sig.payload) {
            if (!pc.remoteDescription) {
              pendingCandidatesRef.current.push(sig.payload);
            } else {
              try {
                await pc.addIceCandidate(new RTCIceCandidate(sig.payload));
              } catch (iceErr) {
                console.warn("ICE candidate addition error:", iceErr);
              }
            }
          }
        }
      } catch {
        // Suppress transient network poll errors
      }
    }, 1000);
  }, [cleanUpStreamsAndPC, currentUserId, flushPendingCandidates, startDurationTimer]);

  // Initiate an Outgoing Call
  const startCall = useCallback(
    async (conversationId: string, receiverId: string, receiverName: string, type: CallType) => {
      try {
        cleanUpStreamsAndPC();
        setError(null);
        setConnectionState("calling");

        const stream = await acquireMedia(type);
        const session = await chatService.initiateCall({
          conversationId,
          receiverId,
          callType: type,
          callerId: currentUserId,
        });

        const callId = session?.id || session?.callId;
        if (callId) {
          dismissedCallIdsRef.current.delete(callId);
        }

        // Outgoing calls ALWAYS start in RINGING state; timer begins only after callee attends (CONNECTED)
        const enrichedSession: CallSession = {
          ...session,
          id: callId,
          callerId: session?.callerId || currentUserId,
          receiverId: session?.receiverId || receiverId,
          status: "RINGING",
          receiver: session?.receiver || {
            firstName: receiverName.split(" ")[0] || receiverName,
            lastName: receiverName.split(" ").slice(1).join(" ") || "",
          },
        };

        setActiveCall(enrichedSession);

        const pc = createPeerConnection(callId);
        if (pc && stream) {
          try {
            stream.getTracks().forEach((track) => pc.addTrack(track, stream));
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            await chatService.sendSignal(callId, "OFFER", offer);
          } catch (pcErr) {
            console.warn("WebRTC local track negotiation error:", pcErr);
          }
        }

        startSignalPolling(callId);
      } catch (err: any) {
        console.warn("Failed to start call:", err);
        setError(err.message || "Failed to start call");
      }
    },
    [acquireMedia, cleanUpStreamsAndPC, createPeerConnection, currentUserId, startSignalPolling]
  );

  // Accept Incoming Call
  const acceptCall = useCallback(async () => {
    const current = activeCallRef.current;
    if (!current) return;
    try {
      setConnectionState("connecting");
      const stream = await acquireMedia(current.callType);
      const callId = current.id || (current as any).callId;
      const updated = await chatService.respondToCall(callId, "CONNECTED");
      setActiveCall((prev) =>
        prev
          ? { ...prev, status: "CONNECTED", connectedAt: updated?.connectedAt || new Date().toISOString() }
          : updated
      );

      const pc = createPeerConnection(callId);
      if (pc && stream) {
        stream.getTracks().forEach((track) => pc.addTrack(track, stream));
      }

      // Start duration timer strictly upon attending
      startDurationTimer(updated?.connectedAt);
      startSignalPolling(callId);
    } catch (err: any) {
      setError(err.message || "Failed to accept call");
    }
  }, [acquireMedia, createPeerConnection, startDurationTimer, startSignalPolling]);

  // Reject Incoming Call
  const rejectCall = useCallback(async () => {
    const current = activeCallRef.current;
    if (!current) return;
    const callId = current.id || (current as any).callId;
    if (callId) {
      dismissedCallIdsRef.current.add(callId);
    }
    try {
      await chatService.sendSignal(callId, "REJECT", { reason: "rejected" });
      await chatService.respondToCall(callId, "REJECTED");
    } finally {
      cleanUpStreamsAndPC();
      setActiveCall(null);
    }
  }, [cleanUpStreamsAndPC]);

  // End Active Call (Hangs up on both sides)
  const endCall = useCallback(async () => {
    const current = activeCallRef.current;
    if (current) {
      const callId = current.id || (current as any).callId;
      if (callId) {
        dismissedCallIdsRef.current.add(callId);
      }
      try {
        await chatService.sendSignal(callId, "END", { reason: "ended" });
        await chatService.endCall(callId);
      } catch (err) {
        console.warn("End call remote failed:", err);
      }
    }
    cleanUpStreamsAndPC();
    setActiveCall(null);
  }, [cleanUpStreamsAndPC]);

  // Toggle Mute Audio
  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      audioTracks.forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsMuted((prev) => !prev);
    }
  }, []);

  // Toggle Camera Video
  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      const videoTracks = localStreamRef.current.getVideoTracks();
      videoTracks.forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsVideoEnabled((prev) => !prev);
    }
  }, []);

  // Toggle Screen Share
  const toggleScreenShare = useCallback(async () => {
    if (isScreenSharing) {
      if (activeCall) {
        await acquireMedia(activeCall.callType);
        setIsScreenSharing(false);
      }
      return;
    }

    try {
      if (typeof navigator !== "undefined" && navigator.mediaDevices?.getDisplayMedia) {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = screenStream.getVideoTracks()[0];

        if (pcRef.current) {
          const sender = pcRef.current.getSenders().find((s) => s.track?.kind === "video");
          if (sender) {
            sender.replaceTrack(screenTrack);
          }
        }

        screenTrack.onended = () => {
          setIsScreenSharing(false);
          if (activeCall) acquireMedia(activeCall.callType);
        };

        localStreamRef.current = screenStream;
        setLocalStream(screenStream);
        setIsScreenSharing(true);
      }
    } catch (err) {
      console.warn("Screen share error:", err);
    }
  }, [isScreenSharing, activeCall, acquireMedia]);

  // Periodic check for incoming calls and remote hangup while ringing
  useEffect(() => {
    if (!currentUserId || !enabled) return;

    incomingCheckTimerRef.current = setInterval(async () => {
      const current = activeCallRef.current;
      if (!current) {
        // No active call: check if one is ringing for us
        try {
          const incoming = await chatService.getActiveCall();
          const incomingId = incoming?.id || (incoming as any)?.callId;
          if (
            incoming &&
            incomingId &&
            !dismissedCallIdsRef.current.has(incomingId) &&
            incoming.status === "RINGING" &&
            incoming.callerId !== currentUserId &&
            (!incoming.receiverId || incoming.receiverId === currentUserId)
          ) {
            setActiveCall(incoming);
            setConnectionState("ringing");

            // Show browser notification if permitted (alerts admin even in background tab)
            if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
              try {
                const callerLabel = incoming.caller
                  ? `${incoming.caller.firstName || ""} ${incoming.caller.lastName || ""}`.trim()
                  : "Team Member";
                new Notification(`Incoming ${incoming.callType === "VIDEO" ? "Video" : "Voice"} Call`, {
                  body: `${callerLabel || "Colleague"} is calling you on MByte`,
                  tag: `mbyte-call-${incomingId}`,
                  requireInteraction: true,
                });
              } catch {
                // ignore notification API errors
              }
            }
          }
        } catch {
          // suppress transient poll errors
        }
      } else if (current.status === "RINGING") {
        // Call is ringing: check if caller cancelled or call ended remotely
        const callId = current.id || (current as any).callId;
        if (callId) {
          try {
            const remote = await chatService.getCallSession(callId);
            if (!remote || remote.status === "ENDED" || remote.status === "REJECTED" || remote.status === "MISSED") {
              dismissedCallIdsRef.current.add(callId);
              cleanUpStreamsAndPC();
              setActiveCall(null);
            }
          } catch {
            // ignore
          }
        }
      }
    }, 1200);

    return () => {
      if (incomingCheckTimerRef.current) clearInterval(incomingCheckTimerRef.current);
    };
  }, [cleanUpStreamsAndPC, currentUserId, enabled]);

  // Cleanup all timers and streams on unmount
  useEffect(() => {
    return () => {
      cleanUpStreamsAndPC();
    };
  }, [cleanUpStreamsAndPC]);

  return {
    activeCall,
    callDuration,
    isMuted,
    isVideoEnabled,
    isScreenSharing,
    localStream,
    remoteStream,
    connectionState,
    error,
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleVideo,
    toggleScreenShare,
  };
}

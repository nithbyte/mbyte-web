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

export function useWebRTCCall(currentUserId?: string) {
  const [activeCall, setActiveCall] = useState<CallSession | null>(null);
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [connectionState, setConnectionState] = useState<RTCPeerConnectionState | "idle" | "calling" | "ringing">("idle");
  const [error, setError] = useState<string | null>(null);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const durationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const signalPollerRef = useRef<NodeJS.Timeout | null>(null);
  const incomingCheckTimerRef = useRef<NodeJS.Timeout | null>(null);
  const processedSignalIdsRef = useRef<Set<string>>(new Set());

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
      pcRef.current.close();
      pcRef.current = null;
    }
    processedSignalIdsRef.current.clear();
    setConnectionState("idle");
    setCallDuration(0);
    setIsMuted(false);
    setIsScreenSharing(false);
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
      if (pc.connectionState === "connected") {
        if (!durationTimerRef.current) {
          durationTimerRef.current = setInterval(() => {
            setCallDuration((prev) => prev + 1);
          }, 1000);
        }
      } else if (pc.connectionState === "disconnected" || pc.connectionState === "failed" || pc.connectionState === "closed") {
        // Disconnected
      }
    };

    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        remoteStreamRef.current = event.streams[0];
        setRemoteStream(event.streams[0]);
      } else {
        const stream = new MediaStream([event.track]);
        remoteStreamRef.current = stream;
        setRemoteStream(stream);
      }
    };

    return pc;
  }, []);

  // Request user media safely
  const acquireMedia = useCallback(async (callType: CallType) => {
    try {
      if (typeof navigator !== "undefined" && navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: callType === "VIDEO" ? { width: { ideal: 1280 }, height: { ideal: 720 } } : false,
        });
        localStreamRef.current = stream;
        setLocalStream(stream);
        setIsVideoEnabled(callType === "VIDEO");
        return stream;
      }
    } catch (err: any) {
      console.warn("Could not acquire actual media hardware (fallback simulation used):", err);
    }

    // Mock/Simulated stream canvas/audio for demo environments without webcam
    const canvas = document.createElement("canvas");
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "#1e293b";
      ctx.fillRect(0, 0, 640, 480);
      ctx.fillStyle = "#ffffff";
      ctx.font = "24px sans-serif";
      ctx.fillText(callType === "VIDEO" ? "Camera Preview" : "Audio Active", 220, 240);
    }
    const mockVideoStream = canvas.captureStream ? canvas.captureStream(10) : new MediaStream();
    localStreamRef.current = mockVideoStream;
    setLocalStream(mockVideoStream);
    setIsVideoEnabled(callType === "VIDEO");
    return mockVideoStream;
  }, []);

  // Poll for peer signals (SDP Offer/Answer/ICE)
  const startSignalPolling = useCallback((callId: string) => {
    if (signalPollerRef.current) clearInterval(signalPollerRef.current);

    signalPollerRef.current = setInterval(async () => {
      try {
        const signals = await chatService.getSignals(callId);
        if (!Array.isArray(signals)) return;

        for (const sig of signals) {
          const sigKey = sig.id || `${sig.type}_${sig.createdAt}`;
          if (processedSignalIdsRef.current.has(sigKey)) continue;
          if (sig.senderId === currentUserId) continue; // Ignore own signals

          processedSignalIdsRef.current.add(sigKey);
          const pc = pcRef.current;
          if (!pc) continue;

          if (sig.type === "OFFER" && sig.payload) {
            await pc.setRemoteDescription(new RTCSessionDescription(sig.payload));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            await chatService.sendSignal(callId, "ANSWER", answer);
          } else if (sig.type === "ANSWER" && sig.payload) {
            await pc.setRemoteDescription(new RTCSessionDescription(sig.payload));
          } else if (sig.type === "ICE_CANDIDATE" && sig.payload) {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(sig.payload));
            } catch (iceErr) {
              console.warn("ICE candidate addition error:", iceErr);
            }
          }
        }
      } catch (err) {
        // Suppress transient network poll errors
      }
    }, 1500);
  }, [currentUserId]);

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
        });

        setActiveCall(session);

        const pc = createPeerConnection(session.id);
        if (pc && stream) {
          stream.getTracks().forEach((track) => pc.addTrack(track, stream));
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          await chatService.sendSignal(session.id, "OFFER", offer);
        }

        startSignalPolling(session.id);
      } catch (err: any) {
        setError(err.message || "Failed to start call");
        cleanUpStreamsAndPC();
        setActiveCall(null);
      }
    },
    [acquireMedia, cleanUpStreamsAndPC, createPeerConnection, startSignalPolling]
  );

  // Accept Incoming Call
  const acceptCall = useCallback(async () => {
    if (!activeCall) return;
    try {
      setConnectionState("connecting");
      const stream = await acquireMedia(activeCall.callType);
      const updated = await chatService.respondToCall(activeCall.id, "CONNECTED");
      setActiveCall((prev) => (prev ? { ...prev, status: "CONNECTED" } : updated));

      const pc = createPeerConnection(activeCall.id);
      if (pc && stream) {
        stream.getTracks().forEach((track) => pc.addTrack(track, stream));
      }

      startSignalPolling(activeCall.id);

      // Start duration timer
      if (!durationTimerRef.current) {
        durationTimerRef.current = setInterval(() => {
          setCallDuration((prev) => prev + 1);
        }, 1000);
      }
    } catch (err: any) {
      setError(err.message || "Failed to accept call");
    }
  }, [activeCall, acquireMedia, createPeerConnection, startSignalPolling]);

  // Reject Incoming Call
  const rejectCall = useCallback(async () => {
    if (!activeCall) return;
    try {
      await chatService.respondToCall(activeCall.id, "REJECTED");
    } finally {
      cleanUpStreamsAndPC();
      setActiveCall(null);
    }
  }, [activeCall, cleanUpStreamsAndPC]);

  // End Active Call
  const endCall = useCallback(async () => {
    if (activeCall) {
      try {
        await chatService.endCall(activeCall.id);
      } catch (err) {
        console.warn("End call remote failed:", err);
      }
    }
    cleanUpStreamsAndPC();
    setActiveCall(null);
  }, [activeCall, cleanUpStreamsAndPC]);

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
      // Revert to camera
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

  // Periodic check for incoming calls
  useEffect(() => {
    incomingCheckTimerRef.current = setInterval(async () => {
      // If we don't have an active call, check if one is ringing for us
      if (!activeCall) {
        const incoming = await chatService.getActiveCall();
        if (incoming && incoming.status === "RINGING" && incoming.receiverId === currentUserId) {
          setActiveCall(incoming);
          setConnectionState("ringing");
        }
      }
    }, 4000);

    return () => {
      if (incomingCheckTimerRef.current) clearInterval(incomingCheckTimerRef.current);
      cleanUpStreamsAndPC();
    };
  }, [activeCall, currentUserId, cleanUpStreamsAndPC]);

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


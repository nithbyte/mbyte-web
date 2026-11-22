"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { chatService } from "@/services/chatService";
import { CallSession, CallType } from "@/types/chat";

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
  ],
};

export interface AudioInputDeviceOption {
  deviceId: string;
  label: string;
}

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
  hasRealMic: boolean;
  micError: string | null;
  micLevel: number;
  audioInputDevices: AudioInputDeviceOption[];
  selectedAudioDeviceId: string;
}

function formatMediaError(err: any): string {
  const name = err?.name || "";
  if (typeof window !== "undefined" && !window.isSecureContext && window.location.hostname !== "localhost") {
    return "Browser blocks microphone on non-HTTPS URLs. Open Admin Web via localhost or HTTPS.";
  }
  if (name === "NotAllowedError" || name === "PermissionDeniedError") {
    return "Microphone permission was blocked. Allow mic access in browser address bar and click Retry Mic.";
  }
  if (name === "NotFoundError" || name === "DevicesNotFoundError") {
    return "No microphone detected on this device. Connect a mic/headset and click Retry Mic.";
  }
  if (name === "NotReadableError" || name === "TrackStartError") {
    return "Microphone is busy in another app or tab. Close the other app or pick another mic.";
  }
  return err?.message || "Could not access microphone. Check browser permissions and click Retry Mic.";
}

export function useWebRTCCall(currentUserId?: string, enabled: boolean = true) {
  const [activeCall, setActiveCall] = useState<CallSession | null>(null);
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [connectionState, setConnectionState] = useState<
    RTCPeerConnectionState | "idle" | "calling" | "ringing"
  >("idle");
  const [error, setError] = useState<string | null>(null);

  // Microphone diagnostics & live switcher state
  const [hasRealMic, setHasRealMic] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [micLevel, setMicLevel] = useState(0);
  const [audioInputDevices, setAudioInputDevices] = useState<AudioInputDeviceOption[]>([]);
  const [selectedAudioDeviceId, setSelectedAudioDeviceId] = useState<string>("");

  const activeCallRef = useRef<CallSession | null>(null);
  const isMutedRef = useRef<boolean>(false);
  const dismissedCallIdsRef = useRef<Set<string>>(new Set());
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const durationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const signalPollerRef = useRef<NodeJS.Timeout | null>(null);
  const incomingCheckTimerRef = useRef<NodeJS.Timeout | null>(null);
  const processedSignalIdsRef = useRef<Set<string>>(new Set());
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);

  // Audio analyser refs for live speaking meter
  const micAnalyserCtxRef = useRef<AudioContext | null>(null);
  const micMeterRafRef = useRef<number | null>(null);

  useEffect(() => {
    activeCallRef.current = activeCall;
  }, [activeCall]);

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  const stopMicMeter = useCallback(() => {
    if (micMeterRafRef.current !== null) {
      cancelAnimationFrame(micMeterRafRef.current);
      micMeterRafRef.current = null;
    }
    if (micAnalyserCtxRef.current) {
      micAnalyserCtxRef.current.close().catch(() => {});
      micAnalyserCtxRef.current = null;
    }
    setMicLevel(0);
  }, []);

  const startMicMeter = useCallback(
    (stream: MediaStream) => {
      stopMicMeter();
      if (typeof window === "undefined") return;
      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length === 0) return;

      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        micAnalyserCtxRef.current = ctx;
        if (ctx.state === "suspended") {
          ctx.resume().catch(() => {});
        }
        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.6;
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const tick = () => {
          if (!micAnalyserCtxRef.current) return;
          if (isMutedRef.current || !audioTracks.some((t) => t.readyState === "live" && t.enabled)) {
            setMicLevel(0);
          } else {
            analyser.getByteTimeDomainData(dataArray);
            let sumSquares = 0;
            for (let i = 0; i < dataArray.length; i++) {
              const norm = (dataArray[i] - 128) / 128;
              sumSquares += norm * norm;
            }
            const rms = Math.sqrt(sumSquares / dataArray.length);
            const scaled = Math.min(100, Math.round(rms * 350));
            setMicLevel(scaled);
          }
          micMeterRafRef.current = requestAnimationFrame(tick);
        };
        micMeterRafRef.current = requestAnimationFrame(tick);
      } catch {
        // AudioContext meter unavailable; calling audio still works normally
      }
    },
    [stopMicMeter]
  );

  const refreshAudioDevices = useCallback(async (activeTrackDeviceId?: string) => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.enumerateDevices) return;
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const mics = devices
        .filter((d) => d.kind === "audioinput")
        .map((d, idx) => ({
          deviceId: d.deviceId,
          label: d.label || `Microphone ${idx + 1}`,
        }));
      setAudioInputDevices(mics);
      if (activeTrackDeviceId) {
        setSelectedAudioDeviceId(activeTrackDeviceId);
      } else if (mics.length > 0) {
        setSelectedAudioDeviceId((prev) => prev || mics[0].deviceId);
      }
    } catch {
      // ignore enumeration errors
    }
  }, []);

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
    stopMicMeter();
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
    isMutedRef.current = false;
    setIsScreenSharing(false);
    setHasRealMic(false);
    setMicError(null);
  }, [stopMicMeter]);

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
        chatService.sendSignal(callId, "ICE_CANDIDATE", event.candidate).catch(() => {});
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState) {
        setConnectionState(pc.connectionState);
      }
    };

    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        remoteStreamRef.current = event.streams[0];
        // Clone MediaStream wrapper so React state always sees a fresh reference when additional tracks arrive
        setRemoteStream(new MediaStream(event.streams[0].getTracks()));
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

  // Acquire REAL microphone (and camera for video calls) with proper audio-only fallback — NEVER fake a silent mic!
  const acquireMedia = useCallback(
    async (callType: CallType, preferredDeviceId?: string): Promise<MediaStream | null> => {
      setMicError(null);

      if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
        const msg = formatMediaError(null);
        setHasRealMic(false);
        setMicError(msg);
        return null;
      }

      const audioConstraints: MediaTrackConstraints = {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        ...(preferredDeviceId ? { deviceId: { exact: preferredDeviceId } } : {}),
      };

      let stream: MediaStream | null = null;
      let lastErr: any = null;

      // Attempt 1: Full audio + video (for VIDEO calls)
      if (callType === "VIDEO") {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            audio: audioConstraints,
            video: { width: { ideal: 1280 }, height: { ideal: 720 } },
          });
        } catch (err) {
          lastErr = err;
          console.warn("[useWebRTCCall] Video+Audio getUserMedia failed, retrying real Audio-only:", err);
        }
      }

      // Attempt 2: Real microphone audio-only with voice processing constraints
      if (!stream) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            audio: audioConstraints,
            video: false,
          });
        } catch (err) {
          lastErr = err;
          console.warn("[useWebRTCCall] Constrained audio getUserMedia failed, retrying basic audio:", err);
        }
      }

      // Attempt 3: Basic unconstrained audio (handles drivers/devices that reject specific constraints or deviceId)
      if (!stream) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: false,
          });
        } catch (err) {
          lastErr = err;
          console.warn("[useWebRTCCall] Basic audio getUserMedia failed:", err);
        }
      }

      if (stream) {
        const audioTracks = stream.getAudioTracks();
        audioTracks.forEach((t) => {
          t.enabled = !isMutedRef.current;
        });

        const hasAudio = audioTracks.length > 0 && audioTracks.some((t) => t.readyState === "live");
        const hasVideo = stream.getVideoTracks().length > 0;

        // Stop any previous tracks being replaced
        if (localStreamRef.current && localStreamRef.current !== stream) {
          localStreamRef.current.getTracks().forEach((t) => t.stop());
        }

        localStreamRef.current = stream;
        setLocalStream(stream);
        setHasRealMic(hasAudio);
        setMicError(hasAudio ? null : "Microphone track is inactive. Try selecting another microphone.");
        setIsVideoEnabled(hasVideo);

        if (hasAudio) {
          const activeDevId = audioTracks[0]?.getSettings?.()?.deviceId;
          refreshAudioDevices(activeDevId);
          startMicMeter(stream);
        }

        return stream;
      }

      // Real microphone could not be acquired: surface clear error to user (do NOT hide behind silent oscillator)
      const errMsg = formatMediaError(lastErr);
      setHasRealMic(false);
      setMicError(errMsg);
      setIsVideoEnabled(false);
      refreshAudioDevices();
      return null;
    },
    [refreshAudioDevices, startMicMeter]
  );

  // Switch microphone device OR retry acquiring mic mid-call and hot-swap into live PeerConnection!
  const switchMicrophone = useCallback(
    async (deviceId?: string) => {
      const currentCall = activeCallRef.current;
      const callId = currentCall?.id || (currentCall as any)?.callId;
      if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
        setMicError(formatMediaError(null));
        return false;
      }

      try {
        const constraints: MediaStreamConstraints = {
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            ...(deviceId ? { deviceId: { exact: deviceId } } : {}),
          },
          video: false,
        };
        let audioStream: MediaStream;
        try {
          audioStream = await navigator.mediaDevices.getUserMedia(constraints);
        } catch {
          audioStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        }

        const newAudioTrack = audioStream.getAudioTracks()[0];
        if (!newAudioTrack) {
          setMicError("No audio track returned by selected microphone.");
          return false;
        }

        newAudioTrack.enabled = !isMutedRef.current;

        // Preserve any existing live video track when swapping only the microphone
        const existingVideoTracks = localStreamRef.current
          ? localStreamRef.current.getVideoTracks().filter((t) => t.readyState === "live")
          : [];
        if (localStreamRef.current) {
          localStreamRef.current.getAudioTracks().forEach((t) => t.stop());
        }

        const combinedStream = new MediaStream([newAudioTrack, ...existingVideoTracks]);
        localStreamRef.current = combinedStream;
        setLocalStream(combinedStream);
        setHasRealMic(true);
        setMicError(null);

        const activeDevId = newAudioTrack.getSettings?.()?.deviceId || deviceId || "";
        refreshAudioDevices(activeDevId);
        startMicMeter(combinedStream);

        // Hot-swap audio track in live PeerConnection!
        const pc = pcRef.current;
        if (pc) {
          const audioSender = pc.getSenders().find((s) => s.track?.kind === "audio");
          if (audioSender) {
            await audioSender.replaceTrack(newAudioTrack);
          } else {
            // Check if there is an existing audio transceiver (created as sendrecv without a track)
            const audioTransceiver = pc
              .getTransceivers()
              .find((tr) => tr.receiver?.track?.kind === "audio");
            if (audioTransceiver && audioTransceiver.sender) {
              audioTransceiver.direction = "sendrecv";
              await audioTransceiver.sender.replaceTrack(newAudioTrack);
            } else {
              pc.addTrack(newAudioTrack, combinedStream);
            }
            // Trigger renegotiation so remote peer starts receiving the newly added audio track
            if (callId && pc.signalingState === "stable") {
              try {
                const offer = await pc.createOffer({
                  offerToReceiveAudio: true,
                  offerToReceiveVideo: currentCall?.callType === "VIDEO",
                });
                await pc.setLocalDescription(offer);
                await chatService.sendSignal(callId, "OFFER", offer);
              } catch (renegErr) {
                console.warn("[useWebRTCCall] Audio renegotiation failed:", renegErr);
              }
            }
          }
        }

        return true;
      } catch (err: any) {
        setHasRealMic(false);
        setMicError(formatMediaError(err));
        return false;
      }
    },
    [refreshAudioDevices, startMicMeter]
  );

  // Single signaling poll step (also invoked immediately on start/accept so handshake is instant)
  const pollSignalsOnce = useCallback(
    async (callId: string) => {
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

        // 2. Process signaling queue
        const signals = await chatService.getSignals(callId);
        if (!Array.isArray(signals)) return;

        for (const sig of signals) {
          const sigKey = sig.id || `${sig.type}_${sig.createdAt}`;
          if (processedSignalIdsRef.current.has(sigKey)) continue;
          if (sig.senderId === currentUserId) continue;

          if (
            sig.type === "END" ||
            sig.type === "REJECT" ||
            sig.type === "BYE" ||
            sig.type === "END_CALL"
          ) {
            processedSignalIdsRef.current.add(sigKey);
            dismissedCallIdsRef.current.add(callId);
            cleanUpStreamsAndPC();
            setActiveCall(null);
            return;
          }

          // Do NOT mark WebRTC signals as processed until pcRef.current is initialized!
          const pc = pcRef.current;
          if (!pc) continue;

          if (sig.type === "OFFER" && sig.payload) {
            processedSignalIdsRef.current.add(sigKey);
            if (pc.signalingState === "stable" || pc.signalingState === "have-local-offer") {
              await pc.setRemoteDescription(new RTCSessionDescription(sig.payload));
              await flushPendingCandidates(pc);
              const answer = await pc.createAnswer();
              await pc.setLocalDescription(answer);
              await chatService.sendSignal(callId, "ANSWER", answer);
            }
          } else if (sig.type === "ANSWER" && sig.payload) {
            processedSignalIdsRef.current.add(sigKey);
            if (pc.signalingState === "have-local-offer") {
              await pc.setRemoteDescription(new RTCSessionDescription(sig.payload));
              await flushPendingCandidates(pc);
            }
          } else if (sig.type === "ICE_CANDIDATE" && sig.payload) {
            processedSignalIdsRef.current.add(sigKey);
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
    },
    [cleanUpStreamsAndPC, currentUserId, flushPendingCandidates, startDurationTimer]
  );

  // Poll for peer signals (SDP Offer/Answer/ICE) and remote call state
  const startSignalPolling = useCallback(
    (callId: string) => {
      if (signalPollerRef.current) clearInterval(signalPollerRef.current);
      // Run immediately so callee answers OFFER without waiting 1s
      pollSignalsOnce(callId);
      signalPollerRef.current = setInterval(() => {
        pollSignalsOnce(callId);
      }, 1000);
    },
    [pollSignalsOnce]
  );

  // Attach tracks or sendrecv audio transceiver so SDP always negotiates 2-way audio
  const attachLocalTracksToPC = useCallback(
    (pc: RTCPeerConnection, stream: MediaStream | null, callType: CallType) => {
      if (stream && stream.getAudioTracks().length > 0) {
        stream.getTracks().forEach((track) => {
          if (track.kind === "audio") {
            track.enabled = !isMutedRef.current;
          }
          pc.addTrack(track, stream);
        });
      } else {
        // Ensure audio transceiver is sendrecv even if mic wasn't available yet (allows hot-swapping mic later!)
        pc.addTransceiver("audio", { direction: "sendrecv" });
        if (stream) {
          stream.getVideoTracks().forEach((track) => pc.addTrack(track, stream));
        }
      }
      if (callType === "VIDEO" && (!stream || stream.getVideoTracks().length === 0)) {
        pc.addTransceiver("video", { direction: "recvonly" });
      }
    },
    []
  );

  // Initiate an Outgoing Call
  const startCall = useCallback(
    async (conversationId: string, receiverId: string, receiverName: string, type: CallType) => {
      try {
        cleanUpStreamsAndPC();
        setError(null);
        setConnectionState("calling");

        const stream = await acquireMedia(type, selectedAudioDeviceId || undefined);
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
        if (pc) {
          try {
            attachLocalTracksToPC(pc, stream, type);
            const offer = await pc.createOffer({
              offerToReceiveAudio: true,
              offerToReceiveVideo: type === "VIDEO",
            });
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
    [
      acquireMedia,
      attachLocalTracksToPC,
      cleanUpStreamsAndPC,
      createPeerConnection,
      currentUserId,
      selectedAudioDeviceId,
      startSignalPolling,
    ]
  );

  // Accept Incoming Call
  const acceptCall = useCallback(async () => {
    const current = activeCallRef.current;
    if (!current) return;
    try {
      setConnectionState("connecting");
      const stream = await acquireMedia(current.callType, selectedAudioDeviceId || undefined);
      const callId = current.id || (current as any).callId;
      const updated = await chatService.respondToCall(callId, "CONNECTED");
      setActiveCall((prev) =>
        prev
          ? {
              ...prev,
              status: "CONNECTED",
              connectedAt: updated?.connectedAt || new Date().toISOString(),
            }
          : updated
      );

      const pc = createPeerConnection(callId);
      if (pc) {
        attachLocalTracksToPC(pc, stream, current.callType);
      }

      startDurationTimer(updated?.connectedAt);
      startSignalPolling(callId);
    } catch (err: any) {
      setError(err.message || "Failed to accept call");
    }
  }, [
    acquireMedia,
    attachLocalTracksToPC,
    createPeerConnection,
    selectedAudioDeviceId,
    startDurationTimer,
    startSignalPolling,
  ]);

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

  // Toggle Mute Audio (explicitly synced with both localStream and RTCRtpSender)
  const toggleMute = useCallback(() => {
    // If no real mic is active yet, clicking mic attempts to acquire it!
    if (!localStreamRef.current || localStreamRef.current.getAudioTracks().length === 0) {
      switchMicrophone(selectedAudioDeviceId || undefined);
      return;
    }

    const nextMuted = !isMutedRef.current;
    isMutedRef.current = nextMuted;
    setIsMuted(nextMuted);

    localStreamRef.current.getAudioTracks().forEach((track) => {
      track.enabled = !nextMuted;
    });
    if (pcRef.current) {
      pcRef.current.getSenders().forEach((sender) => {
        if (sender.track && sender.track.kind === "audio") {
          sender.track.enabled = !nextMuted;
        }
      });
    }
  }, [selectedAudioDeviceId, switchMicrophone]);

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

  // Toggle Screen Share (preserves active microphone audio track!)
  const toggleScreenShare = useCallback(async () => {
    if (isScreenSharing) {
      if (activeCall) {
        const camStream = await acquireMedia(activeCall.callType, selectedAudioDeviceId || undefined);
        const camVideoTrack = camStream?.getVideoTracks()[0];
        if (pcRef.current && camVideoTrack) {
          const sender = pcRef.current.getSenders().find((s) => s.track?.kind === "video");
          if (sender) {
            sender.replaceTrack(camVideoTrack).catch(() => {});
          }
        }
        setIsScreenSharing(false);
      }
      return;
    }

    try {
      if (typeof navigator !== "undefined" && navigator.mediaDevices?.getDisplayMedia) {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = screenStream.getVideoTracks()[0];

        if (pcRef.current && screenTrack) {
          const sender = pcRef.current.getSenders().find((s) => s.track?.kind === "video");
          if (sender) {
            await sender.replaceTrack(screenTrack);
          }
        }

        const existingAudioTracks = localStreamRef.current
          ? localStreamRef.current.getAudioTracks()
          : [];
        const combined = new MediaStream([...existingAudioTracks, screenTrack]);

        screenTrack.onended = () => {
          setIsScreenSharing(false);
          if (activeCall) {
            acquireMedia(activeCall.callType, selectedAudioDeviceId || undefined);
          }
        };

        localStreamRef.current = combined;
        setLocalStream(combined);
        setIsScreenSharing(true);
      }
    } catch (err) {
      console.warn("Screen share error:", err);
    }
  }, [isScreenSharing, activeCall, acquireMedia, selectedAudioDeviceId]);

  // Periodic check for incoming calls and remote hangup while ringing
  // Poll backend for incoming calls (5s idle, pauses when tab is hidden)
  useEffect(() => {
    if (!currentUserId || !enabled) return;

    let isPolling = false;
    incomingCheckTimerRef.current = setInterval(async () => {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") {
        return; // Pause poll while browser tab is hidden/minimized
      }
      if (isPolling) return;
      isPolling = true;

      const current = activeCallRef.current;
      try {
        if (!current) {
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

            if (
              typeof window !== "undefined" &&
              "Notification" in window &&
              Notification.permission === "granted"
            ) {
              try {
                const callerLabel = incoming.caller
                  ? `${incoming.caller.firstName || ""} ${incoming.caller.lastName || ""}`.trim()
                  : "Team Member";
                new Notification(
                  `Incoming ${incoming.callType === "VIDEO" ? "Video" : "Voice"} Call`,
                  {
                    body: `${callerLabel || "Colleague"} is calling you on MByte`,
                    tag: `mbyte-call-${incomingId}`,
                    requireInteraction: true,
                  }
                );
              } catch {
                // ignore notification API errors
              }
            }
          }
        } else if (current.status === "RINGING") {
          const callId = current.id || (current as any).callId;
          if (callId) {
            const remote = await chatService.getCallSession(callId);
            if (
              !remote ||
              remote.status === "ENDED" ||
              remote.status === "REJECTED" ||
              remote.status === "MISSED"
            ) {
              dismissedCallIdsRef.current.add(callId);
              cleanUpStreamsAndPC();
              setActiveCall(null);
            }
          }
        }
      } catch {
        // suppress transient poll errors
      } finally {
        isPolling = false;
      }
    }, 5000);

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
    hasRealMic,
    micError,
    micLevel,
    audioInputDevices,
    selectedAudioDeviceId,
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleVideo,
    toggleScreenShare,
    switchMicrophone,
  };
}

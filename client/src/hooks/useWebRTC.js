import { useRef, useCallback, useState, useEffect } from 'react';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    {
      urls: 'turn:openrelay.metered.ca:80',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
    {
      urls: 'turn:openrelay.metered.ca:443',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
    {
      urls: 'turn:openrelay.metered.ca:443?transport=tcp',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
  ],
  iceCandidatePoolSize: 10,
  bundlePolicy: 'max-bundle',
  rtcpMuxPolicy: 'require',
};

const VIDEO_CONSTRAINTS = {
  width: { ideal: 1280, min: 640 },
  height: { ideal: 720, min: 480 },
  frameRate: { ideal: 30, min: 15 },
  facingMode: 'user',
};

export function useWebRTC({ emit, on, userId }) {
  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const iceQueueRef = useRef([]);
  const disconnectTimerRef = useRef(null);
  const callStateRef = useRef('idle');
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [callState, setCallState] = useState('idle');
  const [callType, setCallType] = useState('voice');
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [facingMode, setFacingMode] = useState('user');
  const [incomingCall, setIncomingCall] = useState(null);
  const [callDuration, setCallDuration] = useState(0);
  const timerRef = useRef(null);
  const isCallerRef = useRef(false);

  const setCallStateSafe = useCallback((s) => {
    callStateRef.current = s;
    setCallState(s);
  }, []);

  const clearDisconnectTimer = useCallback(() => {
    if (disconnectTimerRef.current) {
      clearTimeout(disconnectTimerRef.current);
      disconnectTimerRef.current = null;
    }
  }, []);

  const flushIceQueue = useCallback(async () => {
    const pc = pcRef.current;
    if (!pc?.remoteDescription) return;
    const queue = [...iceQueueRef.current];
    iceQueueRef.current = [];
    for (const candidate of queue) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch {
        // ignore
      }
    }
  }, []);

  const addIceCandidate = useCallback(async (candidate) => {
    if (!candidate) return;
    const pc = pcRef.current;
    if (!pc?.remoteDescription) {
      iceQueueRef.current.push(candidate);
      return;
    }
    try {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    } catch {
      iceQueueRef.current.push(candidate);
    }
  }, []);

  const startTimer = useCallback(() => {
    if (timerRef.current) return;
    timerRef.current = setInterval(() => setCallDuration((d) => d + 1), 1000);
  }, []);

  const cleanup = useCallback(() => {
    clearDisconnectTimer();
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    pcRef.current?.close();
    pcRef.current = null;
    localStreamRef.current = null;
    iceQueueRef.current = [];
    setLocalStream(null);
    setRemoteStream(null);
    setCallStateSafe('idle');
    setIncomingCall(null);
    setCallDuration(0);
    setIsMuted(false);
    setIsCameraOff(false);
    isCallerRef.current = false;
  }, [clearDisconnectTimer, setCallStateSafe]);

  const createPeerConnection = useCallback(() => {
    const pc = new RTCPeerConnection(ICE_SERVERS);

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        emit('call:ice', { candidate: event.candidate });
      }
    };

    pc.ontrack = (event) => {
      const stream = event.streams?.[0] || new MediaStream([event.track]);
      setRemoteStream((prev) => {
        if (prev) {
          event.track && !prev.getTracks().find((t) => t.id === event.track.id) && prev.addTrack(event.track);
          return new MediaStream(prev.getTracks());
        }
        return stream;
      });
    };

    pc.oniceconnectionstatechange = () => {
      const iceState = pc.iceConnectionState;
      if (iceState === 'connected' || iceState === 'completed') {
        clearDisconnectTimer();
        setCallStateSafe('connected');
        startTimer();
      }
      if (iceState === 'disconnected') {
        clearDisconnectTimer();
        disconnectTimerRef.current = setTimeout(() => {
          const s = pc.iceConnectionState;
          if (s === 'disconnected' || s === 'failed') {
            cleanup();
            emit('call:end', {});
          }
        }, 12000);
      }
      if (iceState === 'failed') {
        try {
          pc.restartIce();
        } catch {
          cleanup();
          emit('call:end', {});
        }
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') {
        clearDisconnectTimer();
        setCallStateSafe('connected');
        startTimer();
      }
    };

    pcRef.current = pc;
    return pc;
  }, [emit, cleanup, clearDisconnectTimer, setCallStateSafe, startTimer]);

  const getMedia = useCallback(async (type, facing = 'user') => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
      video: type === 'video' ? { ...VIDEO_CONSTRAINTS, facingMode: facing } : false,
    });

    if (type === 'video') {
      const vt = stream.getVideoTracks()[0];
      if (vt?.applyConstraints) {
        try {
          await vt.applyConstraints({
            width: { ideal: 1280 },
            height: { ideal: 720 },
            frameRate: { ideal: 30 },
          });
        } catch {
          // use default
        }
      }
    }

    localStreamRef.current = stream;
    setLocalStream(stream);
    return stream;
  }, []);

  const startCall = useCallback(
    async (type = 'voice') => {
      if (callStateRef.current !== 'idle' && callStateRef.current !== 'busy') return;
      try {
        cleanup();
        setCallType(type);
        isCallerRef.current = true;
        setCallStateSafe('calling');

        const stream = await getMedia(type);
        const pc = createPeerConnection();
        stream.getTracks().forEach((track) => pc.addTrack(track, stream));

        const offer = await pc.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: type === 'video',
        });
        await pc.setLocalDescription(offer);
        emit('call:offer', { type, offer: pc.localDescription });
      } catch (err) {
        console.error('Start call failed:', err);
        cleanup();
        emit('call:end', {});
      }
    },
    [getMedia, createPeerConnection, emit, cleanup, setCallStateSafe]
  );

  const acceptCall = useCallback(async () => {
    if (!incomingCall) return;
    try {
      const type = incomingCall.type || 'voice';
      setCallType(type);
      setIncomingCall(null);

      const stream = await getMedia(type);
      const pc = createPeerConnection();
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      await pc.setRemoteDescription(new RTCSessionDescription(incomingCall.offer));
      await flushIceQueue();

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      emit('call:answer', { answer: pc.localDescription });

      setCallStateSafe('connected');
      startTimer();
    } catch (err) {
      console.error('Accept call failed:', err);
      cleanup();
      emit('call:end', {});
    }
  }, [incomingCall, getMedia, createPeerConnection, emit, cleanup, flushIceQueue, setCallStateSafe, startTimer]);

  const rejectCall = useCallback(() => {
    emit('call:reject', {});
    cleanup();
  }, [emit, cleanup]);

  const endCall = useCallback(() => {
    emit('call:end', {});
    cleanup();
  }, [emit, cleanup]);

  const toggleMute = useCallback(() => {
    const audioTrack = localStreamRef.current?.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setIsMuted(!audioTrack.enabled);
    }
  }, []);

  const toggleCamera = useCallback(() => {
    const videoTrack = localStreamRef.current?.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setIsCameraOff(!videoTrack.enabled);
    }
  }, []);

  const switchCamera = useCallback(async () => {
    if (callType !== 'video' || !localStreamRef.current) return;
    const newFacing = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(newFacing);
    const videoTrack = localStreamRef.current.getVideoTracks()[0];
    if (!videoTrack) return;
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { ...VIDEO_CONSTRAINTS, facingMode: newFacing },
      });
      const newTrack = newStream.getVideoTracks()[0];
      const sender = pcRef.current?.getSenders().find((s) => s.track?.kind === 'video');
      if (sender) await sender.replaceTrack(newTrack);
      videoTrack.stop();
      localStreamRef.current.removeTrack(videoTrack);
      localStreamRef.current.addTrack(newTrack);
      setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
    } catch (err) {
      console.error('Switch camera failed:', err);
    }
  }, [callType, facingMode]);

  useEffect(() => {
    const unsubIncoming = on('call:incoming', (data) => {
      if (data.callerId === userId) return;
      if (callStateRef.current !== 'idle') return;
      setIncomingCall(data);
      setCallStateSafe('incoming');
      setCallType(data.type || 'voice');
    });

    const unsubAccepted = on('call:accepted', async (data) => {
      if (!isCallerRef.current) return;
      try {
        const pc = pcRef.current;
        if (!pc) return;
        await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
        await flushIceQueue();
        setCallStateSafe('connected');
        startTimer();
      } catch (err) {
        console.error('Handle answer failed:', err);
        cleanup();
      }
    });

    const unsubIce = on('call:ice', async (data) => {
      if (data.from === userId) return;
      await addIceCandidate(data.candidate);
    });

    const unsubReject = on('call:reject', () => cleanup());
    const unsubEnd = on('call:end', () => cleanup());
    const unsubBusy = on('call:busy', () => {
      cleanup();
      setCallStateSafe('busy');
      setTimeout(() => setCallStateSafe('idle'), 1500);
    });

    return () => {
      unsubIncoming?.();
      unsubAccepted?.();
      unsubIce?.();
      unsubReject?.();
      unsubEnd?.();
      unsubBusy?.();
    };
  }, [on, userId, cleanup, flushIceQueue, addIceCandidate, setCallStateSafe, startTimer]);

  useEffect(() => () => cleanup(), [cleanup]);

  return {
    localStream,
    remoteStream,
    callState,
    callType,
    isMuted,
    isCameraOff,
    incomingCall,
    callDuration,
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleCamera,
    switchCamera,
  };
}

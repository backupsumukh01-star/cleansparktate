import { useRef, useCallback, useState, useEffect } from 'react';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export function useWebRTC({ emit, on, userId }) {
  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
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

  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    remoteStreamRef.current?.getTracks().forEach((t) => t.stop());
    pcRef.current?.close();
    pcRef.current = null;
    localStreamRef.current = null;
    remoteStreamRef.current = null;
    setLocalStream(null);
    setRemoteStream(null);
    setCallState('idle');
    setIncomingCall(null);
    setCallDuration(0);
    setIsMuted(false);
    setIsCameraOff(false);
    isCallerRef.current = false;
  }, []);

  const createPeerConnection = useCallback(() => {
    const pc = new RTCPeerConnection(ICE_SERVERS);

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        emit('call:ice', { candidate: event.candidate });
      }
    };

    pc.ontrack = (event) => {
      const [stream] = event.streams;
      remoteStreamRef.current = stream;
      setRemoteStream(stream);
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
        cleanup();
      }
    };

    pcRef.current = pc;
    return pc;
  }, [emit, cleanup]);

  const getMedia = useCallback(async (type, facing = 'user') => {
    const constraints = {
      audio: true,
      video: type === 'video' ? { facingMode: facing, width: { ideal: 640 }, height: { ideal: 480 } } : false,
    };
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    localStreamRef.current = stream;
    setLocalStream(stream);
    return stream;
  }, []);

  const startCall = useCallback(async (type = 'voice') => {
    try {
      setCallType(type);
      isCallerRef.current = true;
      setCallState('calling');

      const stream = await getMedia(type);
      const pc = createPeerConnection();
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      emit('call:offer', { type, offer });
    } catch (err) {
      console.error('Start call failed:', err);
      cleanup();
    }
  }, [getMedia, createPeerConnection, emit, cleanup]);

  const acceptCall = useCallback(async () => {
    if (!incomingCall) return;
    try {
      setCallType(incomingCall.type);
      setCallState('connected');
      setIncomingCall(null);

      const stream = await getMedia(incomingCall.type);
      const pc = createPeerConnection();
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      await pc.setRemoteDescription(new RTCSessionDescription(incomingCall.offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      emit('call:answer', { answer });

      timerRef.current = setInterval(() => {
        setCallDuration((d) => d + 1);
      }, 1000);
    } catch (err) {
      console.error('Accept call failed:', err);
      cleanup();
    }
  }, [incomingCall, getMedia, createPeerConnection, emit, cleanup]);

  const rejectCall = useCallback(() => {
    emit('call:reject', {});
    setIncomingCall(null);
    setCallState('idle');
  }, [emit]);

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
        video: { facingMode: newFacing, width: { ideal: 640 }, height: { ideal: 480 } },
      });
      const newTrack = newStream.getVideoTracks()[0];
      const sender = pcRef.current?.getSenders().find((s) => s.track?.kind === 'video');
      if (sender) {
        await sender.replaceTrack(newTrack);
      }
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
      setIncomingCall(data);
      setCallState('incoming');
      setCallType(data.type || 'voice');
    });

    const unsubAccepted = on('call:accepted', async (data) => {
      if (!isCallerRef.current) return;
      try {
        const pc = pcRef.current;
        if (!pc) return;
        await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
        setCallState('connected');
        timerRef.current = setInterval(() => {
          setCallDuration((d) => d + 1);
        }, 1000);
      } catch (err) {
        console.error('Handle answer failed:', err);
        cleanup();
      }
    });

    const unsubIce = on('call:ice', async (data) => {
      if (data.from === userId) return;
      try {
        if (data.candidate && pcRef.current) {
          await pcRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
        }
      } catch (err) {
        console.error('ICE candidate error:', err);
      }
    });

    const unsubReject = on('call:reject', () => cleanup());
    const unsubEnd = on('call:end', () => cleanup());
    const unsubBusy = on('call:busy', () => {
      cleanup();
      setCallState('busy');
      setTimeout(() => setCallState('idle'), 2000);
    });

    return () => {
      unsubIncoming?.();
      unsubAccepted?.();
      unsubIce?.();
      unsubReject?.();
      unsubEnd?.();
      unsubBusy?.();
    };
  }, [on, userId, cleanup]);

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

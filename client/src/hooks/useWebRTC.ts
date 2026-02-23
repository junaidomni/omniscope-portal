import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";

interface UseWebRTCProps {
  callId: number;
  channelId: number;
  localStream: MediaStream | null;
  onRemoteStream: (userId: number, stream: MediaStream) => void;
  onParticipantLeft: (userId: number) => void;
}

interface PeerConnection {
  connection: RTCPeerConnection;
  userId: number;
}

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

export function useWebRTC({
  callId,
  channelId,
  localStream,
  onRemoteStream,
  onParticipantLeft,
}: UseWebRTCProps) {
  const socketRef = useRef<Socket | null>(null);
  const peerConnectionsRef = useRef<Map<number, PeerConnection>>(new Map());
  const [isConnected, setIsConnected] = useState(false);

  // Initialize WebSocket connection
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const socket = io(window.location.origin, {
      auth: { token },
    });

    socket.on("connect", () => {
      console.log("[WebRTC] Socket connected");
      setIsConnected(true);
      socket.emit("join-channel", channelId);
      socket.emit("call-joined", { callId, channelId });
    });

    socket.on("disconnect", () => {
      console.log("[WebRTC] Socket disconnected");
      setIsConnected(false);
    });

    socketRef.current = socket;

    return () => {
      socket.emit("call-left", { callId, channelId });
      socket.disconnect();
    };
  }, [callId, channelId]);

  // Create peer connection for a user
  const createPeerConnection = useCallback(
    (userId: number) => {
      if (peerConnectionsRef.current.has(userId)) {
        return peerConnectionsRef.current.get(userId)!.connection;
      }

      const pc = new RTCPeerConnection(ICE_SERVERS);

      // Add local stream tracks
      if (localStream) {
        localStream.getTracks().forEach((track) => {
          pc.addTrack(track, localStream);
        });
      }

      // Handle incoming remote stream
      pc.ontrack = (event) => {
        console.log(`[WebRTC] Received remote stream from user ${userId}`);
        onRemoteStream(userId, event.streams[0]);
      };

      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate && socketRef.current) {
          console.log(`[WebRTC] Sending ICE candidate to user ${userId}`);
          socketRef.current.emit("webrtc-ice-candidate", {
            callId,
            candidate: event.candidate,
            targetUserId: userId,
          });
        }
      };

      // Handle connection state changes
      pc.onconnectionstatechange = () => {
        console.log(
          `[WebRTC] Connection state with user ${userId}: ${pc.connectionState}`
        );
        if (
          pc.connectionState === "disconnected" ||
          pc.connectionState === "failed" ||
          pc.connectionState === "closed"
        ) {
          onParticipantLeft(userId);
          peerConnectionsRef.current.delete(userId);
        }
      };

      peerConnectionsRef.current.set(userId, { connection: pc, userId });
      return pc;
    },
    [callId, localStream, onRemoteStream, onParticipantLeft]
  );

  // Handle incoming WebRTC offer
  useEffect(() => {
    if (!socketRef.current) return;

    const handleOffer = async ({
      callId: incomingCallId,
      offer,
      fromUserId,
    }: {
      callId: number;
      offer: RTCSessionDescriptionInit;
      fromUserId: number;
    }) => {
      if (incomingCallId !== callId) return;

      console.log(`[WebRTC] Received offer from user ${fromUserId}`);
      const pc = createPeerConnection(fromUserId);

      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socketRef.current?.emit("webrtc-answer", {
        callId,
        answer,
        targetUserId: fromUserId,
      });
    };

    socketRef.current.on("webrtc-offer", handleOffer);

    return () => {
      socketRef.current?.off("webrtc-offer", handleOffer);
    };
  }, [callId, createPeerConnection]);

  // Handle incoming WebRTC answer
  useEffect(() => {
    if (!socketRef.current) return;

    const handleAnswer = async ({
      callId: incomingCallId,
      answer,
      fromUserId,
    }: {
      callId: number;
      answer: RTCSessionDescriptionInit;
      fromUserId: number;
    }) => {
      if (incomingCallId !== callId) return;

      console.log(`[WebRTC] Received answer from user ${fromUserId}`);
      const peerConnection = peerConnectionsRef.current.get(fromUserId);
      if (peerConnection) {
        await peerConnection.connection.setRemoteDescription(
          new RTCSessionDescription(answer)
        );
      }
    };

    socketRef.current.on("webrtc-answer", handleAnswer);

    return () => {
      socketRef.current?.off("webrtc-answer", handleAnswer);
    };
  }, [callId]);

  // Handle incoming ICE candidates
  useEffect(() => {
    if (!socketRef.current) return;

    const handleIceCandidate = async ({
      callId: incomingCallId,
      candidate,
      fromUserId,
    }: {
      callId: number;
      candidate: RTCIceCandidateInit;
      fromUserId: number;
    }) => {
      if (incomingCallId !== callId) return;

      console.log(`[WebRTC] Received ICE candidate from user ${fromUserId}`);
      const peerConnection = peerConnectionsRef.current.get(fromUserId);
      if (peerConnection) {
        await peerConnection.connection.addIceCandidate(
          new RTCIceCandidate(candidate)
        );
      }
    };

    socketRef.current.on("webrtc-ice-candidate", handleIceCandidate);

    return () => {
      socketRef.current?.off("webrtc-ice-candidate", handleIceCandidate);
    };
  }, [callId]);

  // Handle participant joined
  useEffect(() => {
    if (!socketRef.current) return;

    const handleParticipantJoined = async ({
      callId: incomingCallId,
      userId,
    }: {
      callId: number;
      userId: number;
    }) => {
      if (incomingCallId !== callId) return;

      console.log(`[WebRTC] Participant ${userId} joined, creating offer`);
      const pc = createPeerConnection(userId);

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socketRef.current?.emit("webrtc-offer", {
        callId,
        offer,
        targetUserId: userId,
      });
    };

    socketRef.current.on("call-participant-joined", handleParticipantJoined);

    return () => {
      socketRef.current?.off("call-participant-joined", handleParticipantJoined);
    };
  }, [callId, createPeerConnection]);

  // Handle participant left
  useEffect(() => {
    if (!socketRef.current) return;

    const handleParticipantLeft = ({
      callId: incomingCallId,
      userId,
    }: {
      callId: number;
      userId: number;
    }) => {
      if (incomingCallId !== callId) return;

      console.log(`[WebRTC] Participant ${userId} left`);
      const peerConnection = peerConnectionsRef.current.get(userId);
      if (peerConnection) {
        peerConnection.connection.close();
        peerConnectionsRef.current.delete(userId);
      }
      onParticipantLeft(userId);
    };

    socketRef.current.on("call-participant-left", handleParticipantLeft);

    return () => {
      socketRef.current?.off("call-participant-left", handleParticipantLeft);
    };
  }, [callId, onParticipantLeft]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      peerConnectionsRef.current.forEach(({ connection }) => {
        connection.close();
      });
      peerConnectionsRef.current.clear();
    };
  }, []);

  return {
    isConnected,
    peerConnections: peerConnectionsRef.current,
  };
}

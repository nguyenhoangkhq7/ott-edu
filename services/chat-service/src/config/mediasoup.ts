import os from "os";
import type { WorkerSettings } from "mediasoup/types";

const cpuCount = Math.max(1, os.cpus().length);
const workerCount = Math.max(1, Number(process.env.MEDIASOUP_WORKER_COUNT) || cpuCount);

const rtcMinPort = Number(process.env.MEDIASOUP_RTC_MIN_PORT) || 40000;
const rtcMaxPort = Number(process.env.MEDIASOUP_RTC_MAX_PORT) || 49999;

const listenIp = process.env.MEDIASOUP_LISTEN_IP || "0.0.0.0";
const announcedIp = process.env.MEDIASOUP_ANNOUNCED_IP || undefined;

const initialAvailableOutgoingBitrate =
  Number(process.env.MEDIASOUP_INITIAL_AVAILABLE_OUTGOING_BITRATE) || 1_000_000;
const maxIncomingBitrate =
  Number(process.env.MEDIASOUP_MAX_INCOMING_BITRATE) || 1_500_000;

const mediasoupConfig = {
  workerCount,
  worker: {
    logLevel: "warn" as const,
    logTags: ["info", "ice", "dtls", "rtp", "srtp", "rtcp"],
    rtcMinPort,
    rtcMaxPort,
  } as WorkerSettings,
  router: {
    mediaCodecs: [
      {
        kind: "audio" as const,
        mimeType: "audio/opus",
        clockRate: 48000,
        channels: 2,
        parameters: {
          useinbandfec: 1,
        },
      },
      {
        kind: "video" as const,
        mimeType: "video/VP8",
        clockRate: 90000,
        parameters: {
          "x-google-start-bitrate": 1000,
        },
      },
      {
        kind: "video" as const,
        mimeType: "video/VP9",
        clockRate: 90000,
        parameters: {
          "profile-id": 2,
          "x-google-start-bitrate": 1000,
        },
      },
      {
        kind: "video" as const,
        mimeType: "video/h264",
        clockRate: 90000,
        parameters: {
          "packetization-mode": 1,
          "profile-level-id": "42e01f",
          "level-asymmetry-allowed": 1,
          "x-google-start-bitrate": 1000,
        },
      },
      {
        kind: "video" as const,
        mimeType: "video/h264",
        clockRate: 90000,
        parameters: {
          "packetization-mode": 1,
          "profile-level-id": "42001f",
          "level-asymmetry-allowed": 1,
          "x-google-start-bitrate": 1000,
        },
      },
      {
        kind: "video" as const,
        mimeType: "video/h264",
        clockRate: 90000,
        parameters: {
          "packetization-mode": 1,
          "profile-level-id": "4d0032",
          "level-asymmetry-allowed": 1,
          "x-google-start-bitrate": 1000,
        },
      },
    ],
  },
  webRtcTransport: {
    listenIps: [
      {
        ip: listenIp,
        ...(announcedIp && { announcedIp }),
      },
    ],
    initialAvailableOutgoingBitrate,
    maxIncomingBitrate,
  },
};

export default mediasoupConfig;

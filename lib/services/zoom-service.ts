import { getZoomClient, isZoomConfigured } from "@/lib/zoom-client";

interface CreateMeetingParams {
  topic: string;
  startTime: Date;
  duration: number; // in minutes
  timezone?: string;
  coachEmail?: string;
}

interface ZoomMeeting {
  id: string;
  join_url: string;
  start_url: string;
  password?: string;
}

export class ZoomService {
  /**
   * Create a Zoom meeting
   * Returns meeting details or null if Zoom is not configured
   */
  static async createMeeting(params: CreateMeetingParams): Promise<{
    meetingId: string;
    joinUrl: string;
    hostUrl: string;
    password?: string;
  } | null> {
    const zoomClient = await getZoomClient();

    if (!zoomClient) {
      console.log("Zoom not enabled - skipping meeting creation");
      return null;
    }

    try {
      const { topic, startTime, duration, timezone = "UTC" } = params;

      // Create meeting via Zoom API
      const response = await zoomClient.post<ZoomMeeting>("/users/me/meetings", {
        topic,
        type: 2, // Scheduled meeting
        start_time: startTime.toISOString(),
        duration,
        timezone,
        settings: {
          host_video: true,
          participant_video: true,
          join_before_host: false,
          waiting_room: true,
          mute_upon_entry: false,
          auto_recording: "none",
          approval_type: 0, // Automatically approve
        },
      });

      const meeting = response.data;

      console.log(`✅ Created Zoom meeting: ${meeting.id}`);
      console.log(`   Join URL: ${meeting.join_url}`);
      console.log(`   Host URL: ${meeting.start_url}`);

      return {
        meetingId: meeting.id.toString(),
        joinUrl: meeting.join_url,
        hostUrl: meeting.start_url,
        password: meeting.password,
      };
    } catch (error: any) {
      console.error("Failed to create Zoom meeting:", error.response?.data || error.message);
      throw new Error(
        `Zoom meeting creation failed: ${error.response?.data?.message || error.message}`
      );
    }
  }

  /**
   * Delete a Zoom meeting
   */
  static async deleteMeeting(meetingId: string): Promise<boolean> {
    const zoomClient = await getZoomClient();

    if (!zoomClient) {
      console.log("Zoom not enabled - skipping meeting deletion");
      return false;
    }

    try {
      await zoomClient.delete(`/meetings/${meetingId}`);
      console.log(`✅ Deleted Zoom meeting: ${meetingId}`);
      return true;
    } catch (error: any) {
      console.error("Failed to delete Zoom meeting:", error.response?.data || error.message);
      // Don't throw - meeting may already be deleted
      return false;
    }
  }

  /**
   * Get meeting details
   */
  static async getMeeting(meetingId: string): Promise<ZoomMeeting | null> {
    const zoomClient = await getZoomClient();

    if (!zoomClient) {
      return null;
    }

    try {
      const response = await zoomClient.get<ZoomMeeting>(`/meetings/${meetingId}`);
      return response.data;
    } catch (error) {
      console.error("Failed to get Zoom meeting:", error);
      return null;
    }
  }
}

/**
 * Check if Zoom is ready to use
 */
export function checkZoomStatus(): {
  enabled: boolean;
  message: string;
} {
  if (!isZoomConfigured()) {
    return {
      enabled: false,
      message:
        "Zoom is not configured. Set ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, and ZOOM_CLIENT_SECRET in .env. See ZOOM_SETUP.md for instructions.",
    };
  }

  return {
    enabled: true,
    message: "Zoom is configured and ready",
  };
}

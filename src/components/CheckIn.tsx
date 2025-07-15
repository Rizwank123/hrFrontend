/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useRef, useEffect } from "react";
import { format } from "date-fns";
import { Camera, X } from "lucide-react";
import api from "../lib/axios";
import { toast } from "react-hot-toast";

interface CheckInProps {
  employeeId: string;
  onSuccess: () => void;
  onClose: () => void;
}

// Define a type for API error responses
interface ApiErrorResponse {
  response?: {
    data?: {
      message?: string;
    };
  };
  message?: string;
}

const CheckIn = ({ employeeId, onSuccess, onClose }: CheckInProps) => {
  const [checkInType, setCheckInType] = useState<"FIELD" | "OFFICE" | null>(
    null
  );
  const [showCamera, setShowCamera] = useState(false);
  const [location, setLocation] = useState<string>("");
  const [cameraInitialized, setCameraInitialized] = useState(false);
  const [streamActive, setStreamActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [checking, setChecking] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Clean up camera resources when component unmounts
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Check if user already checked in today
  const checkAlreadyCheckedIn = async () => {
    try {
      setChecking(true);
      const today = format(new Date(), "yyyy-MM-dd");

      // Make API call to check today's attendance status
      const response = await api.post(`/attendance/employee`, {
        params: {
          employee_id: employeeId,
          from_date: today,
          to_date: today,
        },
      });

      // If the response indicates user already checked in
      if (response.data.data?.checked_in) {
        toast.error("You have already checked in for today");
        onClose(); // Close the check-in dialog
        return true;
      }

      return false;
    } catch (error) {
      console.error("Error checking attendance status:", error);
      // In case of error, proceed with check-in to avoid blocking the user
      return false;
    } finally {
      setChecking(false);
    }
  };

  // Handle location fetch
  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const locationString = `Longitude:${position.coords.longitude}, Latitude: ${position.coords.latitude}, timestamp: ${position.timestamp}`;
          setLocation(locationString);
        },
        (error) => {
          console.error("Error getting location:", error);
          toast.error("Failed to get location");
        }
      );
    }
  };

  // Improved setupCamera function
  const setupCamera = async () => {
    try {
      // Reset states
      setCameraError(null);
      setCameraInitialized(false);
      setStreamActive(false);

      // Stop any existing stream first
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

      console.log("Requesting camera access...");

      // Request camera with simpler constraints first
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });

      console.log("Camera access granted, stream obtained");

      // Save reference to stream for cleanup
      streamRef.current = stream;

      if (videoRef.current) {
        // Set srcObject directly
        videoRef.current.srcObject = stream;

        // Set up event listeners
        const handleVideoReady = () => {
          console.log("Video ready state:", videoRef.current?.readyState);
          if (videoRef.current && videoRef.current.readyState >= 2) {
            // HAVE_CURRENT_DATA or higher
            setCameraInitialized(true);
            setStreamActive(true);
            console.log("Camera initialized successfully");

            // Remove event listeners once initialized
            videoRef.current?.removeEventListener(
              "loadeddata",
              handleVideoReady
            );
            videoRef.current?.removeEventListener("canplay", handleVideoReady);
          }
        };

        // Add multiple event listeners to ensure we catch when video is ready
        videoRef.current.addEventListener("loadeddata", handleVideoReady);
        videoRef.current.addEventListener("canplay", handleVideoReady);

        // Force play the video
        try {
          await videoRef.current.play();
          console.log("Play command issued");
        } catch (err) {
          console.error("Error playing video:", err);
          setCameraError(
            "Failed to play video: " +
            (err instanceof Error ? err.message : String(err))
          );
        }
      }

      // Show camera UI regardless, even if not fully initialized yet
      setShowCamera(true);

      // Safety timeout - if camera doesn't initialize within 5 seconds, show error
      setTimeout(() => {
        if (!cameraInitialized && !cameraError) {
          console.warn("Camera initialization timeout");
          setCameraError("Camera initialization timed out. Try refreshing.");
        }
      }, 5000);
    } catch (error) {
      console.error("Error accessing camera:", error);
      setCameraError(
        `Failed to access camera: ${error instanceof Error ? error.message : "Unknown error"
        }`
      );
      toast.error(
        `Camera access failed: ${error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  // Upload image and then check in
  const uploadImageAndCheckIn = async (imageBlob: Blob) => {
    try {
      // First check if already checked in today
      const alreadyCheckedIn = await checkAlreadyCheckedIn();
      if (alreadyCheckedIn) return;

      setUploading(true);

      // Create form data for image upload
      const formData = new FormData();
      formData.append("file", imageBlob, "check-in-image.jpg");

      // Log the FormData entries for debugging
      for (const [key, value] of formData.entries()) {
        console.log("key: " + key, "value: " + value);
      }

      // Upload the image first
      const uploadResponse = await api.post("/attendance/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },

      });

     
      // Get the returned image URL
      const imageUrl = uploadResponse.data.data;
      console.log("Image uploaded successfully, URL:", imageUrl);

      // Now proceed with check-in using the returned URL
      await performCheckIn(imageUrl);
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Failed to upload image");
      setUploading(false);
    }
  };

  // Perform the actual check-in
  const performCheckIn = async (imageUrl?: string) => {
    try {
      const now = new Date();
      // Add timezone offset to get UTC time
      const utcTime = new Date(now.getTime() - (now.getTimezoneOffset() * 60000));
      //format(utcTime, "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'")
      const checkInData = {
        employee_id: employeeId,
        check_in_type: checkInType || "OFFICE", // Ensure type is never null
        check_in_time: utcTime,
        ...(checkInType === "FIELD" && {
          image_url: imageUrl, // Changed from images to image_url
          location: location,
        }),
      };
      console.log(utcTime)
      console.log('Check-in data:', checkInData);

      console.log('Sending check-in data:', checkInData);
      await api.post("/attendance/check-in", checkInData);
      toast.success("Checked in successfully");
      onSuccess();
      // Clean up camera resources before closing
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      onClose();
    } catch (error: unknown) {
      console.error("Error during check-in:", error);

      // Properly handle unknown error type
      let errorMessage = "Failed to check in";

      // Check if error matches our ApiErrorResponse interface
      const apiError = error as ApiErrorResponse;
      if (apiError.response?.data?.message) {
        errorMessage = apiError.response.data.message;
      } else if (apiError.message) {
        errorMessage = apiError.message;
      }

      toast.error(errorMessage);
      setUploading(false);
      onClose();
    }
  };

  // Handle office check-in (no image needed)
  const handleOfficeCheckIn = async () => {
    // First check if already checked in today
    const alreadyCheckedIn = await checkAlreadyCheckedIn();
    if (alreadyCheckedIn) return;

    setCheckInType("OFFICE");
    performCheckIn();
  };

  // Initiate field check-in process
  const handleFieldCheckIn = async () => {
    // First check if already checked in today
    const alreadyCheckedIn = await checkAlreadyCheckedIn();
    if (alreadyCheckedIn) return;

    setCheckInType("FIELD");
    getLocation(); // Get location
    setupCamera(); // Setup camera
  };

  // Capture image function
  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;

      // Make sure video is really playing and has dimensions
      if (!video.videoWidth || !video.videoHeight) {
        toast.error("Video stream not ready yet. Please wait.");
        return;
      }

      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw current video frame to canvas
      const context = canvas.getContext("2d");
      if (context) {
        try {
          context.drawImage(video, 0, 0, canvas.width, canvas.height);

          // Convert canvas to blob instead of base64
          canvas.toBlob(
            (blob) => {
              if (blob) {
                // Upload the image blob and check in
                console.log("Captured image, size:", blob.size);
                uploadImageAndCheckIn(blob);
              } else {
                toast.error("Failed to capture image");
              }
            },
            "image/jpeg",
            0.8
          ); // Use 80% quality JPEG
        } catch (err) {
          console.error("Error capturing image:", err);
          toast.error("Failed to capture image");
        }
      }
    } else {
      toast.error("Camera not initialized properly");
    }
  };

  // Force reinitialization if needed
  const handleRetryCamera = () => {
    console.log("Retrying camera setup...");
    setupCamera();
  };

  // Initial check on component mount
  useEffect(() => {
    // Check if already checked in when the component mounts
    checkAlreadyCheckedIn();
  }, []);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Check In</h2>
          <button
            onClick={() => {
              // Stop camera when closing
              if (streamRef.current) {
                streamRef.current.getTracks().forEach((track) => track.stop());
              }
              onClose();
            }}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {checking && (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-2">Checking attendance status...</p>
          </div>
        )}

        {!checking && !checkInType ? (
          <div className="space-y-4">
            <button
              onClick={handleOfficeCheckIn}
              className="w-full p-4 text-left border rounded-lg hover:bg-gray-50"
              disabled={checking}
            >
              Office
            </button>
            <button
              onClick={handleFieldCheckIn}
              className="w-full p-4 text-left border rounded-lg hover:bg-gray-50"
              disabled={checking}
            >
              Field
            </button>
          </div>
        ) : showCamera ? (
          <div className="space-y-4">
            {(!cameraInitialized && !cameraError) || uploading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-2">
                  {uploading ? "Uploading image..." : "Initializing camera..."}
                </p>
              </div>
            ) : null}

            {cameraError && (
              <div className="p-4 bg-red-50 text-red-600 rounded-lg">
                <p>{cameraError}</p>
                <button
                  onClick={handleRetryCamera}
                  className="mt-2 bg-red-100 text-red-700 px-3 py-1 rounded-md text-sm"
                >
                  Retry Camera
                </button>
              </div>
            )}

            <div
              className={`relative rounded-lg overflow-hidden border ${!cameraInitialized && !cameraError
                ? "min-h-[240px] bg-gray-100"
                : ""
                }`}
            >
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full rounded-lg bg-gray-100"
                style={{
                  minHeight: "240px",
                  display: cameraInitialized && !uploading ? "block" : "none",
                }}
              />

              {/* Show placeholder when stream is active but not displaying */}
              {streamActive && !cameraInitialized && !cameraError && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                  <p>Preparing video stream...</p>
                </div>
              )}
            </div>

            {/* Hidden canvas for image capture */}
            <canvas ref={canvasRef} className="hidden" />

            <div className="text-center">
              {cameraInitialized && !uploading ? (
                <button
                  onClick={captureImage}
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
                  disabled={uploading}
                >
                  <Camera className="w-5 h-5 inline-block mr-2" />
                  Capture Image
                </button>
              ) : (
                <p className="text-amber-600">
                  {uploading
                    ? "Processing..."
                    : cameraError
                      ? "Please retry camera access"
                      : "Please allow camera access when prompted"}
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-2">Processing...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CheckIn;
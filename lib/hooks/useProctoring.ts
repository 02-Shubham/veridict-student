import { useState, useEffect, useRef, useCallback } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as cocossd from '@tensorflow-models/coco-ssd';
import { violationController } from '../security/ViolationController';

export const useProctoring = () => {
    const [model, setModel] = useState<cocossd.ObjectDetection | null>(null);
    const [isModelLoading, setIsModelLoading] = useState(true);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const requestRef = useRef<number>(null);

    // Load the COCO-SSD model
    useEffect(() => {
        const loadModel = async () => {
            try {
                await tf.ready();
                const loadedModel = await cocossd.load({ base: 'lite_mobilenet_v2' });
                setModel(loadedModel);
                setIsModelLoading(false);
                console.log("Proctoring Model Loaded Successfully");
            } catch (error) {
                console.error("Failed to load proctoring model:", error);
                setIsModelLoading(false);
            }
        };
        loadModel();
    }, []);

    // Set up the webcam stream
    const startWebcam = useCallback(async () => {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: 'user', width: 640, height: 480 },
                });
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.play();
                }
            } catch (error) {
                console.error("Error accessing webcam:", error);
            }
        }
    }, []);

    const stopWebcam = useCallback(() => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach((track) => track.stop());
        }
    }, []);

    // ref to hold the newest detectFrame so setTimeout can access it without hoisting issues
    const detectFrameRef = useRef<() => void>(() => { });

    const detectFrame = useCallback(async () => {
        if (!model || !videoRef.current || videoRef.current.readyState !== 4) return;

        // Skip detection if exam is already terminated
        if (violationController.isTerminated()) return;

        if (videoRef.current.videoWidth > 0 && videoRef.current.videoHeight > 0) {
            const predictions = await model.detect(videoRef.current);

            // Draw predictions to canvas if provided
            if (canvasRef.current) {
                const ctx = canvasRef.current.getContext('2d');
                if (ctx) {
                    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
                    predictions.forEach(prediction => {
                        const [x, y, width, height] = prediction.bbox;
                        // Only draw boxes for cell phones for testing visibility
                        if (prediction.class === 'cell phone') {
                            ctx.strokeStyle = 'red';
                            ctx.lineWidth = 4;
                            ctx.strokeRect(x, y, width, height);
                            ctx.fillStyle = 'red';
                            ctx.font = '18px Arial';
                            ctx.fillText(`cell phone (${Math.round(prediction.score * 100)}%)`, x, y > 20 ? y - 5 : 20);
                        }
                    });
                }
            }

            // --- Violation Logic ---

            // 1. Detect Cell Phones
            const cellPhones = predictions.filter((p) => p.class === 'cell phone');
            if (cellPhones.length > 0) {
                violationController.registerViolation('CELL_PHONE', 'Cell phone detected in webcam view');
            }

            // 2. Detect Missing Person (Left the screen)
            const people = predictions.filter((p) => p.class === 'person');
            if (people.length === 0) {
                violationController.registerViolation('NO_PERSON', 'No person detected in webcam view');
            }
        }

        // Continue the loop if not terminated
        if (!violationController.isTerminated()) {
            // Run inference around every 1 second instead of every frame to save CPU
            setTimeout(() => {
                requestRef.current = requestAnimationFrame(detectFrameRef.current);
            }, 1000);
        } else {
            stopWebcam();
        }
    }, [model, stopWebcam]);

    // Update the ref to the latest detectFrame whenever it changes
    useEffect(() => {
        detectFrameRef.current = detectFrame;
    }, [detectFrame]);

    useEffect(() => {
        // Start detection loop once model is loaded and we have video
        if (!isModelLoading && model) {
            startWebcam().then(() => {
                // Add a small delay for the video to actually start playing
                setTimeout(() => {
                    requestRef.current = requestAnimationFrame(detectFrameRef.current);
                }, 1000);
            });
        }
        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
            stopWebcam();
        };
    }, [isModelLoading, model, startWebcam, stopWebcam]);

    return {
        videoRef,
        canvasRef,
        isModelLoading
    };
};



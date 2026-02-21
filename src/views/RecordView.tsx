import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, Square, Loader2, ArrowLeft } from 'lucide-react';
import { clsx } from 'clsx';
import { audioRecorder } from '../services/audioRecorder';
import { getOrCreateDayForDate, addEntry, setEntryAudio } from '../services/db';
import { addToQueue } from '../services/queueService'; // Vi förbereder för AI-kön (Steg 3)

export const RecordView = () => {
  const navigate = useNavigate();
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [duration, setDuration] = useState(0);
  const [amplitude, setAmplitude] = useState(0);

  // Timer och ljudvåg
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isRecording) {
      interval = setInterval(async () => {
        setDuration(d => d + 1);
        const amp = await audioRecorder.getNativeAmplitude();
        setAmplitude(amp);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const handleStartRecording = async () => {
    try {
      await audioRecorder.start();
      setIsRecording(true);
      setDuration(0);
    } catch (e: any) {
      alert("Kunde inte starta mikrofonen: " + e.message);
    }
  };

  const handleStopRecording = async () => {
    setIsRecording(false);
    setIsProcessing(true);

    try {
      const blob = await audioRecorder.stop();

      // 1. Hämta eller skapa Dagens Day
      const todayString = new Date().toISOString().split('T')[0]; // "2026-02-20"
      const day = await getOrCreateDayForDate(todayString);

      // 2. Skapa ett nytt Entry (addEntry returnerar det nya id:t)
      const now = new Date();
      const entryId = await addEntry({
        dayId: day.id,
        createdAt: now.toISOString(),
        isTranscribed: false
      });

      // 3. Spara ljudfilen kopplat till detta Entry
      await setEntryAudio(entryId, blob, blob.type);

      // 4. Lägg inlägget i kön för att transkriberas (Steg 3)
      addToQueue(entryId, 'audio');

      // Gå till Dashboard/Dagboken när det är klart
      navigate('/');
    } catch (e: any) {
      alert("Kunde inte spara inlägget: " + e.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col relative pb-20">

      {/* HEADER */}
      <div className="bg-white p-6 pb-4 shadow-sm relative z-10 flex items-center">
        <button onClick={() => navigate(-1)} className="p-2 bg-gray-100 rounded-full text-gray-600 hover:bg-gray-200 transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold ml-4 text-gray-800">Nytt Inlägg</h1>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 mt-[-10vh]">

        {/* TIMER & VÅG */}
        <div className="text-center mb-16">
          <div className={clsx("text-6xl font-light mb-8 transition-colors duration-500", isRecording ? "text-red-500" : "text-gray-300")}>
            {formatTime(duration)}
          </div>

          <div className="h-24 flex items-end justify-center gap-1 opacity-80">
            {Array.from({ length: 30 }).map((_, i) => {
              const baseHeight = 8;
              const randomScale = isRecording ? Math.random() : 0.1;
              const height = baseHeight + (amplitude * 100 * randomScale);
              return (
                <div
                  key={i}
                  className={clsx("w-2 rounded-full transition-all duration-150", isRecording ? "bg-red-500" : "bg-gray-200")}
                  style={{ height: `${Math.max(baseHeight, Math.min(height, 96))}px` }}
                />
              );
            })}
          </div>
        </div>

        {/* INSPELNINGSKNAPPEN */}
        <div className="relative">
          {isRecording && (
            <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-20 scale-150"></div>
          )}

          <button
            onClick={isRecording ? handleStopRecording : handleStartRecording}
            disabled={isProcessing}
            className={clsx(
              "w-28 h-28 rounded-full flex items-center justify-center shadow-xl z-10 relative transition-all duration-300",
              isRecording ? "bg-white text-red-500 scale-110" : "bg-red-500 text-white hover:scale-105 active:scale-95",
              isProcessing && "opacity-50 cursor-not-allowed"
            )}
          >
            {isProcessing ? (
              <Loader2 className="animate-spin" size={40} />
            ) : isRecording ? (
              <Square fill="currentColor" size={40} />
            ) : (
              <Mic fill="currentColor" size={50} />
            )}
          </button>
        </div>

        <p className="mt-8 text-gray-400 font-medium tracking-wide uppercase text-sm">
          {isRecording ? "Tryck för att stoppa" : "Tryck för att prata"}
        </p>
      </div>
    </div>
  );
};

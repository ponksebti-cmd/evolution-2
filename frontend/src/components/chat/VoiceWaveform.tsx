import { motion } from 'framer-motion';

interface VoiceWaveformProps {
  isRecording: boolean;
}

export default function VoiceWaveform({ isRecording }: VoiceWaveformProps) {
  if (!isRecording) return null;

  // More playful and varied waveform bars
  const bars = [
    { heights: ['4px', '12px', '6px', '14px', '5px'], delay: 0, duration: 0.5 },
    { heights: ['6px', '18px', '10px', '20px', '8px'], delay: 0.05, duration: 0.6 },
    { heights: ['5px', '24px', '12px', '22px', '7px'], delay: 0.1, duration: 0.55 },
    { heights: ['8px', '20px', '14px', '18px', '10px'], delay: 0.15, duration: 0.65 },
    { heights: ['4px', '16px', '8px', '18px', '6px'], delay: 0.2, duration: 0.5 },
    { heights: ['7px', '22px', '11px', '20px', '9px'], delay: 0.25, duration: 0.6 },
    { heights: ['5px', '14px', '7px', '16px', '6px'], delay: 0.3, duration: 0.55 },
  ];

  return (
    <div className="flex items-center justify-center gap-[3px] h-6">
      {bars.map((bar, i) => (
        <motion.div
          key={i}
          initial={{ height: '4px', scaleY: 0 }}
          animate={{
            height: bar.heights,
            scaleY: 1,
          }}
          exit={{ 
            scaleY: 0,
            transition: { duration: 0.2 }
          }}
          transition={{
            height: {
              duration: bar.duration,
              repeat: Infinity,
              ease: [0.45, 0, 0.55, 1],
              delay: bar.delay,
              repeatType: 'reverse',
            },
            scaleY: {
              duration: 0.3,
              ease: [0.16, 1, 0.3, 1]
            }
          }}
          className="w-[2px] bg-white rounded-full"
        />
      ))}
    </div>
  );
}

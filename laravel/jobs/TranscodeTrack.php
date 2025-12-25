<?php

namespace App\Jobs;

use App\Models\Track;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class TranscodeTrack implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $timeout = 600; // 10 minutes
    public $tries = 3;

    public function __construct(
        public int $trackId
    ) {}

    public function handle(): void
    {
        $track = Track::findOrFail($this->trackId);

        try {
            Log::info("Starting transcode for track {$track->id}");

            // Create temp directory
            $tempDir = '/tmp/transcode/' . Str::uuid();
            if (!is_dir($tempDir)) {
                mkdir($tempDir, 0755, true);
            }

            // Download source file from S3
            $sourceFile = $tempDir . '/source.' . pathinfo($track->source_path, PATHINFO_EXTENSION);
            $sourceContent = Storage::disk('s3')->get($track->source_path);
            file_put_contents($sourceFile, $sourceContent);

            // Output MP3 file
            $outputFile = $tempDir . '/output.mp3';

            // Transcode to MP3 using FFmpeg
            $ffmpegCmd = sprintf(
                'docker exec sc_ffmpeg ffmpeg -i %s -acodec libmp3lame -b:a 192k -ar 44100 %s 2>&1',
                escapeshellarg('/work' . str_replace('/var/www/html', '', $sourceFile)),
                escapeshellarg('/work' . str_replace('/var/www/html', '', $outputFile))
            );

            // Alternative: if running inside container with ffmpeg
            $ffmpegCmd = sprintf(
                'ffmpeg -i %s -acodec libmp3lame -b:a 192k -ar 44100 %s 2>&1',
                escapeshellarg($sourceFile),
                escapeshellarg($outputFile)
            );

            exec($ffmpegCmd, $output, $returnCode);

            if ($returnCode !== 0 || !file_exists($outputFile)) {
                Log::error("FFmpeg transcode failed for track {$track->id}", [
                    'output' => implode("\n", $output),
                    'return_code' => $returnCode,
                ]);
                throw new \Exception('Transcode failed');
            }

            // Get duration
            $durationCmd = sprintf(
                'ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 %s',
                escapeshellarg($outputFile)
            );
            $duration = trim(shell_exec($durationCmd));
            $durationSeconds = $duration ? (int) round((float) $duration) : null;

            // Generate waveform data (simplified - just sample points)
            $waveform = $this->generateWaveform($outputFile);

            // Upload transcoded file to S3
            $audioPath = 'audio/' . Str::uuid() . '.mp3';
            Storage::disk('s3')->put($audioPath, file_get_contents($outputFile));

            // Update track
            $track->update([
                'audio_path' => $audioPath,
                'duration_seconds' => $durationSeconds,
                'waveform' => $waveform,
            ]);

            // Clean up temp files
            @unlink($sourceFile);
            @unlink($outputFile);
            @rmdir($tempDir);

            Log::info("Successfully transcoded track {$track->id}");

        } catch (\Exception $e) {
            Log::error("Error transcoding track {$track->id}: " . $e->getMessage());
            
            // Mark track as rejected on failure
            $track->update(['status' => 'rejected']);
            
            throw $e;
        }
    }

    private function generateWaveform(string $audioFile): array
    {
        // Simple waveform generation - you can make this more sophisticated
        // This creates 100 sample points representing amplitude
        
        $samples = 100;
        $waveform = [];

        // Use FFmpeg to extract amplitude data
        $cmd = sprintf(
            'ffmpeg -i %s -ac 1 -filter:a aresample=8000 -map 0:a -c:a pcm_s16le -f data - 2>/dev/null | od -A n -t dI -v',
            escapeshellarg($audioFile)
        );

        $output = shell_exec($cmd);
        
        if ($output) {
            $values = array_filter(array_map('intval', explode(' ', $output)));
            $values = array_values($values);
            
            if (count($values) > 0) {
                $chunkSize = max(1, (int) floor(count($values) / $samples));
                
                for ($i = 0; $i < $samples; $i++) {
                    $offset = $i * $chunkSize;
                    $chunk = array_slice($values, $offset, $chunkSize);
                    
                    if (!empty($chunk)) {
                        $avg = array_sum($chunk) / count($chunk);
                        // Normalize to 0-100
                        $waveform[] = min(100, max(0, abs($avg) / 32768 * 100));
                    } else {
                        $waveform[] = 0;
                    }
                }
                
                return $waveform;
            }
        }

        // Fallback: random-looking waveform
        for ($i = 0; $i < $samples; $i++) {
            $waveform[] = rand(20, 80);
        }

        return $waveform;
    }
}


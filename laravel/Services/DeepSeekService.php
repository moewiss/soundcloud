<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class DeepSeekService
{
    private string $apiKey;
    private string $baseUrl;

    public function __construct()
    {
        $this->apiKey = config('services.deepseek.api_key', env('DEEPSEEK_API_KEY', ''));
        $this->baseUrl = config('services.deepseek.base_url', env('DEEPSEEK_BASE_URL', 'https://api.deepseek.com'));
    }

    /**
     * Get AI-powered recommendations for a user.
     *
     * @param array $userProfile  ['liked_tracks' => [...], 'top_categories' => [...], 'top_tags' => [...]]
     * @param array $candidates   [['id' => ..., 'title' => ..., 'category' => ..., 'tags' => [...], 'likes' => ..., 'plays' => ...], ...]
     * @return array              [['track_id' => ..., 'score' => ..., 'reason' => ...], ...]
     */
    public function getRecommendations(array $userProfile, array $candidates): array
    {
        if (empty($this->apiKey) || empty($candidates)) {
            return [];
        }

        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->apiKey,
                'Content-Type' => 'application/json',
            ])
            ->timeout(30)
            ->post($this->baseUrl . '/chat/completions', [
                'model' => 'deepseek-chat',
                'messages' => [
                    [
                        'role' => 'system',
                        'content' => 'You are a music recommendation engine for Nashidify, an Islamic audio platform with nasheeds, Quran recitations, duas, lectures, and podcasts. Given a user\'s taste profile and candidate tracks, return the best recommendations ranked by relevance. Consider semantic similarity of titles, categories, tags, and Islamic content themes (e.g. a nasheed about patience is similar to one about sabr). Return ONLY valid JSON: {"recommendations": [{"track_id": int, "score": float 0-1, "reason": "short reason"}]}',
                    ],
                    [
                        'role' => 'user',
                        'content' => json_encode([
                            'user_profile' => $userProfile,
                            'candidates' => $candidates,
                        ]),
                    ],
                ],
                'response_format' => ['type' => 'json_object'],
                'temperature' => 0.3,
                'max_tokens' => 2000,
            ]);

            if ($response->successful()) {
                $data = json_decode($response->json('choices.0.message.content', '{}'), true);
                return $data['recommendations'] ?? [];
            }

            Log::warning('DeepSeek API error: ' . $response->status() . ' ' . $response->body());
            return [];
        } catch (\Exception $e) {
            Log::error('DeepSeek API exception: ' . $e->getMessage());
            return [];
        }
    }

    /**
     * Get similarity-based recommendations for "Because You Liked [X]".
     */
    public function getSimilarTracks(array $sourceTrack, array $candidates): array
    {
        if (empty($this->apiKey) || empty($candidates)) {
            return [];
        }

        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->apiKey,
                'Content-Type' => 'application/json',
            ])
            ->timeout(30)
            ->post($this->baseUrl . '/chat/completions', [
                'model' => 'deepseek-chat',
                'messages' => [
                    [
                        'role' => 'system',
                        'content' => 'You are a music similarity engine for Nashidify, an Islamic audio platform. Given a source track the user liked and candidate tracks, rank candidates by semantic similarity to the source. Consider title meaning, Islamic themes, mood, and content type. Return ONLY valid JSON: {"recommendations": [{"track_id": int, "score": float 0-1, "reason": "short reason"}]}',
                    ],
                    [
                        'role' => 'user',
                        'content' => json_encode([
                            'source_track' => $sourceTrack,
                            'candidates' => $candidates,
                        ]),
                    ],
                ],
                'response_format' => ['type' => 'json_object'],
                'temperature' => 0.3,
                'max_tokens' => 1500,
            ]);

            if ($response->successful()) {
                $data = json_decode($response->json('choices.0.message.content', '{}'), true);
                return $data['recommendations'] ?? [];
            }

            return [];
        } catch (\Exception $e) {
            Log::error('DeepSeek similarity exception: ' . $e->getMessage());
            return [];
        }
    }

    /**
     * Parse a natural language search query into structured intent.
     *
     * @return array|null  {mood, category, duration_preference, artist_name, concepts[], suggestion_text}
     */
    public function parseSearchQuery(string $query): ?array
    {
        if (empty($this->apiKey) || strlen($query) < 2) {
            return null;
        }

        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->apiKey,
                'Content-Type' => 'application/json',
            ])
            ->timeout(8)
            ->post($this->baseUrl . '/chat/completions', [
                'model' => 'deepseek-chat',
                'messages' => [
                    [
                        'role' => 'system',
                        'content' => 'You are a search intent parser for Nashidify, an Islamic audio platform with nasheeds, Quran recitations, duas, lectures, and podcasts. Given a user\'s search query, extract the intent. Return ONLY valid JSON: {"mood": string|null, "category": "Nasheeds"|"Quran"|"Duas"|"Lectures"|"Podcasts"|"Stories"|null, "duration_preference": "short"|"medium"|"long"|null, "artist_name": string|null, "concepts": ["keyword1","keyword2"], "suggestion_text": "short human-readable description of what user wants"}',
                    ],
                    [
                        'role' => 'user',
                        'content' => $query,
                    ],
                ],
                'response_format' => ['type' => 'json_object'],
                'temperature' => 0.1,
                'max_tokens' => 300,
            ]);

            if ($response->successful()) {
                $data = json_decode($response->json('choices.0.message.content', '{}'), true);
                return $data;
            }

            return null;
        } catch (\Exception $e) {
            Log::warning('DeepSeek search parse timeout/error: ' . $e->getMessage());
            return null;
        }
    }
}

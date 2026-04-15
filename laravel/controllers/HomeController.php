<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\HomePageService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class HomeController extends Controller
{
    public function index(Request $request, HomePageService $service)
    {
        $this->resolveAuthFromToken($request);
        return response()->json($service->build(auth()->user()));
    }

    /**
     * Resolve user from Bearer token on public routes and set auth guard.
     */
    private function resolveAuthFromToken(Request $request): void
    {
        if (!auth()->check() && $request->bearerToken()) {
            $token = \Laravel\Sanctum\PersonalAccessToken::findToken($request->bearerToken());
            if ($token) {
                auth()->setUser($token->tokenable);
            }
        }
    }

    /**
     * Update listen progress for a play event.
     */
    public function updatePlayEvent(Request $request)
    {
        $request->validate([
            'track_id' => 'required|integer|exists:tracks,id',
            'duration_listened' => 'required|integer|min:0',
        ]);

        // Update the most recent play event for this user+track
        DB::table('play_events')
            ->where('user_id', $request->user()->id)
            ->where('track_id', $request->track_id)
            ->orderByDesc('played_at')
            ->limit(1)
            ->update(['duration_listened' => $request->duration_listened]);

        return response()->json(['ok' => true]);
    }
}

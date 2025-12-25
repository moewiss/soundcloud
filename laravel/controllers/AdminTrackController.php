<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Track;
use Illuminate\Http\Request;

class AdminTrackController extends Controller
{
    public function pending()
    {
        $tracks = Track::pending()
            ->with(['user.profile'])
            ->latest()
            ->paginate(20);

        return response()->json($tracks);
    }

    public function approve(Track $track)
    {
        $track->update(['status' => 'approved']);

        return response()->json([
            'message' => 'Track approved successfully',
            'track' => $track,
        ]);
    }

    public function reject(Request $request, Track $track)
    {
        $track->update(['status' => 'rejected']);

        // Optionally notify the user
        // You can add notification logic here

        return response()->json([
            'message' => 'Track rejected successfully',
            'track' => $track,
        ]);
    }

    public function index(Request $request)
    {
        $query = Track::with(['user.profile']);

        // Filter by status
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        $tracks = $query->latest()->paginate(20);

        return response()->json($tracks);
    }
}


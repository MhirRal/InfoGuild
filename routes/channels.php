<?php

use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Support\Facades\Broadcast;

// Channel for online users
Broadcast::channel('online', function (User $user) {
    return $user ? new UserResource($user) : null;
});

// Private message channel between two users
Broadcast::channel('message.user.{userId1}-{userId2}', function (User $user, int $userId1, int $userId2) {
    return $user->id === $userId1 || $user->id === $userId2 ? new UserResource($user) : null;
});

// Group message channel
Broadcast::channel('message.group.{groupId}', function (User $user, int $groupId) {
    return $user->groups->contains('id', $groupId) ? new UserResource($user) : null;
});